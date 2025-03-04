import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const IncomeGeorgiaMap = () => {
  const svgRef = useRef(null);
  const [countyData, setCountyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const parseCSV = async () => {
      try {
        console.log("Attempting to fetch CSV file...");
        const response = await fetch('/data/GeorgiaIncomeData.csv');
        console.log("Fetch response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log("CSV loaded, length:", csvText.length);
        console.log("First 100 chars:", csvText.substring(0, 100));
        
        // Simple parsing approach
        const extractedData = [];
        const lines = csvText.split('\n').filter(line => line.trim());
        
        // Process each line
        for (const line of lines) {
          // Only look for county data lines
          if (line.includes('County') && !line.includes('Georgia,') && !line.includes('United States,')) {
            // Simple CSV parsing with handling for quotes
            const parts = [];
            let currentPart = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                parts.push(currentPart);
                currentPart = '';
              } else {
                currentPart += char;
              }
            }
            
            // Don't forget the last part
            parts.push(currentPart);
            
            // Clean the parts
            const cleanParts = parts.map(part => part.replace(/"/g, '').trim());
            
            let countyName = cleanParts[0];
            
            // Skip if header row
            if (countyName === 'County') continue;
            
            // Get income value from 3rd column
            if (cleanParts.length >= 3) {
              // Remove quotes, commas and other non-numeric chars from value
              const incomeStr = cleanParts[2].replace(/[^0-9.]/g, '');
              const income = parseFloat(incomeStr);
              
              if (!isNaN(income) && income > 0) {
                // Remove "County" suffix for better mapping
                const mappingName = countyName.replace(/ County$/i, '');
                
                extractedData.push({
                  county: mappingName,
                  median_income: income
                });
              }
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
    
    // Create income lookup for counties
    const incomeByCounty = {};
    countyData.forEach(d => {
      const name = d.county.toLowerCase();
      incomeByCounty[name] = d.median_income;
      incomeByCounty[name + " county"] = d.median_income;
    });
    
    // Set up color scale
    const minIncome = d3.min(countyData, d => d.median_income);
    const maxIncome = d3.max(countyData, d => d.median_income);
    
    console.log(`Income range: $${minIncome.toLocaleString()} - $${maxIncome.toLocaleString()}`);
    
    const colorScale = d3.scaleSequential()
      .domain([minIncome, maxIncome])
      .interpolator(d3.interpolateViridis);
    
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
                if (incomeByCounty[variant] !== undefined) {
                  matchedCounties++;
                  return colorScale(incomeByCounty[variant]);
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
            let income = null;
            
            // Find income for this county
            const variations = [
              countyName.toLowerCase(),
              countyName.toLowerCase().replace(" county", ""),
              countyName.toLowerCase().replace(" county", "") + " county"
            ];
            
            for (const variant of variations) {
              if (incomeByCounty[variant] !== undefined) {
                income = incomeByCounty[variant];
                break;
              }
            }
            
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`
              <strong>${countyName}</strong><br/>
              ${income !== null ? `$${income.toLocaleString()}` : 'No data'}
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
        
        console.log(`Matched ${matchedCounties} counties with income data`);
        
        // Add legend (moved up for more space from bottom)
        const legendWidth = 300;
        const legendHeight = 20;
        const legendX = width - margin.right - legendWidth;
        const legendY = height - margin.bottom + 20;
        
        // Create gradient for legend
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
          .attr("id", "income-gradient")
          .attr("x1", "0%").attr("x2", "100%").attr("y1", "0%").attr("y2", "0%");
        
        // Add gradient stops
        const stops = 10;
        for (let i = 0; i < stops; i++) {
          gradient.append("stop")
            .attr("offset", `${i * 100 / (stops - 1)}%`)
            .attr("stop-color", colorScale(minIncome + (i / (stops - 1)) * (maxIncome - minIncome)));
        }
        
        // Draw legend rectangle
        svg.append("rect")
          .attr("x", legendX)
          .attr("y", legendY)
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#income-gradient)");
        
        // Add legend labels with white text
        svg.append("text")
          .attr("x", legendX)
          .attr("y", legendY - 5)
          .style("font-size", "10px")
          .style("text-anchor", "start")
          .style("fill", "white")
          .text(`$${minIncome.toLocaleString()}`);
        
        svg.append("text")
          .attr("x", legendX + legendWidth / 2)
          .attr("y", legendY - 5)
          .style("font-size", "10px")
          .style("text-anchor", "middle")
          .style("fill", "white")
          .text(`$${Math.round((minIncome + maxIncome) / 2).toLocaleString()}`);
        
        svg.append("text")
          .attr("x", legendX + legendWidth)
          .attr("y", legendY - 5)
          .style("font-size", "10px")
          .style("text-anchor", "end")
          .style("fill", "white")
          .text(`$${maxIncome.toLocaleString()}`);
        
        // Add title (positioned higher from the map)
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", 20)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .style("fill", "white")
          .text("Median Family Income by County in Georgia");
        
        // Add subtitle (with more space between it and the map)
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", 45)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("fill", "white")
          .text("2019-2023");
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
            Please check that your CSV file is in the correct location: /public/data/GeorgiaIncomeData.csv
          </p>
        </div>
      )}
      <svg ref={svgRef} className="max-w-full h-auto"></svg>
      {countyData.length > 0 && (
        <p className="text-sm mt-2 text-white">
          Showing median income for {countyData.length} Georgia counties
        </p>
      )}
    </div>
  );
};

export default IncomeGeorgiaMap;