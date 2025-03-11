import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const IncomeVsCardioGeorgia = () => {
  const svgRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Load and process data
  useEffect(() => {
    // Only run if svg ref is defined
    if (!svgRef.current) return;
    
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Define fixed file paths
        const incomePath = '/data/GeorgiaIncomeData.csv';
        const hypertensionPath = '/data/HypertensionCountyData.csv';
        
        // Fetch both CSV files
        const responses = await Promise.all([
          fetch(incomePath),
          fetch(hypertensionPath)
        ]);
        
        // Check if both requests succeeded
        if (!responses[0].ok || !responses[1].ok) {
          throw new Error("Failed to fetch data files");
        }
        
        // Get text content from both responses
        const [incomeText, hypertensionText] = await Promise.all([
          responses[0].text(),
          responses[1].text()
        ]);
        
        // Process income data
        const incomeData = {};
        const incomeLines = incomeText.split('\n');
        
        // Find data rows (skip headers)
        let dataStarted = false;
        
        for (const line of incomeLines) {
          // Skip empty lines
          if (line.trim() === '') continue;
          
          // Look for start of data
          if (line.includes("County,FIPS,Value (Dollars)")) {
            dataStarted = true;
            continue;
          }
          
          if (!dataStarted) continue;
          
          // Skip footer notes
          if (line.startsWith('Suggested') || line.startsWith('Notes:')) {
            break;
          }
          
          // Split the line by comma, handling quotes
          let parts = [];
          let currentPart = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
              inQuotes = !inQuotes;
            } else if (line[i] === ',' && !inQuotes) {
              parts.push(currentPart);
              currentPart = '';
            } else {
              currentPart += line[i];
            }
          }
          
          // Add the last part
          parts.push(currentPart);
          
          // Extract county name and value
          let county = parts[0].replace(/["']/g, '');
          
          // Skip United States and Georgia rows
          if (county === 'United States' || county === 'Georgia') continue;
          
          // Remove " County" suffix if present
          county = county.replace(/ County$/, '');
          
          // Extract income value
          const incomeStr = parts[2].replace(/["']/g, '').replace(/,/g, '');
          const income = parseFloat(incomeStr) / 1000; // Convert to thousands
          
          if (!isNaN(income)) {
            incomeData[county] = income;
          }
        }
        
        console.log("Processed income data:", Object.keys(incomeData).length, "counties");
        
        // Process hypertension data
        const hypertensionData = {};
        const hypertensionLines = hypertensionText.split('\n');
        
        // Skip header
        for (let i = 1; i < hypertensionLines.length; i++) {
          const line = hypertensionLines[i].trim();
          if (line === '') continue;
          
          const parts = line.split(',');
          if (parts.length < 2) continue;
          
          const county = parts[0];
          const rate = parseFloat(parts[1]);
          
          if (!isNaN(rate)) {
            hypertensionData[county] = rate;
          }
        }
        
        console.log("Processed hypertension data:", Object.keys(hypertensionData).length, "counties");
        
        // Combine data
        const chartData = [];
        
        Object.keys(incomeData).forEach(county => {
          if (hypertensionData[county]) {
            chartData.push({
              county: county,
              income: incomeData[county],
              hypertension: hypertensionData[county]
            });
          }
        });
        
        console.log("Combined data points:", chartData.length);
        
        if (chartData.length === 0) {
          throw new Error("No matching counties found between datasets");
        }
        
        // Now create the visualization with the data
        createVisualization(chartData);
        setIsLoading(false);
        
      } catch (error) {
        console.error("Error loading or processing data:", error);
        setErrorMessage(error.message || "Error loading data");
        setIsLoading(false);
      }
    }
    
    // Function to create the visualization
    function createVisualization(data) {
      // Clear any existing content
      d3.select(svgRef.current).selectAll("*").remove();
      
      // Create the SVG element
      const svg = d3.select(svgRef.current);
      const width = parseInt(svg.attr("width"));
      const height = parseInt(svg.attr("height"));
      const margin = { top: 60, right: 50, bottom: 70, left: 70 };
      
      // Calculate inner dimensions
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      
      // Create scales
      const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.income) * 1.05])
        .range([0, innerWidth]);
      
      const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.hypertension) * 1.05])
        .range([innerHeight, 0]);
      
      // Create chart group
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      
      // Add X axis with darker color
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d => `$${d}k`))
        .attr("color", "#333") // Make axis darker
        .attr("font-weight", "bold") // Make labels bolder
        .selectAll("line")
        .attr("stroke", "#333") // Make tick lines darker
        .attr("stroke-width", 1.5); // Make tick lines thicker
      
      // Add Y axis with darker color
      g.append("g")
        .call(d3.axisLeft(yScale))
        .attr("color", "#333") // Make axis darker
        .attr("font-weight", "bold") // Make labels bolder
        .selectAll("line")
        .attr("stroke", "#333") // Make tick lines darker
        .attr("stroke-width", 1.5); // Make tick lines thicker
      
      // Add X axis label
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 40)
        .attr("text-anchor", "middle")
        .attr("fill", "#333") // Darker text color
        .text("Median Household Income (thousands of dollars)");
      
      // Add Y axis label
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .attr("fill", "#333") // Darker text color
        .text("Hypertension Rate");
      
      // Add title
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .attr("fill", "#333") // Darker text color
        .text("Income vs. Hypertension in Georgia Counties");
      
      // Create a tooltip
      const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("z-index", "1000");
      
      // Calculate regression
      const xMean = d3.mean(data, d => d.income);
      const yMean = d3.mean(data, d => d.hypertension);
      let numerator = 0, denominator = 0;
      
      data.forEach(d => {
        const xDiff = d.income - xMean;
        const yDiff = d.hypertension - yMean;
        numerator += xDiff * yDiff;
        denominator += xDiff * xDiff;
      });
      
      const slope = numerator / denominator;
      const intercept = yMean - (slope * xMean);
      
      // Calculate correlation coefficient
      let sumXY = 0, sumX2 = 0, sumY2 = 0;
      
      data.forEach(d => {
        const xDiff = d.income - xMean;
        const yDiff = d.hypertension - yMean;
        sumXY += xDiff * yDiff;
        sumX2 += xDiff * xDiff;
        sumY2 += yDiff * yDiff;
      });
      
      const correlation = sumXY / Math.sqrt(sumX2 * sumY2);
      
      // Add regression line
      const x1 = d3.min(data, d => d.income);
      const y1 = (slope * x1) + intercept;
      const x2 = d3.max(data, d => d.income);
      const y2 = (slope * x2) + intercept;
      
      g.append("line")
        .attr("x1", xScale(x1))
        .attr("y1", yScale(y1))
        .attr("x2", xScale(x2))
        .attr("y2", yScale(y2))
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5");
      
      // Add correlation text
      g.append("text")
        .attr("x", innerWidth - 150)
        .attr("y", 20)
        .text(`Correlation: ${correlation.toFixed(3)}`)
        .attr("font-size", "12px")
        .attr("fill", "#333"); // Darker text color
      
      // Find extreme points to label
      const extremePoints = [
        // Highest hypertension rate
        data.reduce((max, d) => d.hypertension > max.hypertension ? d : max, data[0]),
        // Lowest hypertension rate
        data.reduce((min, d) => d.hypertension < min.hypertension ? d : min, data[0]),
        // Highest income
        data.reduce((max, d) => d.income > max.income ? d : max, data[0]),
        // Lowest income 
        data.reduce((min, d) => d.income < min.income ? d : min, data[0])
      ];
      
      // Find outliers (counties with largest residuals)
      const outliers = data
        .map(d => {
          const predicted = slope * d.income + intercept;
          return {
            ...d,
            residual: Math.abs(d.hypertension - predicted)
          };
        })
        .sort((a, b) => b.residual - a.residual)
        .slice(0, 3);
      
      // Combine extreme points and outliers (without duplicates)
      const pointsToLabel = [...extremePoints];
      
      // Add outliers if they're not already in the extreme points
      outliers.forEach(outlier => {
        if (!pointsToLabel.some(p => p.county === outlier.county)) {
          pointsToLabel.push(outlier);
        }
      });
      
      // Add dots for each county
      g.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.income))
        .attr("cy", d => yScale(d.hypertension))
        .attr("r", d => {
          // Make extreme points and outliers slightly larger
          return pointsToLabel.some(p => p.county === d.county) ? 7 : 5;
        })
        .attr("fill", d => {
          // Highlight extreme points and outliers
          return pointsToLabel.some(p => p.county === d.county) ? "orange" : "steelblue";
        })
        .attr("opacity", 0.7)
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("mouseover", function(event, d) {
          d3.select(this)
            .attr("r", 9)
            .attr("stroke-width", 2);
          
          tooltip
            .style("visibility", "visible")
            .html(`<strong>${d.county} County</strong><br>
                   Income: $${d.income.toFixed(1)}k<br>
                   Hypertension: ${d.hypertension.toFixed(1)}`)
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function(d) {
          // Determine if this is a labeled point
          const isLabeled = pointsToLabel.some(p => p.county === d.county);
          
          d3.select(this)
            .attr("r", isLabeled ? 7 : 5)
            .attr("stroke-width", 1);
          
          tooltip.style("visibility", "hidden");
        });
      
      // Label the extreme and outlier points
      pointsToLabel.forEach(d => {
        g.append("text")
          .attr("x", xScale(d.income) + 8)
          .attr("y", yScale(d.hypertension) - 8)
          .text(d.county)
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("fill", "#333"); // Darker text color
      });
      
      // Add a legend to explain the highlighted points - moved to top right
      const legend = g.append("g")
        .attr("transform", `translate(${innerWidth - 150}, 40)`); // Moved to top right
      
      legend.append("rect")
        .attr("width", 150)
        .attr("height", 80)
        .attr("fill", "white")
        .attr("stroke", "#333") // Darker border
        .attr("rx", 5);
      
      legend.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .text("Highlighted Points:")
        .attr("font-weight", "bold")
        .attr("font-size", "12px")
        .attr("fill", "#333"); // Darker text color
      
      legend.append("circle")
        .attr("cx", 20)
        .attr("cy", 40)
        .attr("r", 5)
        .attr("fill", "orange");
      
      legend.append("text")
        .attr("x", 35)
        .attr("y", 44)
        .text("Extreme values")
        .attr("font-size", "11px")
        .attr("fill", "#333"); // Darker text color
      
      legend.append("circle")
        .attr("cx", 20)
        .attr("cy", 60)
        .attr("r", 5)
        .attr("fill", "steelblue");
      
      legend.append("text")
        .attr("x", 35)
        .attr("y", 64)
        .text("Other counties")
        .attr("font-size", "11px")
        .attr("fill", "#333"); // Darker text color
    }
    
    loadData();
    
    // Cleanup function - remove any tooltips when component unmounts
    return () => {
      d3.selectAll("body > div.tooltip").remove();
    };
  }, []);
  
  return (
    <div className="visualization-container">
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <h2>Income vs. Hypertension in Georgia Counties</h2>
        {isLoading && <p>Loading data...</p>}
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      </div>
      
      <svg 
        ref={svgRef}
        width="800" 
        height="500" 
        style={{
          margin: '0 auto',
          display: 'block',
          border: '1px solid #ccc',
          borderRadius: '8px',
          backgroundColor: '#fff'
        }}
      ></svg>
      
      <div style={{ maxWidth: '700px', margin: '20px auto', padding: '0 20px' }}>
        <h3>About this Visualization</h3>
        <p>
          This scatterplot explores the relationship between median household income 
          and hypertension rates across Georgia counties. Each point represents a county,
          with the horizontal position showing income level and the vertical position showing
          hypertension rate.
        </p>
        <p>
          The red dashed line represents the trend line (linear regression).
          A negative correlation suggests that as income increases, hypertension rates tend
          to decrease.
        </p>
        <p>
          Orange highlighted points represent counties with extreme values: the highest and lowest
          incomes, the highest and lowest hypertension rates, and the counties that deviate most
          from the overall trend.
        </p>
      </div>
    </div>
  );
};

export default IncomeVsCardioGeorgia;