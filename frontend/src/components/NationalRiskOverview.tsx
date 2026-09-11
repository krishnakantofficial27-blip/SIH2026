import React from 'react';
import { RiskSummary } from '../types';
import { ShieldAlert, TrendingUp, AlertTriangle, MapPin, Bell } from 'lucide-react';

interface NationalRiskOverviewProps {
  summary: RiskSummary | null;
  onNavigateTab?: (tab: string) => void;
}

export const NationalRiskOverview: React.FC<NationalRiskOverviewProps> = ({ summary, onNavigateTab }) => {
  const score = summary?.overall_score ?? 66;
  const level = summary?.overall_level ?? 'HIGH';
  const totalHotspots = summary?.total_zones ?? 22;
  const highRisk = summary?.high_risk_zones ?? 17;
  const criticalHazards = summary?.critical_zones ?? 10;
  const activeWarnings = summary?.active_alerts ?? 3;

  // Calculate position percentage for the risk marker (clamped 0 to 100)
  const markerPercent = Math.min(100, Math.max(0, score));

  return (
    <div className="national-risk-overview-panel">
      {/* Left: Overall Risk Level & Score */}
      <div className="risk-overview-left">
        <div className="risk-level-header">
          <span className="risk-overview-tag">NATIONAL RISK LEVEL</span>
        </div>
        <div className="risk-level-display">
          <span className={`risk-level-text level-${level.toLowerCase()}`}>{level}</span>
          <span className="risk-score-pill">{score} / 100</span>
        </div>
        <p className="risk-overview-caption">
          Elevated landslide probability across monitored regions.
        </p>
      </div>

      {/* Center: Risk Scale Spectrum with Marker */}
      <div className="risk-overview-center">
        <div className="scale-labels-row">
          <span className="scale-label">LOW</span>
          <span className="scale-label">MODERATE</span>
          <span className="scale-label">HIGH</span>
          <span className="scale-label">CRITICAL</span>
        </div>
        <div className="risk-scale-track">
          <div className="scale-segment seg-low"></div>
          <div className="scale-segment seg-mod"></div>
          <div className="scale-segment seg-high"></div>
          <div className="scale-segment seg-crit"></div>
          {/* Active pointer marker */}
          <div 
            className="scale-active-pointer" 
            style={{ left: `${markerPercent}%` }}
            title={`Current National Hazard Index: ${score}/100`}
          >
            <div className="pointer-pin"></div>
            <span className="pointer-val">{score}</span>
          </div>
        </div>
        <div className="scale-footer-legend">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      {/* Right: Integrated Compact Statistics with Vertical Borders */}
      <div className="risk-overview-right">
        <div 
          className="compact-metric-col clickable"
          onClick={() => onNavigateTab && onNavigateTab('map')}
          title="View Monitored Hotspots on Map"
        >
          <div className="metric-val-row">
            <span className="metric-number">{totalHotspots}</span>
          </div>
          <span className="metric-label">Monitored Hotspots</span>
          <span className="metric-context-trend trend-neutral">+3 from yesterday</span>
        </div>

        <div 
          className="compact-metric-col clickable"
          onClick={() => onNavigateTab && onNavigateTab('map')}
          title="Filter High Risk Zones"
        >
          <div className="metric-val-row">
            <span className="metric-number text-orange">{highRisk}</span>
          </div>
          <span className="metric-label">High-Risk Zones</span>
          <span className="metric-context-trend trend-warning">+2 from yesterday</span>
        </div>

        <div 
          className="compact-metric-col clickable"
          onClick={() => onNavigateTab && onNavigateTab('map')}
          title="Filter Critical Hazards"
        >
          <div className="metric-val-row">
            <span className="metric-number text-red">{criticalHazards}</span>
          </div>
          <span className="metric-label">Critical Hazards</span>
          <span className="metric-context-trend trend-critical">+1 from yesterday</span>
        </div>

        <div 
          className="compact-metric-col clickable"
          onClick={() => onNavigateTab && onNavigateTab('alerts')}
          title="View Active Warnings"
        >
          <div className="metric-val-row">
            <span className="metric-number text-cyan">{activeWarnings}</span>
          </div>
          <span className="metric-label">Active Warnings</span>
          <span className="metric-context-trend trend-neutral">No change</span>
        </div>
      </div>
    </div>
  );
};
