import React from 'react';
import './App.css';
import MedianIncomeTrend from './components/MedianIncomeTrend';
import HypertensionTrend from './components/HypertensionTrend';
import IncomeGeorgiaMap from './components/IncomeGeorgiaMap';
import HypertensionGeorgia from './components/HypertensionGeorgia';
import IncomeVsCardioGeorgia from './components/IncomeVsCardioGeorgia';
import RaceInGeorgia from './components/RaceInGeorgia';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Income and Cardiovascular Disease Analysis</h1>
        
        <div className="section-intro">
          <p>
            This analysis explores the relationships between socioeconomic factors, cardiovascular disease, 
            and demographics across Georgia counties, with a focus on how these factors intersect and affect health outcomes.
          </p>
        </div>
        
        <h2>Trend Analysis</h2>
        <div className="section-context">
          <p>
            The time series below illustrate how median household across the US has changed over time. This was important to see if there 
            were any drastic changes to be aware of. 
          </p>
        </div>
        
        <div className="trends-container">
          <div>
            <MedianIncomeTrend />
            <div className="visualization-context">
              <p>
                This chart shows the national hypertension rates. Hypertension rates have generally stayed fairly consistant over the years
                despite the national median income level increasing.
              </p>
            </div>
          </div>
          
          <div style={{ marginTop: '30px' }}>
            <HypertensionTrend />
            <div className="visualization-context">
            </div>
          </div>
        </div>
        
        <h2>Geographic Patterns</h2>
        <div className="section-context">
          <p>
            The maps below reveal how income and cardiovascular disease are distributed across Georgia counties. The purpose of 
            these maps were to see if there were any obvious patterns between income and hypertension.
          </p>
        </div>
        
        <div className="maps-container">
          <div className="map-card">
            <h3>Income by County</h3>
            <IncomeGeorgiaMap />
            <div className="visualization-context">
              <p>
                This map illustrates median household income across Georgia counties. Note the higher incomes 
                concentrated around Atlanta and suburban areas, contrasted with lower income levels in rural counties.
              </p>
            </div>
          </div>
          
          <div className="map-card">
            <h3>Cardiovascular Disease by County</h3>
            <HypertensionGeorgia />
            <div className="visualization-context">
              <p>
                This map shows cardiovascular disease rates by county. The pattern reveals higher prevalence in many 
                rural and southern counties, areas that have historically faced challenges with healthcare access, 
                physician shortages, and lower rates of health insurance coverage.
              </p>
            </div>
          </div>
        </div>
        
        <div className="correlation-section">
          <h2>Correlation Analysis</h2>
          <div className="section-context">
            <p>
              The scatterplot below examines the direct relationship between income and cardiovascular disease rates,
              helping us understand how strongly these factors are connected across Georgia counties.
            </p>
          </div>
          
          <IncomeVsCardioGeorgia />
          <div className="visualization-context">
            <p>
              Each point represents a Georgia county, positioned according to its median household income and 
              cardiovascular disease rate. The trend line indicates a negative correlation with an r-value of -0.467, suggesting that 
              as income increases, disease rates tend to decrease. However, the scatter of points and r-value indicate that 
              other factors beyond income also influence health outcomes.
            </p>
          </div>
        </div>
        
        <div className="analysis-section">
          <h2>Key Findings</h2>
          <p>
            The scatterplot above reveals the relationship between household income and hypertension rates in Georgia counties. 
            Counties with lower median household incomes tend to have higher rates of cardiovascular disease, 
            suggesting socioeconomic factors may play a significant role in health outcomes, however since there correlation is 
            moderate, there are other factors to consider. Income levels are not the sole reason for varying hypertension rates.
          </p>
        </div>
        
        <div className="demographic-section">
          <h2>Demographic Context</h2>
          <p>
            When examining health disparities in Georgia, demographic factors provide additional context to understanding 
            the relationship between income and cardiovascular disease. The map below shows the distribution of Black population 
            by county, which may help explain some of the patterns observed in the previous visualizations. I thought it was important 
            to consider this lense because there could be discrepancies based on race. Historically, the healthcare system has treated 
            black people poorly, causing fear and distrust. This would make peeople less likely to get treatment for their conditions. 
      
           
          </p>
          <div className="map-card full-width">
            <h3>Black Population by County</h3>
            <RaceInGeorgia />
            <div className="visualization-context">
              <p>
                The distribution of Black populations across Georgia counties reveals patterns that often align with 
                both economic indicators and cardiovascular disease rates. This overlap highlights how social determinants 
                of health, including systemic inequities, can contribute to health disparities. Understanding these 
                demographic patterns is essential for developing targeted, culturally-appropriate healthcare interventions.
              </p>
            </div>
          </div>
        </div>
        
        <div className="conclusion-section">
          <h2>Conclusion</h2>
          <p>
            This analysis demonstrates how income, geography, and race intersect to influence cardiovascular health outcomes 
            in Georgia. While economic factors clearly play an important role, the impact of historical inequities and ongoing 
            systemic racism must be considered when addressing these health disparities. Effective interventions will require 
            both improvements in healthcare access and broader efforts to address social determinants of health and racial inequities.
          </p>
        </div>
      </header>
    </div>
  );
}

export default App;