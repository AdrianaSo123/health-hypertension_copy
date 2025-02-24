import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const MedianIncomeTrend = () => {
  const svgRef = useRef();

  useEffect(() => {
    // Sample data - replace with your actual data
    const data = [
      {year: 2013, income: 52250 }, 
      {year: 2014, income: 53657 }, 
      {year: 2015, income: 55775}, 
      {year: 2016, income: 57617}, 
      {year: 2017, income: 60336},
      {year: 2018, income: 61937}, 
      { year: 2019, income: 65712 },
      { year: 2020, income: 64994 },
      { year: 2021, income: 69717 },
      { year: 2022, income: 74755 },
      { year: 2023, income: 77719 }
    ];

    const createChart = (data) => {
      // Clear any existing chart
      d3.select(svgRef.current).selectAll('*').remove();

      // Set dimensions
      const width = 800;
      const height = 500;
      const margin = { top: 50, right: 80, bottom: 60, left: 120 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Create SVG
      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Create scales with padding
      const x = d3.scaleLinear()
        .domain([
          d3.min(data, d => d.year) - 0.5,
          d3.max(data, d => d.year) + 0.5
        ])
        .range([0, innerWidth]);

      const y = d3.scaleLinear()
        .domain([
          d3.min(data, d => d.income) * 0.9,
          d3.max(data, d => d.income) * 1.1
        ])
        .range([innerHeight, 0]);

      // Create line generator
      const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.income))
        .curve(d3.curveMonotoneX);

      // Add grid lines
      g.append('g')
        .attr('class', 'grid')
        .selectAll('line')
        .data(y.ticks(10))
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', d => y(d))
        .attr('y2', d => y(d))
        .attr('stroke', '#eee')
        .attr('stroke-dasharray', '2,2');

      // Add line path
      g.append('path')
        .datum(data)
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', '#2a9d8f')
        .attr('stroke-width', 3)
        .attr('d', line);

      // Add data points
      const points = g.selectAll('.data-point')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'data-point')
        .attr('transform', d => `translate(${x(d.year)},${y(d.income)})`);

      // Add circles for data points
      points.append('circle')
        .attr('r', 6)
        .attr('fill', '#2a9d8f')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // Add data labels with background
      points.append('rect')
        .attr('class', 'label-background')
        .attr('x', -45)
        .attr('y', -30)
        .attr('width', 90)
        .attr('height', 20)
        .attr('fill', 'white')
        .attr('rx', 4);

      points.append('text')
        .attr('class', 'income-label')
        .attr('y', -15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text(d => `$${d3.format(",")(d.income)}`);

      // Add axes
      const xAxis = g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x)
          .ticks(data.length)
          .tickFormat(d3.format('d')));

      const yAxis = g.append('g')
        .call(d3.axisLeft(y)
          .ticks(10)
          .tickFormat(d => `$${d3.format(",")(d)}`));

      // Style axis lines
      xAxis.selectAll('line')
        .style('stroke', '#888');
      yAxis.selectAll('line')
        .style('stroke', '#888');

      // Add axis labels
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .text('Year');

      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', 35)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .text('Median Household Income');

      // Add title
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .text('Median Household Income Trend (2019-2023)');
    };

    createChart(data);

    // Add resize handler
    const handleResize = () => {
      createChart(data);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full flex flex-col items-center p-4">
      <svg ref={svgRef} className="max-w-full"></svg>
    </div>
  );
};

export default MedianIncomeTrend;