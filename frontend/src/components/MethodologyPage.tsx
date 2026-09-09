import React from 'react';
import { 
  Cpu, Database, Layers, Brain, ShieldAlert, Route, Users, 
  AlertTriangle, CheckCircle2, Info, ArrowDown, Activity, Sparkles 
} from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="methodology-container">
      {/* Header */}
      <div className="methodology-header">
        <Cpu size={28} className="header-icon" />
        <div>
          <h2>System Architecture & Geotechnical Methodology</h2>
          <p>Scientific foundations, data processing pipeline, and explainable decision-support mechanics of SlopeSafe</p>
        </div>
      </div>

      {/* Core Pipeline Diagram Flow */}
      <div className="pipeline-flow-card">
        <h3>END-TO-END PIPELINE ARCHITECTURE</h3>
        <p className="pipeline-subtitle">
          PREDICT → EXPLAIN → WARN → RESPOND → REPORT → LEARN
        </p>

        <div className="flow-steps-grid">
          {/* Step 1 */}
          <div className="flow-step-box">
            <div className="step-num">01</div>
            <Database size={22} className="step-icon" />
            <h4>Data Ingestion</h4>
            <ul>
              <li>Open-Meteo Live Precipitation (1h, 24h, 72h)</li>
              <li>NASA SRTM 30m Digital Elevation Model (DEM)</li>
              <li>Soil Moisture Volumetric Saturation (TDR Proxy)</li>
              <li>Geological Survey of India (GSI) Landslide Inventory</li>
            </ul>
          </div>

          <div className="flow-arrow">→</div>

          {/* Step 2 */}
          <div className="flow-step-box">
            <div className="step-num">02</div>
            <Activity size={22} className="step-icon" />
            <h4>Feature Normalization</h4>
            <ul>
              <li>Topographical gradient & aspect extraction</li>
              <li>Antecedent precipitation index (72h accumulation)</li>
              <li>Pore water pressure saturation modeling</li>
              <li>Vegetation root anchorage index (NDVI)</li>
            </ul>
          </div>

          <div className="flow-arrow">→</div>

          {/* Step 3 */}
          <div className="flow-step-box highlight">
            <div className="step-num">03</div>
            <Brain size={22} className="step-icon" />
            <h4>Risk Inference Engine</h4>
            <ul>
              <li>Scikit-Learn RandomForestRegressor ensemble</li>
              <li>120 estimators, regularized leaf node bounds</li>
              <li>Transparent confidence intervals (85–95%)</li>
              <li><b>Zero fabricated 99% accuracy claims</b></li>
            </ul>
          </div>

          <div className="flow-arrow">→</div>

          {/* Step 4 */}
          <div className="flow-step-box">
            <div className="step-num">04</div>
            <Users size={22} className="step-icon" />
            <h4>AI + Community Fusion</h4>
            <ul>
              <li>Citizen hazard reports (cracks, seepage, debris)</li>
              <li>Authority verification gate (anti-spam)</li>
              <li>Calibrated score boost (+5 per verified report, max +15)</li>
              <li>Real-time dynamic recalculation</li>
            </ul>
          </div>

          <div className="flow-arrow">→</div>

          {/* Step 5 */}
          <div className="flow-step-box">
            <div className="step-num">05</div>
            <Route size={22} className="step-icon" />
            <h4>Response & Routing</h4>
            <ul>
              <li>Automated multi-tier alert generation</li>
              <li>Dijkstra risk-penalty mountain transit routing</li>
              <li>National NDMA & State SDMA / DDMA command integration</li>
              <li>Emergency shelter & hospital directory</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Two-Column Deep-Dive: Data Integrity + Explainability Model */}
      <div className="methodology-grid-two">
        {/* Box 1: Data Integrity Classification */}
        <div className="deep-dive-card">
          <div className="card-title-row">
            <Database size={20} />
            <h3>Data Quality & Classification Standard</h3>
          </div>
          <p>SlopeSafe maintains strict transparency regarding the origin of every metric:</p>

          <div className="classification-table">
            <div className="table-row header">
              <span>Category</span>
              <span>Source / Agency</span>
              <span>Classification</span>
            </div>
            <div className="table-row">
              <strong>Precipitation</strong>
              <span>Open-Meteo European Centre (ECMWF)</span>
              <span className="badge-status live">LIVE TELEMETRY</span>
            </div>
            <div className="table-row">
              <strong>Terrain & Slope</strong>
              <span>NASA SRTM 30m Global DEM</span>
              <span className="badge-status live">OBSERVED GIS</span>
            </div>
            <div className="table-row">
              <strong>Historical Events</strong>
              <span>GSI Himalayan Landslide Inventory</span>
              <span className="badge-status verified">AUTHORITATIVE</span>
            </div>
            <div className="table-row">
              <strong>Subsoil Moisture</strong>
              <span>Calibrated In-situ Sensor / Satellite Proxy</span>
              <span className="badge-status estimated">ESTIMATED</span>
            </div>
            <div className="table-row">
              <strong>Emergency Scenarios</strong>
              <span>Judges Interactive Testing Sandbox</span>
              <span className="badge-status simulation">DEMO SIMULATION</span>
            </div>
          </div>
        </div>

        {/* Box 2: Explainable Artificial Intelligence (XAI) */}
        <div className="deep-dive-card">
          <div className="card-title-row">
            <Sparkles size={20} />
            <h3>Explainable Risk Engine (XAI)</h3>
          </div>
          <p>
            In disaster mitigation, black-box predictions endanger human life. SlopeSafe decomposes every risk score into quantifiable physical factor contributions:
          </p>

          <div className="factor-weight-breakdown">
            <div className="factor-breakdown-row">
              <div className="f-title">Precipitation Saturation (24h / 72h)</div>
              <div className="f-pct">32%</div>
              <div className="f-bar"><div className="f-fill" style={{ width: '32%', background: '#3b82f6' }} /></div>
            </div>
            <div className="factor-breakdown-row">
              <div className="f-title">Slope Gradient & Shear Stress</div>
              <div className="f-pct">28%</div>
              <div className="f-bar"><div className="f-fill" style={{ width: '28%', background: '#ef4444' }} /></div>
            </div>
            <div className="factor-breakdown-row">
              <div className="f-title">Soil Moisture Saturation (TDR)</div>
              <div className="f-pct">20%</div>
              <div className="f-bar"><div className="f-fill" style={{ width: '20%', background: '#eab308' }} /></div>
            </div>
            <div className="factor-breakdown-row">
              <div className="f-title">Historical Hotspot Frequency</div>
              <div className="f-pct">12%</div>
              <div className="f-bar"><div className="f-fill" style={{ width: '12%', background: '#9333ea' }} /></div>
            </div>
            <div className="factor-breakdown-row">
              <div className="f-title">Verified Citizen Ground Reports</div>
              <div className="f-pct">8%</div>
              <div className="f-bar"><div className="f-fill" style={{ width: '8%', background: '#10b981' }} /></div>
            </div>
          </div>

          <div className="xai-quote">
            "By clearly explaining WHY an area is dangerous (e.g. 88mm rainfall + 38.5° slope), field officers and citizens can take targeted preventative measures rather than guessing."
          </div>
        </div>
      </div>

      {/* Safety & Limitations Banner */}
      <div className="notice warning-banner pad-20">
        <AlertTriangle size={24} />
        <div>
          <strong>Operational Limitations & Scientific Boundaries:</strong>
          <p>
            SlopeSafe is engineered as an <strong>intelligent decision-support platform</strong>. Geological failure envelopes depend on heterogeneous subsurface lithology and joint planes. Model outputs must be interpreted as probabilistic risk indicators and should always be cross-referenced with official advisories issued by the National Disaster Management Authority (NDMA), Geological Survey of India (GSI), and respective State Disaster Management Authorities.
          </p>
        </div>
      </div>
    </div>
  );
};
