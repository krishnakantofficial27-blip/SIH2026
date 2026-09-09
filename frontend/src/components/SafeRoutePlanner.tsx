import React, { useState } from 'react';
import { SafeRouteResponse } from '../types';
import { apiService } from '../services/api';
import { 
  Route, MapPin, AlertTriangle, ShieldCheck, ArrowRight, 
  Loader2, Info, Compass, CheckCircle2 
} from 'lucide-react';
import axios from 'axios';

interface SafeRoutePlannerProps {
  onRouteCalculated: (data: SafeRouteResponse) => void;
  userLocation?: { lat: number; lng: number } | null;
  onFetchLocation?: () => void;
  onViewOnMap?: () => void;
}

const NATIONAL_DEMO_PRESETS = [
  { 
    name: 'Kozhikode → Wayanad (NH-766 Thamarassery Churam, Kerala)', 
    startName: 'Kozhikode Town', 
    endName: 'Wayanad Kalpetta', 
    start: { lat: 11.2588, lng: 75.7804 }, 
    end: { lat: 11.6050, lng: 76.0830 } 
  },
  { 
    name: 'Mumbai → Pune (Khandala Bhor Ghat, Maharashtra)', 
    startName: 'Navi Mumbai', 
    endName: 'Pune Shivajinagar', 
    start: { lat: 19.0330, lng: 73.0297 }, 
    end: { lat: 18.5314, lng: 73.8446 } 
  },
  { 
    name: 'Rishikesh → Badrinath (Char Dham Highway, Uttarakhand)', 
    startName: 'Rishikesh Bypass', 
    endName: 'Joshimath-Badrinath', 
    start: { lat: 30.0869, lng: 78.2676 }, 
    end: { lat: 30.5564, lng: 79.5630 } 
  },
  { 
    name: 'Siliguri → Gangtok (NH-10 Teesta Valley, Sikkim)', 
    startName: 'Siliguri Junction', 
    endName: 'Gangtok MG Marg', 
    start: { lat: 26.7271, lng: 88.3953 }, 
    end: { lat: 27.3314, lng: 88.6138 } 
  },
  { 
    name: 'Mandi → Manali (NH-3 Corridor, Himachal Pradesh)', 
    startName: 'Mandi Town', 
    endName: 'Manali Mall Road', 
    start: { lat: 31.7088, lng: 76.9320 }, 
    end: { lat: 32.2432, lng: 77.1892 } 
  },
  { 
    name: 'Chandigarh → Shimla (NH-5 Expressway)', 
    startName: 'Chandigarh ISBT', 
    endName: 'Shimla Old Bus Stand', 
    start: { lat: 30.7333, lng: 76.7794 }, 
    end: { lat: 31.1048, lng: 77.1734 } 
  },
];

