import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';

const HypertensionChart = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load CSV data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/HypertensionHistoricalData.csv');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const fileContent = await response.text();
        
        // Parse CSV data
        const parsedData = Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true
        });
        
        // Transform data for visualization
        const chartData = parsedData.data
          .filter(row => row && Object.keys(row).length > 0)
          .map(row => {
            // Get first two columns (assuming first is year, second is value)
            const columns = Object.keys(row);
            const year = row[columns[0]];
            const value = parseFloat(row[columns[1]]);
            
            return { 
              year: year,
              value: isNaN(value) ? 0 : value
            };
          })
          .filter(item => item.year && item.value > 0);
        
        setData(chartData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading CSV:', err);
        setError(`Failed to load data: ${err.message}`);
        setLoading(false);
      }
    };

    loadData();
  }, []);
  
  // Create the chart when data is loaded
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Set dimensions and margins - increased bottom margin for more space
    const margin = { top: 40, right: 30, bottom: 150, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom);
    
    const g = svg.append("g")
                 .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create x scale (simple band scale for categories)
    const xScale = d3.scaleBand()
                     .domain(data.map(d => d.year))
                     .range([0, width])
                     .padding(0.2);
    
    // Create y scale
    const yScale = d3.scaleLinear()
                     .domain([40, 50])
                     .range([height, 0]);
    
    // Add x-axis with rotated labels
    g.append("g")
     .attr("class", "x-axis")
     .attr("transform", `translate(0,${height})`)
     .call(d3.axisBottom(xScale))
     .selectAll("text")
     .attr("transform", "translate(-10,10) rotate(-45)")
     .style("text-anchor", "end")
     .attr("font-size", "14px")
     .attr("font-weight", "bold")
     .attr("fill", "black");
    
    // Add y-axis
    g.append("g")
     .attr("class", "y-axis")
     .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`))
     .selectAll("text")
     .attr("fill", "black")
     .attr("font-weight", "bold");
    
    // Make ALL axis lines black after BOTH axes are created
    svg.selectAll(".domain, .tick line")
     .attr("stroke", "black")
     .attr("stroke-width", 1.5);
    
    // Create line generator
    const line = d3.line()
                   .x(d => xScale(d.year) + xScale.bandwidth() / 2)
                   .y(d => yScale(d.value))
                   .curve(d3.curveMonotoneX);
    
    // Add line path
    g.append("path")
     .datum(data)
     .attr("fill", "none")
     .attr("stroke", "#4682B4") // Steel blue
     .attr("stroke-width", 3)
     .attr("d", line);
    
    // Add data points
    g.selectAll(".dot")
     .data(data)
     .enter()
     .append("circle")
     .attr("cx", d => xScale(d.year) + xScale.bandwidth() / 2)
     .attr("cy", d => yScale(d.value))
     .attr("r", 5)
     .attr("fill", "#4682B4"); // No white border
    
    // Add value labels
    g.selectAll(".label")
     .data(data)
     .enter()
     .append("text")
     .attr("x", d => xScale(d.year) + xScale.bandwidth() / 2)
     .attr("y", d => yScale(d.value) - 10)
     .attr("text-anchor", "middle")
     .attr("font-size", "10px")
     .attr("fill", "#4682B4")
     .text(d => `${d.value}%`);
    
    // Add title
    svg.append("text")
       .attr("x", width / 2 + margin.left)
       .attr("y", 20)
       .attr("text-anchor", "middle")
       .attr("font-size", "18px")
       .attr("font-weight", "bold")
       .text("Hypertension Prevalence (1999-2018)");
    
    // Add x-axis label
    g.append("text")
     .attr("x", width / 2)
     .attr("y", height + margin.bottom - 20)
     .attr("text-anchor", "middle")
     .attr("font-size", "16px")
     .text("Survey Period");
    
    // Add y-axis label
    g.append("text")
     .attr("transform", "rotate(-90)")
     .attr("x", -height / 2)
     .attr("y", -35)
     .attr("text-anchor", "middle")
     .attr("font-size", "16px")
     .text("Percentage (%)");
    
  }, [data]);
  
  if (loading) {
    return <div>Loading hypertension data...</div>;
  }
  
  if (error) {
    return (
      <div style={{ color: 'red', padding: '20px' }}>
        <h3>Error loading data</h3>
        <p>{error}</p>
        <p>Make sure your CSV file is located at: /public/data/HypertensionHistoricalData.csv</p>
      </div>
    );
  }
  
  return (
    <div className="chart-container" style={{ margin: '20px auto', maxWidth: '800px' }}>
      <svg 
        ref={svgRef} 
        style={{ 
          width: '100%', 
          height: 'auto', 
          minHeight: '400px',
          background: '#f9f9f9', 
          border: '1px solid #ddd', 
          borderRadius: '8px' 
        }} 
      />
      <p style={{ textAlign: 'center', fontSize: '12px', color: '#777', marginTop: '5px' }}>
        Data source: Hypertension prevalence among adults (1999-2018)
      </p>
    </div>
  );
};

export default HypertensionChart;