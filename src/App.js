import React from 'react';
import './App.css';
import MedianIncomeTrend from './components/MedianIncomeTrend';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Income Analysis</h1>
        <MedianIncomeTrend />
      </header>
    </div>
  );
}

export default App;