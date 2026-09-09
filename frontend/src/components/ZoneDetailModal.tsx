import React from 'react';
import { Zone } from '../types';
import { 
  X, CloudRain, Mountain, Droplets, History, Users, AlertTriangle, 
  ShieldCheck, Route, Send, Info, Compass, CheckCircle2 
} from 'lucide-react';

interface ZoneDetailModalProps {
  zone: Zone | null;
  onClose: () => void;
  onNavigateToRoute: () => void;
  onNavigateToReport: () => void;
}

const RISK_BADGE_STYLE: Record<string, string> = {
  LOW: '#22c55e',
  MODERATE: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export const ZoneDetailModal: React.FC<ZoneDetailModalProps> = ({
  zone,
  onClose,
  onNavigateToRoute,
  onNavigateToReport,
}) => {
  if (!zone) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="zone-detail-card" onClick={e => e.stopPropagation()}>
        <div className="card-header">
          <div>
            <span className="zone-badge-id">ZONE ID: {zone.id} · {zone.district.toUpperCase()}, {zone.state.toUpperCase()}</span>
            <h2>{zone.name}</h2>
          </div>
          <button className="close-btn" onClick={onClose} title="Close Modal"><X size={20} /></button>
        </div>

        <div className="score-hero-row">
          <div className="score-box" style={{ borderColor: RISK_BADGE_STYLE[zone.risk_level] }}>
            <span className="score-number">{zone.risk_score}</span>
            <small>/ 100</small>
            <div className="level-pill" style={{ backgroundColor: RISK_BADGE_STYLE[zone.risk_level] }}>
              {zone.risk_level} HAZARD
            </div>
            <span className="confidence-pill">Confidence: {Math.round((zone.confidence || 0.90) * 100)}%</span>
          </div>

          {/* AI + Community Risk Fusion */}
          <div className="fusion-box">
            <h4>AI + COMMUNITY RISK FUSION</h4>
            <p className="fusion-tagline">Physical geotechnical modeling fused with ground-verified citizen observations</p>
            <div className="fusion-breakdown">
              <div>
                <small>GEOTECHNICAL / ML MODEL</small>
                <strong>{zone.ml_score}</strong>
              </div>
              <span className="operator">+</span>
              <div>
                <small>{zone.community_reports_count} VERIFIED GROUND REPORTS</small>
                <strong>+{zone.community_adjustment}</strong>
              </div>
              <span className="operator">=</span>
              <div>
                <small>FINAL RISK INDEX</small>
                <strong style={{ color: RISK_BADGE_STYLE[zone.risk_level] }}>{zone.risk_score}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Telemetry Grid */}
        <div className="metrics-grid">
          <div className="metric-tile">
            <CloudRain size={18} className="tile-icon" />
            <div>
              <label>Rainfall (24h / 72h / 7d)</label>
              <span>{zone.rainfall_24h} mm / {zone.rainfall_72h} mm / {zone.rainfall_7d || Math.round(zone.rainfall_72h * 1.5)} mm</span>
            </div>
          </div>

          <div className="metric-tile">
            <Mountain size={18} className="tile-icon" />
            <div>
              <label>Slope Angle & Elevation</label>
              <span>{zone.slope_deg}° slope | {zone.elevation}m AMSL</span>
            </div>
          </div>

          <div className="metric-tile">
            <Droplets size={18} className="tile-icon" />
            <div>
              <label>Subsoil Moisture Saturation</label>
              <span>{Math.round(zone.soil_moisture * 100)}% volumetric (TDR)</span>
            </div>
          </div>

          <div className="metric-tile">
            <History size={18} className="tile-icon" />
            <div>
              <label>GSI Historical Inventory</label>
              <span>{zone.historical_landslides} past recorded slope failures</span>
            </div>
          </div>
        </div>

        {/* Transparent Explainable Factors Section */}
        <div className="explainability-box">
          <h3>WHY IS THIS AREA ASSESSED AT {zone.risk_level} RISK?</h3>
          <p className="explain-intro">
            SlopeSafe explains every risk calculation transparently using real geotechnical factors without opaque black-box claims:
          </p>

          <div className="factors-bars-stack">
            {(zone.factors_breakdown || []).map(f => (
              <div key={f.factor} className="factor-item-bar">
                <div className="factor-item-header">
                  <strong>{f.factor}</strong>
                  <span className={`factor-lvl ${f.level.toLowerCase()}`}>{f.level} ({f.weight_percent}%)</span>
                </div>
                <div className="factor-track">
                  <div 
                    className="factor-fill" 
                    style={{ 
                      width: `${f.weight_percent * 2.5}%`,
                      backgroundColor: RISK_BADGE_STYLE[f.level] || '#22c55e'
                    }} 
                  />
                </div>
                <small className="factor-desc">{f.explanation} ({f.value_display})</small>
              </div>
            ))}
          </div>
        </div>

        {/* "What Should I Do?" Action Engine */}
        <div className="recommendation-notice" style={{ borderLeftColor: RISK_BADGE_STYLE[zone.risk_level] }}>
          <ShieldCheck size={22} className="rec-icon" />
          <div>
            <strong>What Should I Do? (Action Advisory)</strong>
            <p>{zone.action_advice || zone.recommendation}</p>
            <small>Note: SlopeSafe recommendations provide decision support and do not replace official State SDMA / NDMA emergency orders.</small>
          </div>
        </div>

        <div className="action-buttons-row">
          <button className="btn-secondary" onClick={onNavigateToRoute}>
            <Route size={16} /> Find Safe Route Bypassing This Zone
          </button>
          <button className="btn-primary" onClick={onNavigateToReport}>
            <Send size={16} /> Submit Ground Hazard Report Here
          </button>
        </div>
      </div>
    </div>
  );
};
