import React, { useEffect, useState } from 'react';
import { FeatureImportance } from '../types';
import { apiService } from '../services/api';
import { Cpu, CheckCircle2, Info } from 'lucide-react';

export const ExplainabilityPanel: React.FC = () => {
  const [importanceList, setImportanceList] = useState<FeatureImportance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiService.getFeatureImportance()
      .then(data => setImportanceList(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getImportanceLevelText = (val: number) => {
    if (val >= 0.20) return 'HIGH IMPORTANCE';
    if (val >= 0.10) return 'MODERATE IMPORTANCE';
    return 'LOW IMPORTANCE';
  };

  const getBarColor = (val: number) => {
    if (val >= 0.20) return '#ef4444';
    if (val >= 0.10) return '#f97316';
    return '#22c55e';
  };

  return (
    <div className="explainability-card">
      <div className="card-header">
        <Cpu size={22} className="header-icon" />
        <div>
          <h2>AI Model Explainability (XAI)</h2>
          <p>Features extracted from trained Scikit-Learn RandomForestRegressor pipeline</p>
        </div>
      </div>

      <div className="explainability-intro">
        <p>
          Disaster decision support requires absolute transparency. The chart below displays the physical weights assigned by the backend machine learning model when predicting slope failure probability.
        </p>
      </div>

      <div className="feature-bars-list">
        {importanceList.map(item => {
          const percentage = Math.round(item.importance * 100);
          return (
            <div key={item.feature} className="feature-bar-item">
              <div className="feature-meta">
                <span className="feature-name">{item.feature}</span>
                <span className="feature-val">{percentage}% ({getImportanceLevelText(item.importance)})</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.max(8, percentage * 2.5)}%`,
                    backgroundColor: getBarColor(item.importance),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="xai-footer-note">
        <Info size={16} />
        <span>
          Retrieved dynamically from <code>/api/model/feature-importance</code>. No simulated or fake feature weights.
        </span>
      </div>
    </div>
  );
};
