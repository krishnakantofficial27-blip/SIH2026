import React, { useState } from 'react';
import { SafeRouteResponse } from '../types';
import { apiService } from '../services/api';
import { Route, MapPin, AlertTriangle, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';

interface SafeRoutePlannerProps {
  onRouteCalculated: (data: SafeRouteResponse) => void;
  userLocation?: { lat: number; lng: number } | null;
  onFetchLocation?: () => void;
  onViewOnMap?: () => void;
}

const DEMO_PRESETS = [
  { name: 'Shillong → Kohima', startName: 'Shillong', endName: 'Kohima', start: { lat: 25.58, lng: 91.89 }, end: { lat: 25.67, lng: 94.11 } },
  { name: 'Aizawl → Imphal', startName: 'Aizawl', endName: 'Imphal', start: { lat: 23.73, lng: 92.72 }, end: { lat: 24.82, lng: 93.94 } },
  { name: 'Gangtok → Shillong', startName: 'Gangtok', endName: 'Shillong', start: { lat: 27.33, lng: 88.61 }, end: { lat: 25.58, lng: 91.89 } },
];

export const SafeRoutePlanner: React.FC<SafeRoutePlannerProps> = ({
  onRouteCalculated,
  userLocation,
  onFetchLocation,
  onViewOnMap,
}) => {
  const [startName, setStartName] = useState<string>('Shillong');
  const [endName, setEndName] = useState<string>('Kohima');
  
  const [explicitStartCoords, setExplicitStartCoords] = useState<{lat: number; lng: number} | null>({ lat: 25.58, lng: 91.89 });
  const [explicitEndCoords, setExplicitEndCoords] = useState<{lat: number; lng: number} | null>({ lat: 25.67, lng: 94.11 });

  const [loading, setLoading] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<SafeRouteResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const geocodePlace = async (place: string) => {
    if (place.toLowerCase().includes('my location') && userLocation) {
      return { lat: userLocation.lat, lng: userLocation.lng };
    }
    const res = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`);
    if (res.data && res.data.length > 0) {
      return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
    }
    throw new Error(`Could not find coordinates for "${place}". Please try a different name.`);
  };

  const handleCalculate = async () => {
    if (!startName || !endName) {
      setErrorMsg("Please enter both a start and destination location.");
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    try {
      let sLat, sLng, eLat, eLng;
      
      if (explicitStartCoords) {
        sLat = explicitStartCoords.lat;
        sLng = explicitStartCoords.lng;
      } else {
        const coords = await geocodePlace(startName);
        sLat = coords.lat;
        sLng = coords.lng;
      }
      
      if (explicitEndCoords) {
        eLat = explicitEndCoords.lat;
        eLng = explicitEndCoords.lng;
      } else {
        const coords = await geocodePlace(endName);
        eLat = coords.lat;
        eLng = coords.lng;
      }

      const data = await apiService.getSafeRoute(sLat, sLng, eLat, eLng);
      setRouteResult(data);
      onRouteCalculated(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to calculate safe route. Ensure coordinates are valid.');
    } finally {
      setLoading(false);
    }
  };

  const applyUserLocationAsStart = () => {
    if (userLocation) {
      setStartName('📍 My Current Location');
      setExplicitStartCoords({ lat: userLocation.lat, lng: userLocation.lng });
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
              setStartName(p.startName);
              setEndName(p.endName);
              setExplicitStartCoords(p.start);
              setExplicitEndCoords(p.end);
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Input controls */}
      <div className="route-inputs-card">
        <div className="input-group">
          <label>START LOCATION</label>
          <div className="coords-row">
            <input
              type="text"
              value={startName}
              placeholder="e.g. Guwahati"
              onChange={e => {
                setStartName(e.target.value);
                setExplicitStartCoords(null);
              }}
              style={{ width: '100%', maxWidth: '400px' }}
            />
            <button className="loc-btn" onClick={applyUserLocationAsStart} title="Use My Location">
              <MapPin size={16} /> My Location
            </button>
          </div>
        </div>

        <div className="input-group">
          <label>DESTINATION LOCATION</label>
          <div className="coords-row">
            <input
              type="text"
              value={endName}
              placeholder="e.g. Dimapur"
              onChange={e => {
                setEndName(e.target.value);
                setExplicitEndCoords(null);
              }}
              style={{ width: '100%', maxWidth: '400px' }}
            />
          </div>
        </div>

        <button className="calc-btn" onClick={() => handleCalculate()} disabled={loading}>
          {loading ? <Loader2 size={18} className="spin" /> : <ArrowRight size={18} />}
          {loading ? 'Geocoding & Calculating...' : 'FIND SAFEST ROUTE'}
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
