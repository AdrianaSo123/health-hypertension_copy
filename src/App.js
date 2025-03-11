import React from 'react';
import './App.css';
import MedianIncomeTrend from './components/MedianIncomeTrend';
import HypertensionTrend from './components/HypertensionTrend';
import IncomeGeorgiaMap from './components/IncomeGeorgiaMap';
import HypertensionGeorgia from './components/HypertensionGeorgia';
import IncomeVsCardioGeorgia from './components/IncomeVsCardioGeorgia';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Income and Cardiovascular Disease Analysis</h1>
        
        <div className="trends-container">
          <MedianIncomeTrend />
          <div style={{ marginTop: '30px' }}>
            <HypertensionTrend />
          </div>
        </div>
        
        <h2>Geographic Patterns</h2>
        
        <div className="maps-container">
          <div className="map-card">
            <h3>Income by County</h3>
            <IncomeGeorgiaMap />
          </div>
          
          <div className="map-card">
            <h3>Cardiovascular Disease by County</h3>
            <HypertensionGeorgia />
          </div>
        </div>
        
        <div className="correlation-section">
          <h2>Correlation Analysis</h2>
          <IncomeVsCardioGeorgia />
        </div>
        
        <div className="analysis-section">
          <h2>Key Findings</h2>
          <p>
            The scatterplot above reveals the relationship between household income and hypertension rates in Georgia counties. 
          </p>
        </div>
      </header>
    </div>
  );
}

export default App;