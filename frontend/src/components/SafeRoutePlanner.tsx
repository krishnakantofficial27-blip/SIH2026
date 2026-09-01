import React, { useState } from 'react';
import { SafeRouteResponse } from '../types';
import { apiService } from '../services/api';
import { Route, MapPin, AlertTriangle, ShieldCheck, ArrowRight, Loader2, Info } from 'lucide-react';

interface SafeRoutePlannerProps {
  onRouteCalculated: (data: SafeRouteResponse) => void;
  userLocation?: { lat: number; lng: number } | null;
  onFetchLocation?: () => void;
}

const DEMO_PRESETS = [
  { name: 'Shillong → Kohima', start: { lat: 25.58, lng: 91.89 }, end: { lat: 25.67, lng: 94.11 } },
  { name: 'Aizawl → Imphal', start: { lat: 23.73, lng: 92.72 }, end: { lat: 24.82, lng: 93.94 } },
  { name: 'Gangtok → Shillong', start: { lat: 27.33, lng: 88.61 }, end: { lat: 25.58, lng: 91.89 } },
];

export const SafeRoutePlanner: React.FC<SafeRoutePlannerProps> = ({
  onRouteCalculated,
  userLocation,
  onFetchLocation,
}) => {
  const [startLat, setStartLat] = useState<number>(25.58);
  const [startLng, setStartLng] = useState<number>(91.89);
  const [endLat, setEndLat] = useState<number>(25.67);
  const [endLng, setEndLng] = useState<number>(94.11);
  const [loading, setLoading] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<SafeRouteResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleCalculate = async (sLat = startLat, sLng = startLng, eLat = endLat, eLng = endLng) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await apiService.getSafeRoute(sLat, sLng, eLat, eLng);
      setRouteResult(data);
      onRouteCalculated(data);
    } catch (err: any) {
      setErrorMsg('Failed to calculate safe route. Ensure coordinates are within North Eastern Region.');
    } finally {
      setLoading(false);
    }
  };

  const applyUserLocationAsStart = () => {
    if (userLocation) {
      setStartLat(userLocation.lat);
      setStartLng(userLocation.lng);
    } else if (onFetchLocation) {
      onFetchLocation();
    }
  };

  return (
    <div className="safe-route-container">
      <div className="route-header">
        <Route size={24} className="header-icon" />
        <div>
          <h2>Risk-Aware Safe Route Engine</h2>
          <p>Dijkstra risk penalty graph detours transit away from high-instability slopes</p>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="preset-row">
        <span>Presets:</span>
        {DEMO_PRESETS.map(p => (
          <button
            key={p.name}
            className="preset-chip"
            onClick={() => {
              setStartLat(p.start.lat);
              setStartLng(p.start.lng);
              setEndLat(p.end.lat);
              setEndLng(p.end.lng);
              handleCalculate(p.start.lat, p.start.lng, p.end.lat, p.end.lng);
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Input controls */}
      <div className="route-inputs-card">
        <div className="input-group">
          <label>START LOCATION (Lat, Lng)</label>
          <div className="coords-row">
            <input
              type="number"
              step="0.01"
              value={startLat}
              onChange={e => setStartLat(parseFloat(e.target.value))}
            />
            <input
              type="number"
              step="0.01"
              value={startLng}
              onChange={e => setStartLng(parseFloat(e.target.value))}
            />
            <button className="loc-btn" onClick={applyUserLocationAsStart} title="Use My Location">
              <MapPin size={16} /> My Location
            </button>
          </div>
        </div>

        <div className="input-group">
          <label>DESTINATION LOCATION (Lat, Lng)</label>
          <div className="coords-row">
            <input
              type="number"
              step="0.01"
              value={endLat}
              onChange={e => setEndLat(parseFloat(e.target.value))}
            />
            <input
              type="number"
              step="0.01"
              value={endLng}
              onChange={e => setEndLng(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <button className="calc-btn" onClick={() => handleCalculate()} disabled={loading}>
          {loading ? <Loader2 size={18} className="spin" /> : <ArrowRight size={18} />}
          {loading ? 'Calculating Safest Route...' : 'FIND SAFEST ROUTE'}
        </button>
      </div>

      {errorMsg && <div className="notice error-banner">{errorMsg}</div>}

      {/* Route Results Comparison */}
      {routeResult && (
        <div className="route-results-section">
          {/* Mandatory No Safe Route Fallback Notice */}
          {routeResult.fallback_active && (
            <div className="notice warning-banner">
              <AlertTriangle size={18} />
              <div>
                <strong>No completely low-risk route is currently available.</strong>
                <p>All direct corridors pass near high-risk slopes. The system has calculated the path with the lowest overall risk exposure.</p>
              </div>
            </div>
          )}

          <div className="comparison-grid">
            {/* FASTEST ROUTE CARD */}
            <div className="route-card fastest">
              <div className="card-tag">FASTEST ROUTE</div>
              <h3>{routeResult.fastest_route.distance_km} km</h3>
              <div className="route-meta">
                <span>⏱️ ~{routeResult.fastest_route.duration_minutes} mins</span>
                <span className={`risk-pill ${routeResult.fastest_route.risk_level}`}>
                  Risk Exposure: {routeResult.fastest_route.risk_exposure}% ({routeResult.fastest_route.risk_level})
                </span>
              </div>
              <p className="crossings">
                ⚠️ Crosses <strong>{routeResult.fastest_route.high_risk_zones_crossed}</strong> high-risk zone(s)
              </p>
            </div>

            {/* SAFE ROUTE CARD */}
            <div className="route-card safe highlighted">
              <div className="card-tag safe-tag">RECOMMENDED SAFE ROUTE</div>
              <h3>{routeResult.safe_route.distance_km} km</h3>
              <div className="route-meta">
                <span>⏱️ ~{routeResult.safe_route.duration_minutes} mins</span>
                <span className={`risk-pill ${routeResult.safe_route.risk_level}`}>
                  Risk Exposure: {routeResult.safe_route.risk_exposure}% ({routeResult.safe_route.risk_level})
                </span>
              </div>
              <p className="crossings green">
                🛡️ Avoids critical instability passes ({routeResult.safe_route.high_risk_zones_crossed} critical zones)
              </p>
            </div>
          </div>

          <div className="recommendation-card">
            <ShieldCheck size={20} className="rec-icon" />
            <div>
              <strong>Recommendation:</strong>
              <p>{routeResult.recommendation}</p>
              <small>Graph routing algorithm source: {routeResult.source}</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
