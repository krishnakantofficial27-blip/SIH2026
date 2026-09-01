import React from 'react';
import { Zone } from '../types';
import { X, CloudRain, Mountain, Droplets, History, Users, AlertTriangle, ShieldCheck, Route, Send } from 'lucide-react';

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
            <span className="zone-badge-id">ZONE {zone.id}</span>
            <h2>{zone.name}</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="score-hero-row">
          <div className="score-box" style={{ borderColor: RISK_BADGE_STYLE[zone.risk_level] }}>
            <span className="score-number">{zone.risk_score}</span>
            <small>/ 100</small>
            <div className="level-pill" style={{ backgroundColor: RISK_BADGE_STYLE[zone.risk_level] }}>
              {zone.risk_level}
            </div>
          </div>

          {/* Feature 7: Risk Fusion Explanation */}
          <div className="fusion-box">
            <h4>AI + COMMUNITY RISK FUSION</h4>
            <div className="fusion-breakdown">
              <div>
                <small>AI PREDICTION</small>
                <strong>{zone.ml_score}</strong>
              </div>
              <span className="operator">+</span>
              <div>
                <small>{zone.community_reports_count} VERIFIED REPORTS</small>
                <strong>+{zone.community_adjustment}</strong>
              </div>
              <span className="operator">=</span>
              <div>
                <small>FINAL RISK</small>
                <strong style={{ color: RISK_BADGE_STYLE[zone.risk_level] }}>{zone.risk_score}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-tile">
            <CloudRain size={18} className="tile-icon" />
            <div>
              <label>Rainfall 24h / 72h</label>
              <span>{zone.rainfall_24h} mm / {zone.rainfall_72h} mm</span>
            </div>
          </div>

          <div className="metric-tile">
            <Mountain size={18} className="tile-icon" />
            <div>
              <label>Slope & Elevation</label>
              <span>{zone.slope_deg}° | {zone.elevation}m</span>
            </div>
          </div>

          <div className="metric-tile">
            <Droplets size={18} className="tile-icon" />
            <div>
              <label>Soil Moisture</label>
              <span>{Math.round(zone.soil_moisture * 100)}%</span>
            </div>
          </div>

          <div className="metric-tile">
            <History size={18} className="tile-icon" />
            <div>
              <label>Historical Landslides</label>
              <span>{zone.historical_landslides} events recorded</span>
            </div>
          </div>
        </div>

        {/* Feature 3 / Explainability Section */}
        <div className="explainability-box">
          <h3>WHY IS THIS ZONE RISK {zone.risk_level}?</h3>
          <ul className="factors-list">
            {zone.rainfall_24h >= 50 && (
              <li><AlertTriangle size={15} /> Heavy accumulated rainfall in past 24–72 hours</li>
            )}
            {zone.slope_deg >= 30 && (
              <li><AlertTriangle size={15} /> Steep slope angle increase shear stress</li>
            )}
            {zone.soil_moisture >= 0.5 && (
              <li><AlertTriangle size={15} /> High soil saturation nearing liquid limit threshold</li>
            )}
            {zone.historical_landslides >= 3 && (
              <li><AlertTriangle size={15} /> High frequency of past landslide occurrences</li>
            )}
            {zone.community_reports_count > 0 && (
              <li><AlertTriangle size={15} /> Ground tension cracks/seepage reported by local residents</li>
            )}
          </ul>
        </div>

        <div className="recommendation-notice">
          <ShieldCheck size={18} />
          <p>{zone.recommendation}</p>
        </div>

        <div className="action-buttons-row">
          <button className="btn-secondary" onClick={onNavigateToRoute}>
            <Route size={16} /> Find Safe Route
          </button>
          <button className="btn-primary" onClick={onNavigateToReport}>
            <Send size={16} /> Report Hazard Here
          </button>
        </div>
      </div>
    </div>
  );
};
