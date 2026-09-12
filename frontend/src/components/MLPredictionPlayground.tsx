import React, { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';
import { Zone, FactorContribution } from '../types';
import { Brain, Cpu, Zap, AlertTriangle, CheckCircle2, Loader2, RotateCcw, Sliders, ShieldAlert, Activity } from 'lucide-react';

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
  factors_breakdown?: FactorContribution[];
  contributing_factors?: string[];
  recommendation?: string;
}

export const MLPredictionPlayground: React.FC<MLPredictionPlaygroundProps> = ({ zones, onPredictionComplete }) => {
  const [selectedZone, setSelectedZone] = useState<string>(zones[0]?.id || 'HP-001');
  const [activeScenario, setActiveScenario] = useState<'normal' | 'monsoon' | 'extreme' | null>('monsoon');
  const [params, setParams] = useState({
    rainfall_1h: 14.0,
    rainfall_24h: 78.0,
    rainfall_72h: 155.0,
    slope_deg: 34.0,
    elevation: 1350.0,
    soil_moisture: 0.62,
    ndvi: 0.46,
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

  const executeInference = useCallback(async (currentParams: typeof params, zoneId: string) => {
    setLoading(true);
    try {
      const activeZoneId = zoneId || zones[0]?.id || 'HP-001';
      const payload = {
        zone_id: activeZoneId,
        rainfall_1h: Number(currentParams.rainfall_1h) || 0,
        rainfall_24h: Number(currentParams.rainfall_24h) || 0,
        rainfall_72h: Number(currentParams.rainfall_72h) || 0,
        slope_deg: Number(currentParams.slope_deg) || 0,
        elevation: Number(currentParams.elevation) || 1200,
        soil_moisture: Number(currentParams.soil_moisture) || 0.5,
        ndvi: Number(currentParams.ndvi) || 0.5,
        land_cover: Number(currentParams.land_cover) ?? 2,
        historical_landslides: Number(currentParams.historical_landslides) || 0,
        community_report_count: Number(currentParams.community_report_count) || 0,
      };

      const res = await apiService.predictRisk(payload);
      const formattedRes: PredictionResult = {
        zone_id: res.zone_id || activeZoneId,
        risk_score: res.risk_score ?? 50.0,
        risk_level: res.risk_level || 'MODERATE',
        confidence: res.confidence ?? 0.92,
        ml_score: res.ml_score ?? res.risk_score ?? 45.0,
        community_adjustment: res.community_adjustment ?? 0,
        factors_breakdown: res.factors_breakdown || [],
        contributing_factors: res.contributing_factors || [
          `Rainfall: ${currentParams.rainfall_24h}mm (24h)`,
          `Slope Angle: ${currentParams.slope_deg}°`,
          `Soil Saturation: ${(currentParams.soil_moisture * 100).toFixed(0)}%`,
        ],
        recommendation: res.recommendation || `${res.risk_level || 'MODERATE'} RISK: Monitor slope stability and heed local disaster advisories.`,
      };

      setResult(formattedRes);
      setHistory(prev => [formattedRes, ...prev.filter(h => h !== formattedRes)].slice(0, 8));
      if (onPredictionComplete) onPredictionComplete();
    } catch {
      // Handled inside apiService.predictRisk fallback
    } finally {
      setLoading(false);
    }
  }, [zones, onPredictionComplete]);

  // Initial inference on component mount
  useEffect(() => {
    executeInference(params, selectedZone);
  }, []);

  const handlePresetScenario = (scenario: 'normal' | 'monsoon' | 'extreme') => {
    setActiveScenario(scenario);
    const presets = {
      normal: { rainfall_1h: 2.0, rainfall_24h: 12.0, rainfall_72h: 28.0, slope_deg: 18.0, elevation: 850.0, soil_moisture: 0.25, ndvi: 0.75, land_cover: 1, historical_landslides: 0, community_report_count: 0 },
      monsoon: { rainfall_1h: 14.0, rainfall_24h: 78.0, rainfall_72h: 155.0, slope_deg: 34.0, elevation: 1350.0, soil_moisture: 0.62, ndvi: 0.46, land_cover: 2, historical_landslides: 4, community_report_count: 2 },
      extreme: { rainfall_1h: 38.0, rainfall_24h: 175.0, rainfall_72h: 340.0, slope_deg: 44.0, elevation: 1950.0, soil_moisture: 0.85, ndvi: 0.28, land_cover: 3, historical_landslides: 8, community_report_count: 5 },
    };
    const nextParams = presets[scenario];
    setParams(nextParams);
    executeInference(nextParams, selectedZone);
  };

  const fillFromZone = (zoneId: string) => {
    setActiveScenario(null);
    const z = zones.find(z => z.id === zoneId);
    if (z) {
      const zoneParams = {
        rainfall_1h: z.rainfall_1h || 10.0,
        rainfall_24h: z.rainfall_24h || 50.0,
        rainfall_72h: z.rainfall_72h || 100.0,
        slope_deg: z.slope_deg || 30.0,
        elevation: z.elevation || 1200.0,
        soil_moisture: z.soil_moisture || 0.5,
        ndvi: z.ndvi || 0.5,
        land_cover: z.land_cover ?? 2,
        historical_landslides: z.historical_landslides || 0,
        community_report_count: z.community_reports_count || 0,
      };
      setParams(zoneParams);
      executeInference(zoneParams, zoneId);
    }
  };

  const runPrediction = useCallback(() => {
    executeInference(params, selectedZone);
  }, [executeInference, params, selectedZone]);

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
          <p>Adjust terrain & weather parameters, then run live RandomForest geotechnical inference</p>
        </div>
      </div>

      {/* Scenario Presets */}
      <div className="scenario-presets">
        <span>Quick Scenarios:</span>
        <button
          className={`scenario-btn ${activeScenario === 'normal' ? 'active normal' : ''}`}
          onClick={() => handlePresetScenario('normal')}
        >
          ☀️ Normal Day
        </button>
        <button
          className={`scenario-btn ${activeScenario === 'monsoon' ? 'active monsoon' : ''}`}
          onClick={() => handlePresetScenario('monsoon')}
        >
          🌧️ Monsoon Season
        </button>
        <button
          className={`scenario-btn ${activeScenario === 'extreme' ? 'active extreme' : ''}`}
          onClick={() => handlePresetScenario('extreme')}
        >
          🌊 Extreme Event
        </button>
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 11 }}>|</span>
        <span style={{ color: '#94a3b8', fontSize: 11 }}>Fill from Zone:</span>
        <select
          value={selectedZone}
          onChange={e => {
            setSelectedZone(e.target.value);
            fillFromZone(e.target.value);
          }}
          className="zone-selector-mini"
        >
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
                  onChange={e => {
                    setActiveScenario(null);
                    setParams(p => ({ ...p, [cfg.key]: parseFloat(e.target.value) }));
                  }}
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
              onChange={e => {
                setActiveScenario(null);
                setParams(p => ({ ...p, land_cover: parseInt(e.target.value) }));
              }}
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
                  <span className="zone-id-tag">Zone: {result.zone_id}</span>
                </div>
              </div>

              {/* Action Advisory */}
              {result.recommendation && (
                <div className="ml-advisory-box">
                  <div className="ml-advisory-header">
                    <ShieldAlert size={16} />
                    <strong>Action Advisory Protocol</strong>
                  </div>
                  <p>{result.recommendation}</p>
                </div>
              )}

              {/* AI + Community Fusion */}
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

              {/* Explainability Breakdown */}
              <div className="factors-card">
                <h4>Contributing Risk Factors</h4>
                {result.factors_breakdown && result.factors_breakdown.length > 0 ? (
                  <div className="factors-detailed-list">
                    {result.factors_breakdown.map((f, i) => (
                      <div key={i} className={`factor-row-card ${(f.level || 'low').toLowerCase()}`}>
                        <div className="factor-row-header">
                          <span className="factor-row-title">{f.factor}</span>
                          <span className={`factor-row-badge ${(f.level || 'low').toLowerCase()}`}>{f.level}</span>
                          <span className="factor-row-weight">{f.weight_percent}% impact</span>
                        </div>
                        <div className="factor-row-val">{f.value_display}</div>
                        <p className="factor-row-desc">{f.explanation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul>
                    {(result.contributing_factors || []).map((f, i) => (
                      <li key={i}>⚠️ {f}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Prediction History */}
              {history.length > 1 && (
                <div className="prediction-history">
                  <h4>Recent Playground Runs</h4>
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

