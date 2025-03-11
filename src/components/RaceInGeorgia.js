import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';

const BlackPopulationGeorgia = () => {
  const svgRef = useRef(null);
  const [countyData, setCountyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadCSV = async () => {
      try {
        console.log("Attempting to fetch CSV file...");
        // For deployment, the file should be in the public directory
        const response = await fetch('/data/georgia race population - Sheet1.csv');
        console.log("Fetch response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log("CSV loaded, length:", csvText.length);
        console.log("First 100 chars:", csvText.substring(0, 100));
        
        // Parse CSV using PapaParse
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log("Parse results:", results);
            
            if (results.errors && results.errors.length > 0) {
              console.error("CSV parsing errors:", results.errors);
            }
            
            // Extract county and black population percentage data
            // Assuming the CSV has columns 'County' and 'Value' or similar
            // Adjust field names as needed based on your actual CSV structure
            const extractedData = results.data.map(row => ({
              county: row.County || '',
              value: parseFloat(row.Value || 0)
            })).filter(item => item.county && !isNaN(item.value));
            
            console.log(`Extracted ${extractedData.length} counties`);
            console.log("Sample counties:", extractedData.slice(0, 3));
            
            if (extractedData.length === 0) {
              throw new Error("No county data extracted from CSV");
            }
            
            setCountyData(extractedData);
            setLoading(false);
          },
          error: (error) => {
            console.error("Papa Parse error:", error);
            setError("Error parsing CSV: " + error.message);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("Error loading CSV:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadCSV();
  }, []);
  
  useEffect(() => {
    if (loading || error || !countyData.length) return;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Map dimensions with increased margins for more spacing
    const width = 800;
    const height = 600;
    const margin = { top: 70, right: 40, bottom: 60, left: 40 };
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);
    
    // Create percentage lookup for counties
    const percentByCounty = {};
    countyData.forEach(d => {
      const name = d.county.toLowerCase();
      percentByCounty[name] = d.value;
      percentByCounty[name + " county"] = d.value;
    });
    
    // Set up color scale - using blues for black population percentage
    const minPercent = d3.min(countyData, d => d.value);
    const maxPercent = d3.max(countyData, d => d.value);
    
    console.log(`Black population percentage range: ${minPercent.toFixed(1)}% - ${maxPercent.toFixed(1)}%`);
    
    // Using blues color scheme (darker blue for higher percentage)
    const colorScale = d3.scaleSequential()
      .domain([minPercent, maxPercent])
      .interpolator(d3.interpolateBlues);
    
    // Fetch Georgia counties GeoJSON
    fetch("https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json")
      .then(response => response.json())
      .then(geojson => {
        // Filter for Georgia counties (FIPS codes starting with 13)
        const georgiaCounties = geojson.features.filter(feature => 
          feature.id && feature.id.toString().startsWith('13')
        );
        
        console.log(`Found ${georgiaCounties.length} Georgia counties in GeoJSON`);
        
        const georgiaGeoJSON = {
          type: "FeatureCollection",
          features: georgiaCounties
        };
        
        // Set up projection
        const projection = d3.geoMercator()
          .fitSize([width - margin.left - margin.right, 
                  height - margin.top - margin.bottom], 
                  georgiaGeoJSON);
        
        const path = d3.geoPath().projection(projection);
        
        // Create tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "rgba(255, 255, 255, 0.9)")
          .style("color", "#333")
          .style("border", "1px solid #555")
          .style("border-radius", "4px")
          .style("padding", "8px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("opacity", 0);
        
        // Track matching for debugging
        let matchedCounties = 0;
        
        // Draw counties
        svg.append("g")
          .attr("transform", `translate(${margin.left}, ${margin.top})`)
          .selectAll("path")
          .data(georgiaCounties)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", d => {
            if (d && d.properties) {
              const countyName = d.properties.NAME;
              
              // Try different variations to match county names
              const variations = [
                countyName.toLowerCase(),
                countyName.toLowerCase().replace(" county", ""),
                countyName.toLowerCase().replace(" county", "") + " county"
              ];
              
              // Find matching county in our data
              for (const variant of variations) {
                if (percentByCounty[variant] !== undefined) {
                  matchedCounties++;
                  return colorScale(percentByCounty[variant]);
                }
              }
            }
            return "#ccc"; // Default color for counties with no data
          })
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .on("mouseover", function(event, d) {
            d3.select(this)
              .attr("stroke", "#000")
              .attr("stroke-width", 1.5);
            
            const countyName = d.properties.NAME;
            let percent = null;
            
            // Find percentage for this county
            const variations = [
              countyName.toLowerCase(),
              countyName.toLowerCase().replace(" county", ""),
              countyName.toLowerCase().replace(" county", "") + " county"
            ];
            
            for (const variant of variations) {
              if (percentByCounty[variant] !== undefined) {
                percent = percentByCounty[variant];
                break;
              }
            }
            
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`
              <strong>${countyName}</strong><br/>
              ${percent !== null ? `${percent.toFixed(1)}%` : 'No data'}
            `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 30) + "px");
          })
          .on("mouseout", function() {
            d3.select(this)
              .attr("stroke", "#fff")
              .attr("stroke-width", 0.5);
            
            tooltip.transition().duration(500).style("opacity", 0);
          });
        
        console.log(`Matched ${matchedCounties} counties with black population percentage data`);
        
        // Add legend
        const legendWidth = 300;
        const legendHeight = 20;
        const legendX = width - margin.right - legendWidth;
        const legendY = height - margin.bottom + 20;
        
        // Create gradient for legend
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
          .attr("id", "percent-gradient")
          .attr("x1", "0%").attr("x2", "100%").attr("y1", "0%").attr("y2", "0%");
        
        // Add gradient stops
        const stops = 10;
        for (let i = 0; i < stops; i++) {
          gradient.append("stop")
            .attr("offset", `${i * 100 / (stops - 1)}%`)
            .attr("stop-color", colorScale(minPercent + (i / (stops - 1)) * (maxPercent - minPercent)));
        }
        
        // Draw legend rectangle
        svg.append("rect")
          .attr("x", legendX)
          .attr("y", legendY)
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#percent-gradient)");
        
        // Add legend labels
        svg.append("text")
          .attr("x", legendX)
          .attr("y", legendY - 5)
          .style("font-size", "10px")
          .style("text-anchor", "start")
          .text(`${minPercent.toFixed(1)}%`);
        
        svg.append("text")
          .attr("x", legendX + legendWidth / 2)
          .attr("y", legendY - 5)
          .style("font-size", "10px")
          .style("text-anchor", "middle")
          .text(`${((minPercent + maxPercent) / 2).toFixed(1)}%`);
        
        svg.append("text")
          .attr("x", legendX + legendWidth)
          .attr("y", legendY - 5)
          .style("font-size", "10px")
          .style("text-anchor", "end")
          .text(`${maxPercent.toFixed(1)}%`);
        
        // Add legend title
        svg.append("text")
          .attr("x", legendX + legendWidth / 2)
          .attr("y", legendY + legendHeight + 15)
          .style("font-size", "10px")
          .style("text-anchor", "middle")
          .text("Black Population Percentage");
        
        // Add title
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", 30)
          .attr("text-anchor", "middle")
          .style("font-size", "18px")
          .style("font-weight", "bold")
          .text("Black Population Percentage by County in Georgia");
        
        // Add statistics section
        const statsX = 60;
        const statsY = height - 120;
        
        // Calculate some statistics
        const avgPercent = d3.mean(countyData, d => d.value).toFixed(1);
        const medianPercent = d3.median(countyData, d => d.value).toFixed(1);
        const topCounties = [...countyData].sort((a, b) => b.value - a.value).slice(0, 3);
        const bottomCounties = [...countyData].sort((a, b) => a.value - b.value).slice(0, 3);
        
        // Add stats box
        svg.append("rect")
          .attr("x", statsX - 10)
          .attr("y", statsY - 20)
          .attr("width", 240)
          .attr("height", 120)
          .attr("fill", "rgba(255, 255, 255, 0.8)")
          .attr("rx", 5);
        
        // Add stats text
        svg.append("text")
          .attr("x", statsX)
          .attr("y", statsY)
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .text("Statistics");
        
        svg.append("text")
          .attr("x", statsX)
          .attr("y", statsY + 20)
          .style("font-size", "11px")
          .text(`Average: ${avgPercent}% | Median: ${medianPercent}%`);
        
        svg.append("text")
          .attr("x", statsX)
          .attr("y", statsY + 40)
          .style("font-size", "11px")
          .style("font-weight", "bold")
          .text("Highest:");
        
        topCounties.forEach((county, i) => {
          svg.append("text")
            .attr("x", statsX + 10)
            .attr("y", statsY + 55 + i * 15)
            .style("font-size", "10px")
            .text(`${county.county}: ${county.value.toFixed(1)}%`);
        });
        
        svg.append("text")
          .attr("x", statsX + 120)
          .attr("y", statsY + 40)
          .style("font-size", "11px")
          .style("font-weight", "bold")
          .text("Lowest:");
        
        bottomCounties.forEach((county, i) => {
          svg.append("text")
            .attr("x", statsX + 130)
            .attr("y", statsY + 55 + i * 15)
            .style("font-size", "10px")
            .text(`${county.county}: ${county.value.toFixed(1)}%`);
        });
      })
      .catch(err => {
        console.error("Error loading GeoJSON:", err);
        setError("Error loading map data: " + err.message);
      });
  }, [countyData, loading, error]);
  
  return (
    <div className="w-full flex flex-col items-center">
      {loading && <p>Loading data...</p>}
      {error && (
        <div className="text-center my-4">
          <p className="text-red-500 font-bold">Error: {error}</p>
          <p className="text-sm mt-2">
            Please check that your CSV file is in the correct location: 
            /public/data/georgia race population - Sheet1.csv
          </p>
        </div>
      )}
      <svg ref={svgRef} className="max-w-full h-auto bg-white"></svg>
      {countyData.length > 0 && (
        <p className="text-sm mt-2">
          Showing black population percentages for {countyData.length} Georgia counties
        </p>
      )}
    </div>
  );
};

export default BlackPopulationGeorgia;