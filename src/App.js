import React from 'react';
import './App.css';
import MedianIncomeTrend from './components/MedianIncomeTrend';
import HypertensionTrend from './components/HypertensionTrend';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Income Analysis</h1>
        <MedianIncomeTrend />
        <div style={{ marginTop: '30px' }}>
          <HypertensionTrend />
        </div>
      </header>
    </div>
  );
}

export default App;