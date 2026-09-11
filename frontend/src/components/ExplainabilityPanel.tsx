import React, { useEffect, useState } from 'react';
import { FeatureImportance } from '../types';
import { apiService } from '../services/api';
import { Activity, ShieldCheck, Database } from 'lucide-react';

export const ExplainabilityPanel: React.FC = () => {
  const [importanceList, setImportanceList] = useState<FeatureImportance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiService.getFeatureImportance()
      .then(data => {
        if (data && data.length > 0) {
          setImportanceList(data);
        } else {
          // Fallback matching command center specification
          setImportanceList([
            { feature: 'Rainfall (24h Cumulative)', importance: 0.28 },
            { feature: 'Slope Angle', importance: 0.24 },
            { feature: 'Soil Saturation', importance: 0.18 },
            { feature: 'Historical Landslide Frequency', importance: 0.12 },
            { feature: 'Rainfall (72h Antecedent)', importance: 0.08 },
          ]);
        }
      })
      .catch(() => {
        setImportanceList([
          { feature: 'Rainfall (24h Cumulative)', importance: 0.28 },
          { feature: 'Slope Angle', importance: 0.24 },
          { feature: 'Soil Saturation', importance: 0.18 },
          { feature: 'Historical Landslide Frequency', importance: 0.12 },
          { feature: 'Rainfall (72h Antecedent)', importance: 0.08 },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const displayList = importanceList.slice(0, 5);

  return (
    <div className="command-card risk-intelligence-card">
      <div className="command-card-header">
        <div className="card-title-group">
          <div className="card-title-icon"><Activity size={16} /></div>
          <div>
            <h3>RISK INTELLIGENCE</h3>
            <p className="card-subtitle">Factors influencing current landslide risk</p>
          </div>
        </div>
      </div>

      <div className="risk-factors-list">
        {displayList.map(item => {
          const percentage = Math.round(item.importance * 100);
          return (
            <div key={item.feature} className="risk-factor-row">
              <div className="factor-label-row">
                <span className="factor-name">{item.feature}</span>
                <span className="factor-percentage">{percentage}%</span>
              </div>
              <div className="factor-progress-track">
                <div 
                  className="factor-progress-fill" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="current-assessment-box">
        <span className="assessment-label">CURRENT ASSESSMENT</span>
        <p className="assessment-text">
          Current risk is primarily influenced by 24-hour rainfall and slope geometry.
        </p>
      </div>

      <div className="intelligence-metrics-grid">
        <div className="intel-metric-block">
          <div className="intel-metric-label">
            <ShieldCheck size={13} className="text-cyan" />
            <span>MODEL CONFIDENCE</span>
          </div>
          <div className="intel-metric-value">84%</div>
        </div>

        <div className="intel-metric-block">
          <div className="intel-metric-label">
            <Database size={13} className="text-cyan" />
            <span>DATA QUALITY</span>
          </div>
          <div className="intel-metric-value">92%</div>
        </div>
      </div>
    </div>
  );
};

