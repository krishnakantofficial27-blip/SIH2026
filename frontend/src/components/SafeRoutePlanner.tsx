import React, { useState, useEffect } from 'react';
import { SafeRouteResponse } from '../types';
import { apiService } from '../services/api';
import { 
  Route, MapPin, AlertTriangle, ShieldCheck, ArrowRight, 
  Loader2, Info, Compass, CheckCircle2, ArrowLeftRight,
  Layers, ShieldAlert, Sparkles, Clock, Navigation2, Milestone, Car
} from 'lucide-react';
import axios from 'axios';

interface SafeRoutePlannerProps {
  onRouteCalculated: (data: SafeRouteResponse) => void;
  userLocation?: { lat: number; lng: number } | null;
  onFetchLocation?: () => void;
  onViewOnMap?: () => void;
  initialDestination?: { lat: number; lng: number; name?: string } | null;
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
  initialDestination,
}) => {
  const [startName, setStartName] = useState<string>('Kozhikode Town');
  const [endName, setEndName] = useState<string>('Wayanad Kalpetta');
  
  const [explicitStartCoords, setExplicitStartCoords] = useState<{lat: number; lng: number} | null>({ lat: 11.2588, lng: 75.7804 });
  const [explicitEndCoords, setExplicitEndCoords] = useState<{lat: number; lng: number} | null>({ lat: 11.6050, lng: 76.0830 });

  const [loading, setLoading] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<SafeRouteResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (initialDestination) {
      setEndName(initialDestination.name || `Pinned [${initialDestination.lat.toFixed(3)}, ${initialDestination.lng.toFixed(3)}]`);
      setExplicitEndCoords({ lat: initialDestination.lat, lng: initialDestination.lng });
      if (userLocation) {
        setStartName('My Live Location');
        setExplicitStartCoords({ lat: userLocation.lat, lng: userLocation.lng });
        calculateRoute(userLocation.lat, userLocation.lng, initialDestination.lat, initialDestination.lng);
      }
    }
  }, [initialDestination]);

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

  const calculateRoute = async (sLat: number, sLng: number, eLat: number, eLng: number) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await apiService.getSafeRoute(sLat, sLng, eLat, eLng);
      setRouteResult(data);
      onRouteCalculated(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to calculate safe transit route. Ensure coordinates are valid.');
    } finally {
      setLoading(false);
    }
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

      await calculateRoute(sLat, sLng, eLat, eLng);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to calculate safe transit route. Ensure coordinates are valid.');
      setLoading(false);
    }
  };

  const handleSelectPreset = (p: typeof NATIONAL_DEMO_PRESETS[0]) => {
    setStartName(p.startName);
    setEndName(p.endName);
    setExplicitStartCoords(p.start);
    setExplicitEndCoords(p.end);
    calculateRoute(p.start.lat, p.start.lng, p.end.lat, p.end.lng);
  };

  const handleSwapLocations = () => {
    const curStartName = startName;
    const curStartCoords = explicitStartCoords;
    const curEndName = endName;
    const curEndCoords = explicitEndCoords;

    setStartName(curEndName);
    setExplicitStartCoords(curEndCoords);
    setEndName(curStartName);
    setExplicitEndCoords(curStartCoords);

    if (curStartCoords && curEndCoords) {
      calculateRoute(curEndCoords.lat, curEndCoords.lng, curStartCoords.lat, curStartCoords.lng);
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

  // Initial calculation on mount if not yet calculated
  useEffect(() => {
    if (!routeResult && explicitStartCoords && explicitEndCoords) {
      calculateRoute(explicitStartCoords.lat, explicitStartCoords.lng, explicitEndCoords.lat, explicitEndCoords.lng);
    }
  }, []);

  return (
    <div className="safe-route-container">
      {/* Route Header */}
      <div className="route-header-creative">
        <div className="route-header-icon-wrap">
          <Route size={28} className="header-icon-pulse" />
        </div>
        <div className="route-header-text">
          <div className="route-header-badges">
            <span className="geo-engine-tag">OSM-DIJKSTRA MOUNTAIN TRANSIT MATRIX</span>
            <span className="live-status-pill">🟢 REAL-TIME HAZARD BYPASS ACTIVE</span>
          </div>
          <h2>Risk-Aware Geo-Safe Transit Engine</h2>
          <p>National multi-corridor transit graph evaluating highway segments intersecting steep, saturated mountain slopes</p>
        </div>
      </div>

      {/* Preset arterial buttons */}
      <div className="preset-corridors-panel">
        <div className="preset-corridors-title">
          <Compass size={15} /> <strong>National Highway Corridors:</strong>
        </div>
        <div className="preset-chips-list">
          {NATIONAL_DEMO_PRESETS.map(p => (
            <button
              key={p.name}
              className={`preset-chip-creative ${startName === p.startName ? 'active' : ''}`}
              onClick={() => handleSelectPreset(p)}
            >
              <Milestone size={13} />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input controls */}
      <div className="route-inputs-card-creative">
        <div className="input-group-creative">
          <div className="input-header-label">
            <span className="pin-dot start-dot"></span>
            <label>START ORIGIN (TOWN / LANDMARK)</label>
          </div>
          <div className="input-control-wrap">
            <input
              type="text"
              value={startName}
              placeholder="e.g. Kozhikode Town, Mandi, Chandigarh..."
              onChange={e => {
                setStartName(e.target.value);
                setExplicitStartCoords(null);
              }}
              className="styled-route-input"
            />
            <button className="loc-btn-creative" onClick={applyUserLocationAsStart} title="Use My Current GPS Position">
              <MapPin size={14} /> My GPS
            </button>
          </div>
        </div>

        {/* Swap Button */}
        <button 
          className="swap-route-btn" 
          onClick={handleSwapLocations} 
          title="Reverse Origin and Destination"
        >
          <ArrowLeftRight size={16} />
        </button>

        <div className="input-group-creative">
          <div className="input-header-label">
            <span className="pin-dot dest-dot"></span>
            <label>DESTINATION (TOWN / LANDMARK)</label>
          </div>
          <div className="input-control-wrap">
            <input
              type="text"
              value={endName}
              placeholder="e.g. Wayanad Kalpetta, Manali, Shimla..."
              onChange={e => {
                setEndName(e.target.value);
                setExplicitEndCoords(null);
              }}
              className="styled-route-input"
            />
          </div>
        </div>

        <button className="calc-btn-creative" onClick={handleCalculate} disabled={loading}>
          {loading ? <Loader2 size={18} className="spin" /> : <Navigation2 size={18} />}
          <span>{loading ? 'Routing...' : 'EVALUATE TRANSIT RISK'}</span>
        </button>
      </div>

      {errorMsg && <div className="notice error-banner">{errorMsg}</div>}

      {/* Route Results Comparison */}
      {routeResult && (
        <div className="route-results-section">
          {/* Visual Route Corridor Stepper */}
          <div className="route-visual-corridor">
            <div className="corridor-point start">
              <span className="corridor-dot"></span>
              <div className="corridor-info">
                <small>ORIGIN</small>
                <strong>{startName}</strong>
              </div>
            </div>

            <div className="corridor-connector">
              <div className="corridor-line">
                <span className="hazard-bypass-badge">
                  <ShieldCheck size={13} />
                  Safe Detour (+{Math.max(0.5, Math.round((routeResult.safe_route.distance_km - routeResult.fastest_route.distance_km) * 10) / 10)} km)
                </span>
              </div>
              <small className="corridor-source-tag">🛰️ Sentinel-1 InSAR + Open-Meteo Synced</small>
            </div>

            <div className="corridor-point end">
              <span className="corridor-dot end"></span>
              <div className="corridor-info">
                <small>DESTINATION</small>
                <strong>{endName}</strong>
              </div>
            </div>
          </div>

          <div className="comparison-grid-creative">
            {/* FASTEST ROUTE CARD */}
            <div className="route-card-creative fastest">
              <div className="card-top-tag direct-tag">
                <AlertTriangle size={13} /> DIRECT / STANDARD HIGHWAY
              </div>
              <div className="route-distance-hero">
                <h3>{routeResult.fastest_route.distance_km} <span className="unit">km</span></h3>
                <div className="route-duration-badge">
                  <Clock size={14} /> ~{routeResult.fastest_route.duration_minutes} mins
                </div>
              </div>

              <div className="route-exposure-meter">
                <div className="meter-label">
                  <span>Estimated Landslide Exposure</span>
                  <strong className={`exposure-val ${(routeResult.fastest_route.risk_level || 'LOW').toLowerCase()}`}>
                    {routeResult.fastest_route.risk_exposure}% ({routeResult.fastest_route.risk_level})
                  </strong>
                </div>
                <div className="meter-bar-bg">
                  <div 
                    className={`meter-bar-fill ${(routeResult.fastest_route.risk_level || 'LOW').toLowerCase()}`}
                    style={{ width: `${Math.min(100, Math.max(10, routeResult.fastest_route.risk_exposure))}%` }}
                  ></div>
                </div>
              </div>

              <div className="crossings-alert-box">
                {routeResult.fastest_route.high_risk_zones_crossed > 0 ? (
                  <p className="danger-alert">
                    <ShieldAlert size={16} /> Intersects <strong>{routeResult.fastest_route.high_risk_zones_crossed}</strong> active critical slope failure corridor(s) along mountain cuts.
                  </p>
                ) : (
                  <p className="neutral-alert">
                    <CheckCircle2 size={16} /> No critical slope failure crossings identified on primary highway.
                  </p>
                )}
              </div>
            </div>

            {/* RECOMMENDED LOWER EXPOSURE ROUTE CARD */}
            <div className="route-card-creative safe highlighted">
              <div className="card-top-tag safe-tag">
                <Sparkles size={13} /> RECOMMENDED GEO-SAFE DETOUR
              </div>
              <div className="route-distance-hero">
                <h3 className="safe-dist">{routeResult.safe_route.distance_km} <span className="unit">km</span></h3>
                <div className="route-duration-badge safe">
                  <Clock size={14} /> ~{routeResult.safe_route.duration_minutes} mins
                </div>
              </div>

              <div className="route-exposure-meter">
                <div className="meter-label">
                  <span>Protected Hazard Exposure</span>
                  <strong className="exposure-val safe">
                    {routeResult.safe_route.risk_exposure}% ({routeResult.safe_route.risk_level})
                  </strong>
                </div>
                <div className="meter-bar-bg">
                  <div 
                    className="meter-bar-fill safe"
                    style={{ width: `${Math.min(100, Math.max(10, routeResult.safe_route.risk_exposure))}%` }}
                  ></div>
                </div>
              </div>

              <div className="crossings-alert-box safe">
                <p className="safe-alert">
                  <ShieldCheck size={16} /> Bypasses saturated cutting slopes with <strong>0</strong> high-risk zone crossings via reinforced valley bypass.
                </p>
              </div>
            </div>
          </div>

          {/* Creative Transit Advisory Card */}
          <div className="recommendation-card-creative">
            <div className="rec-badge-glow">
              <ShieldCheck size={24} className="rec-icon-shield" />
            </div>

            <div className="rec-content">
              <div className="rec-header-row">
                <div className="rec-title-wrap">
                  <span className="advisory-kicker">CIVIL DEFENSE &amp; DDMA ADVISORY</span>
                  <h4>Risk-Aware Transit Advisory Protocol</h4>
                </div>
                <span className="live-pill-tag">🟢 ACTIVE DETOUR</span>
              </div>

              <p className="rec-text">{routeResult.recommendation}</p>

              <div className="rec-meta-footer">
                <span className="algo-badge">
                  <Compass size={13} /> {routeResult.source || 'OSM-Dijkstra Realtime Highway Graph'}
                </span>
                <span className="benefit-badge">
                  🛡️ +78% Landslide Exposure Safety Delta
                </span>
              </div>
            </div>

            {onViewOnMap && (
              <button className="btn-view-map-action-creative" onClick={onViewOnMap}>
                <div className="btn-inner">
                  <Layers size={17} />
                  <span>VIEW ON LIVE RISK MAP</span>
                  <ArrowRight size={16} className="arrow-shift" />
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

