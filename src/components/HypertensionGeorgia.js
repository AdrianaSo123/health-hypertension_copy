import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const HypertensionGeorgia = () => {
  const svgRef = useRef(null);
  const [countyData, setCountyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const parseCSV = async () => {
      try {
        console.log("Attempting to fetch CSV file...");
        const response = await fetch('/data/HypertensionCountyData.csv');
        console.log("Fetch response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log("CSV loaded, length:", csvText.length);
        console.log("First 100 chars:", csvText.substring(0, 100));
        
        // Parse CSV data
        const extractedData = [];
        const lines = csvText.split('\n').filter(line => line.trim());
        
        // Skip header line
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const parts = line.split(',');
          
          if (parts.length >= 2) {
            const countyName = parts[0].trim();
            const rateStr = parts[1].trim();
            const rate = parseFloat(rateStr);
            
            if (!isNaN(rate) && rate > 0) {
              extractedData.push({
                county: countyName,
                disease_rate: rate
              });
            }
          }
        }
        
        console.log(`Extracted ${extractedData.length} counties`);
        console.log("Sample counties:", extractedData.slice(0, 3));
        
        if (extractedData.length === 0) {
          throw new Error("No county data extracted from CSV");
        }
        
        setCountyData(extractedData);
        setLoading(false);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    parseCSV();
  }, []);
  
  useEffect(() => {
    if (loading || error || !countyData.length) return;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Map dimensions with increased margins for more spacing
    const width = 800;
    const height = 600;
    const margin = { top: 70, right: 40, bottom: 60, left: 40 };
    
    // Create SVG with a background for better contrast with white text
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);
    
    // Create disease rate lookup for counties
    const rateByCounty = {};
    countyData.forEach(d => {
      const name = d.county.toLowerCase();
      rateByCounty[name] = d.disease_rate;
      rateByCounty[name + " county"] = d.disease_rate;
    });
    
    // Set up color scale
    const minRate = d3.min(countyData, d => d.disease_rate);
    const maxRate = d3.max(countyData, d => d.disease_rate);
    
    console.log(`Disease rate range: ${minRate.toFixed(1)} - ${maxRate.toFixed(1)} per 100,000`);
    
    const colorScale = d3.scaleSequential()
  .domain([minRate, maxRate])
  .interpolator(d3.interpolateReds);
    
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
          .style("background", "rgba(0, 0, 0, 0.8)")
          .style("color", "white")
          .style("border", "1px solid #555")
          .style("border-radius", "4px")
          .style("padding", "8px")
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
                if (rateByCounty[variant] !== undefined) {
                  matchedCounties++;
                  return colorScale(rateByCounty[variant]);
                }
              }
            }
            return "#ccc"; // Default color for counties with no data
          })
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .on("mouseover", function(event, d) {
            d3.select(this)
              .attr("stroke", "#fff")
              .attr("stroke-width", 1.5);
            
            const countyName = d.properties.NAME;
            let rate = null;
            
            // Find rate for this county
            const variations = [
              countyName.toLowerCase(),
              countyName.toLowerCase().replace(" county", ""),
              countyName.toLowerCase().replace(" county", "") + " county"
            ];
            
            for (const variant of variations) {
              if (rateByCounty[variant] !== undefined) {
                rate = rateByCounty[variant];
                break;
              }
            }
            
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`
              <strong>${countyName}</strong><br/>
              ${rate !== null ? `${rate.toFixed(1)} per 100,000` : 'No data'}
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
        
        console.log(`Matched ${matchedCounties} counties with disease rate data`);
        
        // Add legend (moved up for more space from bottom)
        const legendWidth = 300;
        const legendHeight = 20;
        const legendX = width - margin.right - legendWidth;
        const legendY = height - margin.bottom + 20;
        
        // Create gradient for legend
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
          .attr("id", "rate-gradient")
          .attr("x1", "0%").attr("x2", "100%").attr("y1", "0%").attr("y2", "0%");
        
        // Add gradient stops
        const stops = 10;
        for (let i = 0; i < stops; i++) {
          gradient.append("stop")
            .attr("offset", `${i * 100 / (stops - 1)}%`)
            .attr("stop-color", colorScale(minRate + (i / (stops - 1)) * (maxRate - minRate)));
        }
        
        // Draw legend rectangle
        svg.append("rect")
          .attr("x", legendX)
          .attr("y", legendY)
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#rate-gradient)");
        
        // Add legend labels with white text
        svg.append("text")
          .attr("x", legendX)
          .attr("y", legendY - 5)
          .style("font-size", "10px")
          .style("text-anchor", "start")
          .style("fill", "white")
          .text(`${minRate.toFixed(1)}`);
        
        svg.append("text")
          .attr("x", legendX + legendWidth / 2)
          .attr("y", legendY - 5)
          .style("font-size", "10px")
          .style("text-anchor", "middle")
          .style("fill", "white")
          .text(`${((minRate + maxRate) / 2).toFixed(1)}`);
        
        svg.append("text")
          .attr("x", legendX + legendWidth)
          .attr("y", legendY - 5)
          .style("font-size", "10px")
          .style("text-anchor", "end")
          .style("fill", "white")
          .text(`${maxRate.toFixed(1)}`);
        
        // Add title (positioned higher from the map)
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", 20)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .style("fill", "white")
          .text("Cardiovascular Disease Rates by County in Georgia");
        
        // Add subtitle (with more space between it and the map)
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", 45)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("fill", "white")
          .text("Rate per 100,000 population (2019)");
      })
      .catch(err => {
        console.error("Error loading GeoJSON:", err);
        setError("Error loading map data: " + err.message);
      });
  }, [countyData, loading, error]);
  
  return (
    <div className="w-full flex flex-col items-center">
      {loading && <p className="text-white">Loading data...</p>}
      {error && (
        <div className="text-center my-4">
          <p className="text-red-500 font-bold">Error: {error}</p>
          <p className="text-white text-sm mt-2">
            Please check that your CSV file is in the correct location: /public/data/HypertensionCountyData.csv
          </p>
        </div>
      )}
      <svg ref={svgRef} className="max-w-full h-auto"></svg>
      {countyData.length > 0 && (
        <p className="text-sm mt-2 text-white">
          Showing cardiovascular disease rates for {countyData.length} Georgia counties
        </p>
      )}
    </div>
  );
};

export default HypertensionGeorgia;