export const SafeRoutePlanner: React.FC<SafeRoutePlannerProps> = ({
  onRouteCalculated,
  userLocation,
  onFetchLocation,
  onViewOnMap,
}) => {
  const [startName, setStartName] = useState<string>('Kozhikode Town');
  const [endName, setEndName] = useState<string>('Wayanad Kalpetta');
  
  const [explicitStartCoords, setExplicitStartCoords] = useState<{lat: number; lng: number} | null>({ lat: 11.2588, lng: 75.7804 });
  const [explicitEndCoords, setExplicitEndCoords] = useState<{lat: number; lng: number} | null>({ lat: 11.6050, lng: 76.0830 });

  const [loading, setLoading] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<SafeRouteResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const geocodePlace = async (place: string) => {
    if (place.toLowerCase().includes('my location') && userLocation) {
      return { lat: userLocation.lat, lng: userLocation.lng };
    }
    const res = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place + ' India')}&format=json&limit=1`);
    if (res.data && res.data.length > 0) {
      return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
    }
    // Fallback search without India suffix
    const res2 = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`);
    if (res2.data && res2.data.length > 0) {
      return { lat: parseFloat(res2.data[0].lat), lng: parseFloat(res2.data[0].lon) };
    }
    throw new Error(`Could not find coordinates for "${place}". Please select a preset or provide a specific town name.`);
  };

  const handleCalculate = async () => {
    if (!startName || !endName) {
      setErrorMsg("Please enter both a start location and destination.");
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
      setErrorMsg(err.message || 'Failed to calculate safe transit route. Ensure coordinates are valid.');
    } finally {
      setLoading(false);
    }
  };

  const applyUserLocationAsStart = () => {
    if (userLocation) {
      setStartName('📍 My Live Position');
      setExplicitStartCoords({ lat: userLocation.lat, lng: userLocation.lng });
    } else if (onFetchLocation) {
      onFetchLocation();
    }
  };

  return (
    <div className="safe-route-container">
      <div className="route-header">
        <Route size={26} className="header-icon" />
        <div>
          <h2>Risk-Aware Safe Transit Route Engine</h2>
          <p>National multi-corridor transit graph evaluating highway segments intersecting steep, saturated mountain slopes</p>
        </div>
      </div>

      {/* Preset arterial buttons */}
      <div className="preset-row">
        <span>National Highway Corridors:</span>
        {NATIONAL_DEMO_PRESETS.map(p => (
          <button
            key={p.name}
            className={`preset-chip ${startName === p.startName ? 'active' : ''}`}
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
          <label>START ORIGIN (TOWN / LANDMARK)</label>
          <div className="coords-row">
            <input
              type="text"
              value={startName}
              placeholder="e.g. Mandi, Shimla, Chandigarh..."
              onChange={e => {
                setStartName(e.target.value);
                setExplicitStartCoords(null);
              }}
              style={{ width: '100%', maxWidth: '400px' }}
            />
            <button className="loc-btn" onClick={applyUserLocationAsStart} title="Use My Current Position">
              <MapPin size={16} /> My Position
            </button>
          </div>
        </div>

        <div className="input-group">
          <label>DESTINATION (TOWN / LANDMARK)</label>
          <div className="coords-row">
            <input
              type="text"
              value={endName}
              placeholder="e.g. Manali, Dharamshala, Rampur..."
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
          {loading ? 'Evaluating Landslide Exposure...' : 'EVALUATE TRANSIT ROUTE RISK'}
        </button>
      </div>

      {errorMsg && <div className="notice error-banner">{errorMsg}</div>}

      {/* Route Results Comparison */}
      {routeResult && (
        <div className="route-results-section">
          {/* Transparency Disclaimer Notice */}
          <div className="notice info-banner">
            <Info size={18} />
            <div>
              <strong>Scientific Decision-Support Transparency:</strong>
              <span>
                {' '}No mountain road can be guaranteed 100% hazard-free during extreme monsoon rainfall. SlopeSafe evaluates and recommends routes with <strong>lower estimated landslide exposure</strong> based on live slope saturation.
              </span>
            </div>
          </div>

          <div className="comparison-grid">
            {/* FASTEST ROUTE CARD */}
            <div className="route-card fastest">
              <div className="card-tag">DIRECT / FASTEST HIGHWAY</div>
              <h3>{routeResult.fastest_route.distance_km} km</h3>
              <div className="route-meta">
                <span>⏱️ ~{routeResult.fastest_route.duration_minutes} mins</span>
                <span className={`risk-pill ${routeResult.fastest_route.risk_level}`}>
                  Estimated Exposure: {routeResult.fastest_route.risk_exposure}% ({routeResult.fastest_route.risk_level})
                </span>
              </div>
              <p className="crossings">
                {routeResult.fastest_route.high_risk_zones_crossed > 0 ? (
                  <>⚠️ Intersects <strong>{routeResult.fastest_route.high_risk_zones_crossed}</strong> active high-risk slope failure corridor(s)</>
                ) : (
                  <>✓ No active critical slope failure corridors intersecting this path</>
                )}
              </p>
            </div>

            {/* RECOMMENDED LOWER EXPOSURE ROUTE CARD */}
            <div className="route-card safe highlighted">
              <div className="card-tag safe-tag">RECOMMENDED (LOWER EXPOSURE DETOUR)</div>
              <h3>{routeResult.safe_route.distance_km} km</h3>
              <div className="route-meta">
                <span>⏱️ ~{routeResult.safe_route.duration_minutes} mins</span>
                <span className={`risk-pill ${routeResult.safe_route.risk_level}`}>
                  Estimated Exposure: {routeResult.safe_route.risk_exposure}% ({routeResult.safe_route.risk_level})
                </span>
              </div>
              <p className="crossings green">
                🛡️ Bypasses critical cutting slopes ({routeResult.safe_route.high_risk_zones_crossed} critical hazard crossings)
              </p>
            </div>
          </div>

          <div className="recommendation-card">
            <ShieldCheck size={22} className="rec-icon" />
            <div>
              <strong>Transit Advisory:</strong>
              <p>{routeResult.recommendation}</p>
              <small>Algorithm: {routeResult.source}</small>
            </div>
            {onViewOnMap && (
              <button className="btn-view-map-action" onClick={onViewOnMap}>
                View Polyline on Risk Map →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
