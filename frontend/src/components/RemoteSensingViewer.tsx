import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { InSARDisplacementResponse, SpectralIndexSector, SentinelSummaryResponse } from '../types';
import { 
  Radio, Orbit, Activity, RefreshCw, Eye, 
  Compass, Layers, Mountain, ShieldAlert, CheckCircle2 
} from 'lucide-react';

export const RemoteSensingViewerComponent: React.FC = () => {
  const [insarData, setInsarData] = useState<InSARDisplacementResponse | null>(null);
  const [sectors, setSectors] = useState<SpectralIndexSector[]>([]);
  const [sentinelSummary, setSentinelSummary] = useState<SentinelSummaryResponse | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async (secId: number = selectedSectorId) => {
    setLoading(true);
    try {
      const [secList, summary] = await Promise.all([
        apiService.getSatelliteIndices(),
        apiService.getSentinelSummary()
      ]);
      setSectors(secList);
      setSentinelSummary(summary);
      
      const sec = secList.find(s => s.id === secId) || secList[0];
      if (sec) {
        const insar = await apiService.getInSARDisplacement(sec.id, sec.name);
        setInsarData(insar);
      }
    } catch (err) {
      console.error('Failed to load remote sensing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedSectorId);
  }, [selectedSectorId]);

  return (
    <div className="remote-sensing-container">
      {/* Header */}
      <div className="validation-header">
        <div className="header-left">
          <div className="badge-official">
            <Orbit size={15} /> ESA COPERNICUS &amp; NASA SRTM
          </div>
          <h2>Satellite Earth Observation &amp; InSAR Radar Observatory</h2>
          <p>Millimeter-scale ground slope deformation via Sentinel-1 C-Band SAR Interferometry, multi-spectral NDVI vegetation loss, and Copernicus 30m Topographic Wetness Index (TWI).</p>
        </div>
        <button className="btn-refresh-telemetry" onClick={() => fetchData(selectedSectorId)}>
          <RefreshCw size={15} /> Refresh Satellite Telemetry
        </button>
      </div>

      {/* Constellations Summary Bar */}
      {sentinelSummary && (
        <div className="constellations-bar">
          {sentinelSummary.constellations.map(c => (
            <div key={c.name} className="constellation-chip">
              <Radio size={16} className="text-emerald-400" />
              <div>
                <strong>{c.name}</strong>
                <p>{c.sensor} · {c.revisit_time}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sector Selector */}
      <div className="sector-selector-bar">
        <span>Select Monitored Mountain Sector:</span>
        <div className="sector-chips">
          {sectors.map(s => (
            <button
              key={s.id}
              className={`sector-chip ${selectedSectorId === s.id ? 'active' : ''}`}
              onClick={() => setSelectedSectorId(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Observatory Grid */}
      {insarData && (
        <div className="observatory-grid">
          {/* InSAR Displacement Time Series Chart */}
          <div className="observatory-card insar-main-card">
            <div className="card-top">
              <div>
                <h3>Sentinel-1 InSAR Line-of-Sight (LOS) Surface Displacement Time Series</h3>
                <p>12-Month Cumulative Plastic Deformation Creep (mm downslope)</p>
              </div>
              <span className={`status-badge-crit ${Math.abs(insarData.insar_metrics.cumulative_12m_displacement_mm) > 30 ? 'critical' : 'warning'}`}>
                {insarData.insar_metrics.deformation_status}
              </span>
            </div>

            <div className="insar-kpis">
              <div className="kpi-block">
                <span className="kpi-label">Annual Creep Velocity</span>
                <span className="kpi-value text-red-400">{insarData.insar_metrics.mean_annual_velocity_mm_yr} mm/yr</span>
              </div>
              <div className="kpi-block">
                <span className="kpi-label">12m Cumulative LOS</span>
                <span className="kpi-value text-orange-400">{insarData.insar_metrics.cumulative_12m_displacement_mm} mm</span>
              </div>
              <div className="kpi-block">
                <span className="kpi-label">Interferometric Coherence (γ)</span>
                <span className="kpi-value text-emerald-400">{insarData.insar_metrics.interferometric_coherence}</span>
              </div>
              <div className="kpi-block">
                <span className="kpi-label">Radar Geometry</span>
                <span className="kpi-value text-indigo-400">{insarData.orbital_geometry.track_type}</span>
              </div>
            </div>

            {/* SVG Displacement Curve Chart */}
            <div className="svg-chart-wrapper">
              <svg viewBox="0 0 500 180" className="insar-svg">
                {/* Background horizontal lines */}
                <line x1="40" y1="30" x2="480" y2="30" stroke="#334155" strokeDasharray="3 3" />
                <line x1="40" y1="75" x2="480" y2="75" stroke="#334155" strokeDasharray="3 3" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="#334155" strokeDasharray="3 3" />
                <line x1="40" y1="150" x2="480" y2="150" stroke="#475569" strokeWidth="1.5" />
                <line x1="40" y1="20" x2="40" y2="150" stroke="#475569" strokeWidth="1.5" />

                {/* Bars or Area for monthly displacement */}
                {insarData.monthly_time_series.map((pt, i) => {
                  const x = 55 + i * 35;
                  const y = 30 + Math.abs(pt.cumulative_displacement_mm) * 2.8;
                  return (
                    <g key={pt.month}>
                      <rect
                        x={x - 8}
                        y={30}
                        width={16}
                        height={Math.min(120, Math.abs(pt.cumulative_displacement_mm) * 2.8)}
                        fill={i >= 8 ? '#ef4444' : '#f97316'}
                        opacity="0.75"
                        rx="2"
                      />
                      <text x={x} y="165" fill="#94a3b8" fontSize="8" textAnchor="middle">
                        {pt.month.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}

                <text x="10" y="80" fill="#94a3b8" fontSize="9" transform="rotate(-90 10 80)">
                  Displacement (mm)
                </text>
              </svg>
            </div>
          </div>

          {/* Spectral Indices Card: NDVI, NDWI, DEM TWI */}
          {sectors.find(s => s.id === selectedSectorId) && (
            <div className="observatory-card indices-card">
              <h3>Sentinel-2 &amp; DEM Hydro-Geomorphic Indices</h3>
              {(() => {
                const s = sectors.find(sec => sec.id === selectedSectorId)!;
                return (
                  <div className="indices-body">
                    <div className="index-meter-row">
                      <div className="im-header">
                        <span>NDVI (Vegetation Canopy Index)</span>
                        <strong>{s.ndvi} (Baseline: {s.ndvi_baseline})</strong>
                      </div>
                      <div className="meter-track">
                        <div className="meter-fill green" style={{ width: `${s.ndvi * 100}%` }} />
                      </div>
                      <small className="text-red-400">⚠️ {s.vegetation_loss_anomaly_pct}% canopy loss / scar anomaly</small>
                    </div>

                    <div className="index-meter-row">
                      <div className="im-header">
                        <span>NDWI (Normalized Difference Water Index)</span>
                        <strong>{s.ndwi}</strong>
                      </div>
                      <div className="meter-track">
                        <div className="meter-fill blue" style={{ width: `${Math.max(10, s.ndwi * 150)}%` }} />
                      </div>
                      <small className="text-blue-400">● {s.surface_saturation_status.replace('_', ' ')}</small>
                    </div>

                    <div className="index-meter-row">
                      <div className="im-header">
                        <span>Topographic Wetness Index (TWI)</span>
                        <strong>{s.twi} ln(a/tanβ)</strong>
                      </div>
                      <div className="meter-track">
                        <div className="meter-fill purple" style={{ width: `${(s.twi / 15) * 100}%` }} />
                      </div>
                      <small className="text-purple-400">● {s.topographic_wetness_risk.replace('_', ' ')}</small>
                    </div>

                    <div className="dem-meta-box">
                      <div><Mountain size={14} /> Elevation: <strong>{s.dem_elevation_m} m</strong></div>
                      <div><Compass size={14} /> Slope Aspect: <strong>{s.aspect}</strong></div>
                      <div><Activity size={14} /> Slope Angle: <strong>{s.slope_deg}°</strong></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
