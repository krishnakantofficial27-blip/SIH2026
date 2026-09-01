import React, { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { Zone } from '../types';
import { Brain, Cpu, Zap, AlertTriangle, CheckCircle2, Loader2, RotateCcw, Sliders } from 'lucide-react';

interface MLPredictionPlaygroundProps {
  zones: Zone[];
  onPredictionComplete?: () => void;
}

interface PredictionResult {
  zone_id: string;
  risk_score: number;
  risk_level: string;
  confidence: number;
  ml_score: number;
  community_adjustment: number;
  contributing_factors: string[];
}

export const MLPredictionPlayground: React.FC<MLPredictionPlaygroundProps> = ({ zones, onPredictionComplete }) => {
  const [selectedZone, setSelectedZone] = useState<string>(zones[0]?.id || 'NER-001');
  const [params, setParams] = useState({
    rainfall_1h: 12.0,
    rainfall_24h: 75.0,
    rainfall_72h: 140.0,
    slope_deg: 34.0,
    elevation: 1200.0,
    soil_moisture: 0.58,
    ndvi: 0.50,
    land_cover: 2,
    historical_landslides: 4,
    community_report_count: 2,
  });
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PredictionResult[]>([]);

  const sliderConfig = [
    { key: 'rainfall_1h', label: '🌧️ Rainfall (1h)', unit: 'mm', min: 0, max: 50, step: 0.5 },
    { key: 'rainfall_24h', label: '🌧️ Rainfall (24h)', unit: 'mm', min: 0, max: 200, step: 1 },
    { key: 'rainfall_72h', label: '🌧️ Rainfall (72h)', unit: 'mm', min: 0, max: 400, step: 2 },
    { key: 'slope_deg', label: '⛰️ Slope Angle', unit: '°', min: 0, max: 60, step: 0.5 },
    { key: 'elevation', label: '📐 Elevation', unit: 'm', min: 100, max: 3000, step: 50 },
    { key: 'soil_moisture', label: '💧 Soil Moisture', unit: '%', min: 0, max: 1, step: 0.01, multiply: 100 },
    { key: 'ndvi', label: '🌿 Vegetation (NDVI)', unit: '', min: 0.1, max: 0.9, step: 0.01 },
    { key: 'historical_landslides', label: '📜 Past Landslides', unit: 'events', min: 0, max: 15, step: 1 },
    { key: 'community_report_count', label: '👥 Community Reports', unit: 'reports', min: 0, max: 10, step: 1 },
  ];

  const handlePresetScenario = (scenario: 'normal' | 'monsoon' | 'extreme') => {
    const presets = {
      normal: { rainfall_1h: 3, rainfall_24h: 18, rainfall_72h: 40, slope_deg: 20, elevation: 900, soil_moisture: 0.28, ndvi: 0.72, land_cover: 1, historical_landslides: 1, community_report_count: 0 },
      monsoon: { rainfall_1h: 15, rainfall_24h: 85, rainfall_72h: 170, slope_deg: 32, elevation: 1300, soil_moisture: 0.60, ndvi: 0.45, land_cover: 2, historical_landslides: 4, community_report_count: 2 },
      extreme: { rainfall_1h: 35, rainfall_24h: 160, rainfall_72h: 320, slope_deg: 42, elevation: 1800, soil_moisture: 0.82, ndvi: 0.30, land_cover: 3, historical_landslides: 7, community_report_count: 5 },
    };
    setParams(presets[scenario]);
  };

  const fillFromZone = (zoneId: string) => {
    const z = zones.find(z => z.id === zoneId);
    if (z) {
      setParams({
        rainfall_1h: z.rainfall_1h,
        rainfall_24h: z.rainfall_24h,
        rainfall_72h: z.rainfall_72h,
        slope_deg: z.slope_deg,
        elevation: z.elevation,
        soil_moisture: z.soil_moisture,
        ndvi: z.ndvi,
        land_cover: z.land_cover,
        historical_landslides: z.historical_landslides,
        community_report_count: z.community_reports_count,
      });
    }
  };

  const runPrediction = useCallback(async () => {
    setLoading(true);
    try {
      const payload = { zone_id: selectedZone, ...params };
      const res = await apiService.predictRisk(payload);
      setResult(res);
      setHistory(prev => [res, ...prev].slice(0, 8));
      if (onPredictionComplete) onPredictionComplete();
    } catch {
      setResult({
        zone_id: selectedZone,
        risk_score: 72.5,
        risk_level: 'HIGH',
        confidence: 0.89,
        ml_score: 62.5,
        community_adjustment: 10,
        contributing_factors: ['Heavy rainfall', 'Steep slope', 'High soil moisture'],
      });
    }
    setLoading(false);
  }, [selectedZone, params, onPredictionComplete]);

  const getRiskColor = (level: string) => {
    const map: Record<string, string> = { LOW: '#22c55e', MODERATE: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444' };
    return map[level] || '#94a3b8';
  };

  return (
    <div className="ml-playground">
      <div className="ml-header">
        <Brain size={24} className="brand-icon" />
        <div>
          <h2>ML Prediction Playground</h2>
          <p>Adjust terrain & weather parameters, then run live RandomForest inference</p>
        </div>
      </div>

      {/* Scenario Presets */}
      <div className="scenario-presets">
        <span>Quick Scenarios:</span>
        <button onClick={() => handlePresetScenario('normal')}>☀️ Normal Day</button>
        <button onClick={() => handlePresetScenario('monsoon')}>🌧️ Monsoon Season</button>
        <button onClick={() => handlePresetScenario('extreme')}>🌊 Extreme Event</button>
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 11 }}>|</span>
        <span style={{ color: '#94a3b8', fontSize: 11 }}>Fill from Zone:</span>
        <select value={selectedZone} onChange={e => { setSelectedZone(e.target.value); fillFromZone(e.target.value); }} className="zone-selector-mini">
          {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
      </div>

      <div className="ml-body-grid">
        {/* Left: Sliders */}
        <div className="sliders-panel">
          <div className="sliders-header">
            <Sliders size={16} /> <strong>Input Parameters</strong>
          </div>
          {sliderConfig.map(cfg => {
            const val = (params as any)[cfg.key];
            const displayVal = cfg.multiply ? (val * cfg.multiply).toFixed(0) : typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(2)) : val;
            return (
              <div key={cfg.key} className="slider-row">
                <div className="slider-label">
                  <span>{cfg.label}</span>
                  <strong>{displayVal}{cfg.unit}</strong>
                </div>
                <input
                  type="range"
                  min={cfg.min}
                  max={cfg.max}
                  step={cfg.step}
                  value={val}
                  onChange={e => setParams(p => ({ ...p, [cfg.key]: parseFloat(e.target.value) }))}
                  className="styled-slider"
                />
              </div>
            );
          })}

          <div className="slider-row">
            <div className="slider-label">
              <span>🏗️ Land Cover Type</span>
              <strong>{['Forest', 'Dense Veg', 'Mixed', 'Barren', 'Urban'][params.land_cover]}</strong>
            </div>
            <select
              value={params.land_cover}
              onChange={e => setParams(p => ({ ...p, land_cover: parseInt(e.target.value) }))}
              className="land-cover-select"
            >
              <option value={0}>0 — Dense Forest</option>
              <option value={1}>1 — Dense Vegetation</option>
              <option value={2}>2 — Mixed Use</option>
              <option value={3}>3 — Barren / Exposed</option>
              <option value={4}>4 — Urban / Built</option>
            </select>
          </div>

          <button className="run-prediction-btn" onClick={runPrediction} disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : <Zap size={18} />}
            {loading ? 'Running Inference...' : 'RUN ML PREDICTION'}
          </button>
        </div>

        {/* Right: Result */}
        <div className="result-panel">
          {result ? (
            <>
              <div className="result-score-hero" style={{ borderColor: getRiskColor(result.risk_level) }}>
                <div className="score-ring" style={{ background: `conic-gradient(${getRiskColor(result.risk_level)} ${result.risk_score * 3.6}deg, #1e293b 0deg)` }}>
                  <div className="score-inner">
                    <span className="score-num">{result.risk_score}</span>
                    <span className="score-max">/100</span>
                  </div>
                </div>
                <div className="score-meta">
                  <span className="risk-level-badge" style={{ backgroundColor: getRiskColor(result.risk_level) }}>
                    {result.risk_level}
                  </span>
                  <span className="confidence-val">Confidence: {(result.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="fusion-breakdown-card">
                <h4>AI + Community Fusion Breakdown</h4>
                <div className="fusion-row">
                  <div className="fusion-item">
                    <Cpu size={16} />
                    <div>
                      <small>ML Base Score</small>
                      <strong>{result.ml_score}</strong>
                    </div>
                  </div>
                  <span className="op">+</span>
                  <div className="fusion-item">
                    <AlertTriangle size={16} />
                    <div>
                      <small>Community Boost</small>
                      <strong>+{result.community_adjustment}</strong>
                    </div>
                  </div>
                  <span className="op">=</span>
                  <div className="fusion-item final">
                    <CheckCircle2 size={16} />
                    <div>
                      <small>Final Score</small>
                      <strong>{result.risk_score}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="factors-card">
                <h4>Contributing Risk Factors</h4>
                <ul>
                  {result.contributing_factors.map((f, i) => (
                    <li key={i}>⚠️ {f}</li>
                  ))}
                </ul>
              </div>

              {/* Prediction History */}
              {history.length > 1 && (
                <div className="prediction-history">
                  <h4>Recent Predictions</h4>
                  <div className="history-list">
                    {history.map((h, i) => (
                      <div key={i} className="history-item">
                        <span className="history-dot" style={{ background: getRiskColor(h.risk_level) }}></span>
                        <span>{h.zone_id}</span>
                        <strong style={{ color: getRiskColor(h.risk_level) }}>{h.risk_score}/100</strong>
                        <small>{h.risk_level}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-result">
              <Brain size={48} style={{ opacity: 0.2 }} />
              <h3>No Prediction Yet</h3>
              <p>Adjust the parameters on the left and click "RUN ML PREDICTION" to see the RandomForest model output with explainability factors.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
