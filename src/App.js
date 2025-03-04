import React from 'react';
import './App.css';
import MedianIncomeTrend from './components/MedianIncomeTrend';
import HypertensionTrend from './components/HypertensionTrend';
import IncomeGeorgiaMap from './components/IncomeGeorgiaMap';

function App() {
  // Just specify the CSV path - the component will handle loading
  const csvFilePath = '/Users/adrianaso/healthcare-visualization/public/data/GeorgiaIncomeData.csv';
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Income Analysis</h1>
        <MedianIncomeTrend />
        <div style={{ marginTop: '30px' }}>
          <HypertensionTrend />
        </div>
        <h2>Map Pattern</h2>
        <IncomeGeorgiaMap csvFilePath={csvFilePath} />
      </header>
    </div>
  );
}

export default App;