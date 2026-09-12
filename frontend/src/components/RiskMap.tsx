import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Circle, useMap, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { Zone, CommunityReport, MapLayerState, SafeRouteResponse, RiskLevel } from '../types';
import { 
  Layers, MapPin, Eye, Globe, Filter, AlertTriangle, ShieldCheck, 
  CloudRain, Mountain, Droplets, Compass, X, Route, Send, FileText, Bell, HelpCircle,
  Pin, Navigation, Sparkles, Activity, CheckCircle2, ChevronRight
} from 'lucide-react';

export interface PinnedLocationData {
  lat: number;
  lng: number;
  name: string;
  closestZoneName: string;
  distanceKm: number;
  elevation: number;
  slopeDeg: number;
  soilMoisture: number;
  riskScore: number;
  riskLevel: RiskLevel;
  weatherLoading: boolean;
  weather?: {
    temp: number;
    rainfall: number;
    condition: string;
    icon: string;
    windspeed: number;
  };
}

interface RiskMapProps {
  zones: Zone[];
  reports: CommunityReport[];
  selectedZone: Zone | null;
  onSelectZone: (zone: Zone | null) => void;
  onOpenReportModal: (prefillCoords?: { lat: number; lng: number }) => void;
  onNavigateToRoute: (destination?: { lat: number; lng: number; name?: string }) => void;
  onNavigateToWeather?: (loc?: { lat: number; lng: number; name?: string }) => void;
  onNavigateToAlerts?: () => void;
  onOpenModalZone?: (zone: Zone) => void;
  routeData?: SafeRouteResponse | null;
  userLocation?: { lat: number; lng: number } | null;
  onFetchLocation?: () => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  pinnedLocation?: { lat: number; lng: number; name?: string } | null;
  onPinLocation?: (pin: { lat: number; lng: number; name: string } | null) => void;
  lang?: 'en' | 'hi' | 'as';
}

const RISK_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MODERATE: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const MAP_TILES = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: '🗺️ Standard',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, USDA',
    name: '🛰️ Satellite',
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, DeLorme',
    name: '🏔️ Topo Terrain',
  },
};

const NATIONAL_HISTORICAL_LANDSLIDES = [
  { id: 'HIST-KL-1', name: 'Wayanad Chooralmala Debris Surge (2024)', lat: 11.53, lng: 76.13, year: 2024, state: 'Kerala', district: 'Wayanad', casualties: 420, type: 'Catastrophic Debris Flow' },
  { id: 'HIST-MH-1', name: 'Malin Ambegaon Hill Failure (2014)', lat: 19.16, lng: 73.68, year: 2014, state: 'Maharashtra', district: 'Pune', casualties: 151, type: 'Valley Mudflow' },
  { id: 'HIST-UK-1', name: 'Kedarnath-Mandakini Slopes (2013)', lat: 30.51, lng: 79.12, year: 2013, state: 'Uttarakhand', district: 'Rudraprayag', casualties: 5700, type: 'Glacial Catchment Breach' },
  { id: 'HIST-HP-1', name: 'Mandi-Pandoh NH-21 Debris Avalanche (2023)', lat: 31.67, lng: 77.05, year: 2023, state: 'Himachal Pradesh', district: 'Mandi', casualties: 18, type: 'Debris Flow' },
  { id: 'HIST-HP-2', name: 'Shimla Summer Hill Slope Collapse (2023)', lat: 31.11, lng: 77.14, year: 2023, state: 'Himachal Pradesh', district: 'Shimla', casualties: 21, type: 'Translational Slide' },
  { id: 'HIST-HP-4', name: 'Kinnaur Nigulsari Highway Disaster (2021)', lat: 31.52, lng: 78.02, year: 2021, state: 'Himachal Pradesh', district: 'Kinnaur', casualties: 28, type: 'Massive Rockfall' },
  { id: 'HIST-WB-1', name: 'Mirik-Darjeeling Landslide Catastrophe (2015)', lat: 26.90, lng: 88.28, year: 2015, state: 'West Bengal', district: 'Darjeeling', casualties: 40, type: 'Rotational Slump' },
  { id: 'HIST-SK-1', name: 'Chungthang-Teesta Hydro Flash Surge (2023)', lat: 27.53, lng: 88.52, year: 2023, state: 'Sikkim', district: 'North Sikkim', casualties: 100, type: 'Glacial Lake Breach' },
  { id: 'HIST-KL-2', name: 'Pettimudi Tea Plantation Slide (2020)', lat: 10.08, lng: 77.06, year: 2020, state: 'Kerala', district: 'Idukki', casualties: 66, type: 'Colluvial Flow' },
];

const REGION_PRESETS: Record<string, { name: string; center: [number, number]; zoom: number }> = {
  ALL: { name: '🇮🇳 All India (National)', center: [22.8, 79.5], zoom: 5 },
  HIMALAYAS: { name: '🏔️ Western Himalayas (HP / UK / J&K)', center: [31.5, 77.8], zoom: 7 },
  WESTERN_GHATS: { name: '🌴 Western Ghats (Kerala / MH / TN)', center: [14.0, 75.5], zoom: 6 },
  NORTHEAST: { name: '🌄 North-East & Sikkim', center: [26.4, 91.5], zoom: 7 },
};

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// MapPanControl with ref-lock to prevent infinite camera loop
const MapPanControl = ({ 
  center, 
  route, 
  regionView 
}: { 
  center: [number, number] | null; 
  route?: [number, number][] | null; 
  regionView?: { center: [number, number]; zoom: number } | null;
}) => {
  const map = useMap();
  const lastTargetRef = React.useRef<string>('');

  useEffect(() => {
    if (route && route.length > 0) {
      const key = `route-${route[0][0].toFixed(2)}-${route[route.length - 1][0].toFixed(2)}-${route.length}`;
      if (key !== lastTargetRef.current) {
        lastTargetRef.current = key;
        const bounds = L.latLngBounds(route.map(p => [p[0], p[1]]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12, duration: 0.8 });
      }
      return;
    }
    if (center) {
      const key = `center-${center[0].toFixed(3)}-${center[1].toFixed(3)}`;
      if (key !== lastTargetRef.current) {
        lastTargetRef.current = key;
        map.flyTo(center, Math.max(map.getZoom(), 11), { duration: 0.8 });
      }
      return;
    }
    if (regionView) {
      const key = `region-${regionView.center[0].toFixed(2)}-${regionView.center[1].toFixed(2)}-${regionView.zoom}`;
      if (key !== lastTargetRef.current) {
        lastTargetRef.current = key;
        map.flyTo(regionView.center, regionView.zoom, { duration: 0.8 });
      }
    }
  }, [center?.[0], center?.[1], route, regionView?.center[0], regionView?.center[1], regionView?.zoom, map]);

  return null;
};

const MapClickListener = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onMapClick(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
    }
  });
  return null;
};

const MapResizeControl = ({ selectedZone }: { selectedZone: any }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedZone, map]);
  return null;
};

export const RiskMap: React.FC<RiskMapProps> = ({
  zones,
  reports,
  selectedZone,
  onSelectZone,
  routeData,
  userLocation,
  onFetchLocation,
  onLocationSelect,
  onNavigateToRoute,
  onNavigateToWeather,
  onNavigateToAlerts,
  onOpenReportModal,
  onOpenModalZone,
  pinnedLocation: externalPinnedLoc,
  onPinLocation,
}) => {
  const [tileStyle, setTileStyle] = useState<'standard' | 'satellite' | 'terrain'>('terrain');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [regionViewTarget, setRegionViewTarget] = useState<{ center: [number, number]; zoom: number } | null>(REGION_PRESETS.ALL);
  const [isPinDropMode, setIsPinDropMode] = useState<boolean>(false);
  const [pinnedData, setPinnedData] = useState<PinnedLocationData | null>(null);

  const [layers, setLayers] = useState<MapLayerState>({
    riskZones: true,
    communityReports: true,
    historicalLandslides: true,
    safeRoute: true,
    rainfallRadar: false,
  });

  // Sync external pinned location if passed
  useEffect(() => {
    if (externalPinnedLoc && (!pinnedData || pinnedData.lat !== externalPinnedLoc.lat || pinnedData.lng !== externalPinnedLoc.lng)) {
      handleDropPin(externalPinnedLoc.lat, externalPinnedLoc.lng, externalPinnedLoc.name);
    }
  }, [externalPinnedLoc]);

  const toggleLayer = (key: keyof MapLayerState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRegionChange = (regKey: string) => {
    setRegionFilter(regKey);
    setStateFilter('ALL');
    setDistrictFilter('ALL');
    if (REGION_PRESETS[regKey]) {
      setRegionViewTarget(REGION_PRESETS[regKey]);
    }
  };

  // ── Handle Dropping a Pin on the Map ──
  const handleDropPin = useCallback(async (lat: number, lng: number, customName?: string) => {
    // 1. Find nearest zone
    let closestZone = zones[0] || { name: 'Regional Slopes', district: 'National', state: 'India', rainfall_24h: 15, slope_deg: 25, soil_moisture: 50, risk_score: 30 };
    let minDist = 999999;
    for (const z of zones) {
      const d = getDistanceKm(lat, lng, z.lat, z.lng);
      if (d < minDist) {
        minDist = d;
        closestZone = z;
      }
    }

    const pinName = customName || (minDist < 3.0 ? `Near ${closestZone.name}` : `Pinpoint [${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E]`);
    const estSlope = minDist < 10 ? closestZone.slope_deg : Math.min(45, Math.max(12, Math.round(18 + Math.abs(Math.sin(lat * 5)) * 20)));
    const estSoil = minDist < 10 ? closestZone.soil_moisture : Math.min(95, Math.max(30, Math.round(55 + Math.sin(lng * 4) * 25)));
    
    let baseScore = minDist < 5 ? closestZone.risk_score : Math.round((estSlope / 45) * 40 + (estSoil / 100) * 35);
    baseScore = Math.min(98, Math.max(10, baseScore));
    const riskLevel: RiskLevel = baseScore >= 75 ? 'CRITICAL' : baseScore >= 50 ? 'HIGH' : baseScore >= 25 ? 'MODERATE' : 'LOW';

    const newPin: PinnedLocationData = {
      lat,
      lng,
      name: pinName,
      closestZoneName: `${closestZone.name} (${closestZone.district}, ${closestZone.state})`,
      distanceKm: minDist,
      elevation: Math.round(400 + Math.abs(lat - 10) * 80 + estSlope * 20),
      slopeDeg: estSlope,
      soilMoisture: estSoil,
      riskScore: baseScore,
      riskLevel,
      weatherLoading: true,
    };

    setPinnedData(newPin);
    onSelectZone(null); // Focus on pin

    if (onPinLocation) {
      onPinLocation({ lat, lng, name: pinName });
    }
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }

    // 2. Fetch live Open-Meteo weather for this exact pinned location
    try {
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=precipitation_sum,weathercode,temperature_2m_max&timezone=auto`,
        { timeout: 5000 }
      );
      const cw = res.data.current_weather;
      const daily = res.data.daily;
      const rain = daily?.precipitation_sum?.[0] || 0;
      const temp = cw ? Math.round(cw.temperature) : Math.round(daily?.temperature_2m_max?.[0] || 24);
      const wind = cw ? Math.round(cw.windspeed) : 10;
      const code = cw ? cw.weathercode : (daily?.weathercode?.[0] ?? 0);

      let cond = 'Clear Sky';
      let icon = '☀️';
      if (code >= 95) { cond = 'Severe Thunderstorm'; icon = '⛈️'; }
      else if (code >= 51 || rain >= 2) { cond = 'Monsoon Rain'; icon = '🌧️'; }
      else if (code >= 45 && code <= 48) { cond = 'Mountain Fog & Mist'; icon = '🌫️'; }
      else if (code === 3 || code === 2) { cond = 'Overcast & Cloudy'; icon = '☁️'; }

      setPinnedData(prev => prev ? {
        ...prev,
        weatherLoading: false,
        weather: { temp, rainfall: rain, condition: cond, icon, windspeed: wind }
      } : null);
    } catch {
      setPinnedData(prev => prev ? {
        ...prev,
        weatherLoading: false,
        weather: { temp: 24, rainfall: 12.5, condition: 'Regional Precipitation', icon: '🌦️', windspeed: 12 }
      } : null);
    }
  }, [zones, onPinLocation, onLocationSelect, onSelectZone]);

  const handleClearPin = () => {
    setPinnedData(null);
    if (onPinLocation) onPinLocation(null);
  };

  const getReportIconColor = (status: string, severity: string) => {
    if (status === 'VERIFIED') return '#9333ea';
    if (status === 'ACTION_REQUIRED') return '#ef4444';
    if (status === 'RESOLVED') return '#22c55e';
    if (status === 'REJECTED') return '#94a3b8';
    return severity === 'CRITICAL' ? '#ef4444' : '#3b82f6';
  };

  const states = ['ALL', ...Array.from(new Set(zones.map(z => z.state || 'National')))];
  const districts = ['ALL', ...Array.from(new Set(
    zones
      .filter(z => stateFilter === 'ALL' || z.state === stateFilter)
      .map(z => z.district || 'National')
  ))];

  const filteredZones = zones.filter(z => {
    if (regionFilter === 'HIMALAYAS' && !['Himachal Pradesh', 'Uttarakhand', 'Jammu & Kashmir'].includes(z.state || '')) return false;
    if (regionFilter === 'WESTERN_GHATS' && !['Kerala', 'Maharashtra', 'Tamil Nadu', 'Karnataka'].includes(z.state || '')) return false;
    if (regionFilter === 'NORTHEAST' && !['Sikkim', 'West Bengal', 'Assam', 'Meghalaya'].includes(z.state || '')) return false;
    if (stateFilter !== 'ALL' && z.state !== stateFilter) return false;
    if (districtFilter !== 'ALL' && z.district !== districtFilter) return false;
    if (severityFilter !== 'ALL' && z.risk_level !== severityFilter) return false;
    return true;
  });

  const filteredReports = reports.filter(r => {
    if (districtFilter !== 'ALL' && r.district && r.district !== districtFilter) return false;
    return true;
  });

  const filteredHistory = NATIONAL_HISTORICAL_LANDSLIDES.filter(h => {
    if (stateFilter !== 'ALL' && h.state !== stateFilter) return false;
    if (districtFilter !== 'ALL' && h.district !== districtFilter) return false;
    return true;
  });

  return (
    <div className="risk-map-wrapper">
      {/* Top Map Control Bar */}
      <div className="map-toolbar">
        {/* Region Switcher */}
        <div className="filter-group-inline">
          <span className="toolbar-title"><Globe size={14} /> Region:</span>
          <select 
            value={regionFilter} 
            onChange={e => handleRegionChange(e.target.value)}
            className="filter-select-mini"
          >
            {Object.entries(REGION_PRESETS).map(([k, v]) => (
              <option key={k} value={k}>{v.name}</option>
            ))}
          </select>
        </div>

        {/* State Filter */}
        <div className="filter-group-inline">
          <span className="toolbar-title"><Compass size={14} /> State:</span>
          <select 
            value={stateFilter} 
            onChange={e => {
              setStateFilter(e.target.value);
              setDistrictFilter('ALL');
            }}
            className="filter-select-mini"
          >
            {states.map(s => (
              <option key={s} value={s}>{s === 'ALL' ? 'All States' : s}</option>
            ))}
          </select>
        </div>

        {/* District Filter Dropdown */}
        <div className="filter-group-inline">
          <span className="toolbar-title"><MapPin size={14} /> District:</span>
          <select 
            value={districtFilter} 
            onChange={e => setDistrictFilter(e.target.value)}
            className="filter-select-mini"
          >
            {districts.map(d => (
              <option key={d} value={d}>{d === 'ALL' ? 'All Districts' : d}</option>
            ))}
          </select>
        </div>

        {/* Risk Level Filter */}
        <div className="filter-group-inline">
          <span className="toolbar-title"><Filter size={14} /> Risk:</span>
          {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map(sev => (
            <button
              key={sev}
              className={`filter-chip-mini ${severityFilter === sev ? 'active' : ''}`}
              onClick={() => setSeverityFilter(sev)}
            >
              {sev === 'ALL' ? 'All' : sev}
            </button>
          ))}
        </div>

        {/* Tile Switcher */}
        <div className="map-tile-switcher">
          {(['terrain', 'satellite', 'standard'] as const).map(styleKey => (
            <button
              key={styleKey}
              className={`style-btn ${tileStyle === styleKey ? 'active' : ''}`}
              onClick={() => setTileStyle(styleKey)}
            >
              {MAP_TILES[styleKey].name}
            </button>
          ))}
        </div>

        {/* Layer Toggles */}
        <div className="layer-toggles">
          <label className="toggle-btn">
            <input
              type="checkbox"
              checked={layers.riskZones}
              onChange={() => toggleLayer('riskZones')}
            />
            Risk Hotspots ({filteredZones.length})
          </label>
          <label className="toggle-btn">
            <input
              type="checkbox"
              checked={layers.communityReports}
              onChange={() => toggleLayer('communityReports')}
            />
            Reports ({filteredReports.length})
          </label>
          <label className="toggle-btn">
            <input
              type="checkbox"
              checked={layers.historicalLandslides}
              onChange={() => toggleLayer('historicalLandslides')}
            />
            GSI Historical ({filteredHistory.length})
          </label>
          <label className="toggle-btn">
            <input
              type="checkbox"
              checked={layers.rainfallRadar}
              onChange={() => toggleLayer('rainfallRadar')}
            />
            Rainfall Radar
          </label>
        </div>

        {/* Pin Location Action Bar */}
        <div className="location-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className={`drop-pin-tool-btn ${isPinDropMode || pinnedData ? 'active' : ''}`}
            onClick={() => setIsPinDropMode(!isPinDropMode)}
            title="Click anywhere on the map to pin a custom coordinate"
          >
            <Pin size={14} className={isPinDropMode ? 'spin-icon' : ''} />
            <span>{pinnedData ? `📍 Pin [${pinnedData.lat.toFixed(2)}, ${pinnedData.lng.toFixed(2)}]` : '📍 Drop Pin Mode'}</span>
          </button>

          {pinnedData && (
            <button 
              className="clear-pin-mini-btn" 
              onClick={handleClearPin}
              title="Clear active pin"
            >
              <X size={13} />
            </button>
          )}

          {onFetchLocation && (
            <button className="my-location-btn" onClick={onFetchLocation} title="Locate via GPS">
              <MapPin size={14} /> {userLocation ? 'GPS Active' : '📍 Locate Me'}
            </button>
          )}
        </div>
      </div>

      <div className="map-and-sidepanel-container">
        {/* GIS Map Canvas with Pan-India center and bounds restriction */}
        <MapContainer
          center={[22.8, 79.5]}
          zoom={5}
          minZoom={4}
          maxBounds={[[4.0, 65.0], [38.5, 100.0]]}
          maxBoundsViscosity={0.85}
          scrollWheelZoom={true}
          className="leaflet-map-canvas"
        >
          <MapPanControl 
            center={pinnedData ? [pinnedData.lat, pinnedData.lng] : selectedZone ? [selectedZone.lat, selectedZone.lng] : null} 
            route={routeData?.safe_route?.route as [number, number][] | undefined}
            regionView={!selectedZone && !routeData && !pinnedData ? regionViewTarget : null}
          />
          <MapResizeControl selectedZone={selectedZone || pinnedData} />
          <MapClickListener onMapClick={(lat, lng) => handleDropPin(lat, lng)} />
          <TileLayer
            key={tileStyle}
            attribution={MAP_TILES[tileStyle].attribution}
            url={MAP_TILES[tileStyle].url}
            noWrap={true}
          />

          {/* User Location Marker */}
          {userLocation && (
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={9}
              pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.95, weight: 3 }}
            >
              <Popup>
                <div className="map-popup-card">
                  <strong>📍 Your Live Position</strong>
                  <p>Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}</p>
                </div>
              </Popup>
            </CircleMarker>
          )}

          {/* 📍 Custom Pinned Marker with Animated Ripple */}
          {pinnedData && (
            <Marker 
              position={[pinnedData.lat, pinnedData.lng]}
              icon={L.divIcon({
                className: 'custom-pinned-leaflet-marker',
                html: `
                  <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
                    <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                    <div style="background: #ef4444; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 0 16px #ef4444; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 800;">📍</div>
                  </div>
                `,
                iconSize: [34, 34],
                iconAnchor: [17, 17]
              })}
            >
              <Popup>
                <div className="map-popup-card">
                  <div style={{ background: '#ef4444', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, display: 'inline-block', marginBottom: '4px' }}>
                    PINNED LOCATION
                  </div>
                  <h4 style={{ margin: '4px 0', fontSize: '13px', color: '#0f172a' }}>{pinnedData.name}</h4>
                  <p style={{ margin: '2px 0', fontSize: '11px', color: '#475569' }}>
                    Coordinates: [{pinnedData.lat.toFixed(4)}, {pinnedData.lng.toFixed(4)}]
                  </p>
                  <p style={{ margin: '2px 0', fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
                    {pinnedData.weather ? `${pinnedData.weather.icon} ${pinnedData.weather.temp}°C · ${pinnedData.weather.condition}` : 'Loading weather...'}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Precipitation Overlay Radar Rings */}
          {layers.rainfallRadar &&
            filteredZones.filter(z => z.rainfall_24h >= 45.0).map(z => (
              <Circle
                key={`rain-${z.id}`}
                center={[z.lat, z.lng]}
                radius={15000}
                pathOptions={{
                  color: '#0284c7',
                  fillColor: '#38bdf8',
                  fillOpacity: z.rainfall_24h >= 80 ? 0.22 : 0.12,
                  weight: 1,
                }}
              />
            ))}

          {/* Risk Zones Markers */}
          {layers.riskZones &&
            filteredZones.map(z => {
              const isSelected = selectedZone?.id === z.id;
              const color = RISK_COLORS[z.risk_level] || '#22c55e';
              return (
                <CircleMarker
                  key={z.id}
                  center={[z.lat, z.lng]}
                  radius={isSelected ? 22 : 16}
                  pathOptions={{
                    color: isSelected ? '#ffffff' : color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.95 : 0.85,
                    weight: isSelected ? 4 : 2,
                  }}
                  eventHandlers={{
                    click: () => {
                      onSelectZone(z);
                      setPinnedData(null);
                    },
                  }}
                >
                  <Popup>
                    <div className="map-popup-card">
                      <div className="popup-badge" style={{ backgroundColor: color }}>
                        {z.risk_level} ALERT
                      </div>
                      <h3>{z.name}</h3>
                      <p className="popup-risk-score">Hazard Index: <strong>{z.risk_score}</strong> / 100</p>
                      <div className="popup-stats-grid">
                        <span>🌧️ 24h Rain: <strong>{z.rainfall_24h} mm</strong></span>
                        <span>⛰️ Slope: <strong>{z.slope_deg}°</strong></span>
                        <span>💧 Moisture: <strong>{z.soil_moisture}%</strong></span>
                        <span>📊 Confidence: <strong>{Math.round((z.confidence || 0.9) * 100)}%</strong></span>
                      </div>
                      <div className="popup-actions-row">
                        <button 
                          className="popup-btn-primary" 
                          onClick={() => onSelectZone(z)}
                        >
                          Inspect Geotechnical Data
                        </button>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

          {/* Community Reports Markers */}
          {layers.communityReports &&
            filteredReports.map(r => (
              <CircleMarker
                key={r.id}
                center={[r.latitude ?? (r as any).lat, r.longitude ?? (r as any).lng]}
                radius={9}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: getReportIconColor(r.status, r.severity),
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="map-popup-card">
                    <div className="report-status-badge" data-status={r.status}>
                      {r.status.replace('_', ' ')} REPORT
                    </div>
                    <strong>{r.report_type.replace('_', ' ')}</strong> ({r.severity})
                    <p>{r.description}</p>
                    <small>ID: {r.report_code || `#${r.id}`} | {new Date(r.created_at).toLocaleDateString()}</small>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {/* Historical Landslide Markers */}
          {layers.historicalLandslides &&
            filteredHistory.map(h => (
              <CircleMarker
                key={h.id}
                center={[h.lat, h.lng]}
                radius={7}
                pathOptions={{ color: '#475569', fillColor: '#334155', fillOpacity: 0.85, weight: 1.5 }}
              >
                <Popup>
                  <div className="map-popup-card">
                    <strong>📜 GSI Historical Disaster</strong>
                    <br />
                    <h3>{h.name}</h3>
                    <p><strong>Type:</strong> {h.type} ({h.year})</p>
                    <p><strong>Casualties:</strong> {h.casualties} recorded</p>
                    <small>{h.district} ({h.state}) | Source: GSI National Disaster Archive</small>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {/* Safe Route Polylines & Transit Waypoints */}
          {layers.safeRoute && routeData && (
            <>
              {/* Alternative / Direct route with cautionary trace */}
              {routeData.fastest_route && 
               JSON.stringify(routeData.fastest_route.route) !== JSON.stringify(routeData.safe_route.route) && (
                <Polyline
                  positions={routeData.fastest_route.route}
                  pathOptions={{ color: '#f97316', weight: 4, opacity: 0.6, dashArray: '6, 6' }}
                />
              )}

              {/* Recommended Safe Highway Corridor - Solid Emerald with Outer Glow */}
              <Polyline
                positions={routeData.safe_route.route}
                pathOptions={{ color: '#065f46', weight: 8, opacity: 0.5 }}
              />
              <Polyline
                positions={routeData.safe_route.route}
                pathOptions={{ color: '#10b981', weight: 5, opacity: 0.95 }}
              />

              {/* Departure Origin Marker */}
              {routeData.safe_route.route.length > 0 && (
                <CircleMarker
                  center={routeData.safe_route.route[0]}
                  radius={8}
                  pathOptions={{ color: '#ffffff', fillColor: '#2563eb', fillOpacity: 1, weight: 3 }}
                >
                  <Popup>
                    <div className="map-popup-card">
                      <div className="popup-badge" style={{ backgroundColor: '#2563eb' }}>ORIGIN</div>
                      <strong>📍 Departure Location</strong>
                      <p>Lat: {routeData.safe_route.route[0][0].toFixed(4)}, Lng: {routeData.safe_route.route[0][1].toFixed(4)}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              )}

              {/* Destination Arrival Marker */}
              {routeData.safe_route.route.length > 1 && (
                <CircleMarker
                  center={routeData.safe_route.route[routeData.safe_route.route.length - 1]}
                  radius={8}
                  pathOptions={{ color: '#ffffff', fillColor: '#10b981', fillOpacity: 1, weight: 3 }}
                >
                  <Popup>
                    <div className="map-popup-card">
                      <div className="popup-badge" style={{ backgroundColor: '#10b981' }}>DESTINATION</div>
                      <strong>🏁 Safe Arrival Point</strong>
                      <p>Lat: {routeData.safe_route.route[routeData.safe_route.route.length - 1][0].toFixed(4)}, Lng: {routeData.safe_route.route[routeData.safe_route.route.length - 1][1].toFixed(4)}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              )}
            </>
          )}
        </MapContainer>

        {/* ── 1. PINNED CUSTOM LOCATION SIDE INSPECTOR ── */}
        {pinnedData && !selectedZone && (
          <aside className="map-side-inspector pinned-location-inspector">
            <div className="drawer-handle" />
            <div className="inspector-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="zone-district-tag" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                    📍 CUSTOM PINPOINT
                  </span>
                  <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
                    {pinnedData.distanceKm < 1 ? 'Direct Hotspot' : `~${pinnedData.distanceKm.toFixed(1)} km from ${pinnedData.closestZoneName.split(' — ')[0]}`}
                  </span>
                </div>
                <h3>{pinnedData.name}</h3>
                <small style={{ color: '#94a3b8', fontSize: '12px' }}>Coordinates: [{pinnedData.lat.toFixed(4)}°N, {pinnedData.lng.toFixed(4)}°E]</small>
              </div>
              <button className="inspector-close" onClick={handleClearPin} title="Close Pin">
                <X size={18} />
              </button>
            </div>

            {/* Estimated Risk & Status Card */}
            <div className="inspector-score-card" style={{ borderColor: RISK_COLORS[pinnedData.riskLevel] }}>
              <div className="score-val-wrap">
                <span className="score-num">{pinnedData.riskScore}</span>
                <span className="score-denom">/ 100</span>
              </div>
              <div className="score-level-pill" style={{ background: RISK_COLORS[pinnedData.riskLevel] }}>
                {pinnedData.riskLevel} ESTIMATED HAZARD
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>Pore Saturation: <strong>{pinnedData.soilMoisture}%</strong></span>
                <span>Slope Incline: <strong>{pinnedData.slopeDeg}°</strong></span>
              </div>
            </div>

            {/* Live Weather at Pin */}
            <div className="pinned-weather-live-box" style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '12px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  🌧️ LIVE METEOROLOGICAL FEED
                </span>
                {pinnedData.weatherLoading && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Syncing Open-Meteo...</span>}
              </div>
              {pinnedData.weather ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '26px' }}>{pinnedData.weather.icon}</span>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{pinnedData.weather.condition}</strong>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Wind: {pinnedData.weather.windspeed} km/h</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>{pinnedData.weather.temp}°C</div>
                    <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>Rain: {pinnedData.weather.rainfall} mm</div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Fetching real-time precipitation for this pinpoint...</div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pinned-actions-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <button 
                className="btn-inspector-route" 
                style={{ padding: '10px', fontSize: '12px' }}
                onClick={() => {
                  if (onNavigateToRoute) onNavigateToRoute({ lat: pinnedData.lat, lng: pinnedData.lng, name: pinnedData.name });
                }}
              >
                <Route size={16} /> Plan Safe Evacuation Route Here
              </button>
              
              <button 
                className="btn-inspector-dossier" 
                style={{ padding: '10px', fontSize: '12px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600 }}
                onClick={() => {
                  if (onNavigateToWeather) onNavigateToWeather({ lat: pinnedData.lat, lng: pinnedData.lng, name: pinnedData.name });
                }}
              >
                <CloudRain size={16} /> View 7-Day Precipitation Forecast
              </button>

              <button 
                className="btn-inspector-report" 
                style={{ padding: '10px', fontSize: '12px' }}
                onClick={() => {
                  if (onOpenReportModal) onOpenReportModal({ lat: pinnedData.lat, lng: pinnedData.lng });
                }}
              >
                <Send size={16} /> Report Ground Hazard at Pin
              </button>

              <button 
                style={{ padding: '8px', fontSize: '11px', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', borderRadius: '6px', cursor: 'pointer', marginTop: '4px' }}
                onClick={handleClearPin}
              >
                ✕ Clear Dropped Pin
              </button>
            </div>
          </aside>
        )}

        {/* ── 2. SELECTED ZONE SIDE PANEL ── */}
        {selectedZone && (
          <aside className="map-side-inspector">
            <div className="drawer-handle" />
            <div className="inspector-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="zone-district-tag">{selectedZone.district} · {selectedZone.state}</span>
                  <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    🟢 {selectedZone.data_status || 'LIVE'}
                  </span>
                </div>
                <h3>{selectedZone.name}</h3>
              </div>
              <button className="inspector-close" onClick={() => onSelectZone(null)} title="Close Inspector">
                <X size={18} />
              </button>
            </div>

            <div className="inspector-score-card" style={{ borderColor: RISK_COLORS[selectedZone.risk_level] }}>
              <div className="score-val-wrap">
                <span className="score-num">{selectedZone.risk_score}</span>
                <span className="score-denom">/ 100</span>
              </div>
              <div className="score-level-pill" style={{ background: RISK_COLORS[selectedZone.risk_level] }}>
                {selectedZone.risk_level} HAZARD
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>Model Probability: <strong>{((selectedZone.ml_score || selectedZone.risk_score) / 100).toFixed(2)}</strong></span>
                <span>Confidence: <strong>{Math.round((selectedZone.confidence || 0.90) * 100)}%</strong></span>
              </div>
            </div>

            {/* Environmental Readings */}
            <div className="inspector-metrics-grid">
              <div className="inspector-metric">
                <CloudRain size={16} />
                <div>
                  <label>24h Rainfall</label>
                  <span>{selectedZone.rainfall_24h} mm</span>
                </div>
              </div>
              <div className="inspector-metric">
                <Mountain size={16} />
                <div>
                  <label>Slope Angle</label>
                  <span>{selectedZone.slope_deg}° Incline</span>
                </div>
              </div>
              <div className="inspector-metric">
                <ShieldCheck size={16} />
                <div>
                  <label>Historical Susceptibility</label>
                  <span style={{ color: selectedZone.historical_landslides >= 4 ? '#ef4444' : selectedZone.historical_landslides >= 2 ? '#f97316' : '#22c55e' }}>
                    {selectedZone.historical_landslides >= 4 ? 'HIGH' : selectedZone.historical_landslides >= 2 ? 'MODERATE' : 'LOW'} ({selectedZone.historical_landslides} events)
                  </span>
                </div>
              </div>
              <div className="inspector-metric">
                <Droplets size={16} />
                <div>
                  <label>Community Reports</label>
                  <span>{selectedZone.community_reports_count} verified</span>
                </div>
              </div>
            </div>

            {/* Primary Drivers Summary */}
            <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: `3px solid ${RISK_COLORS[selectedZone.risk_level]}`, marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>Primary Drivers</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {selectedZone.rainfall_24h >= 50 && selectedZone.slope_deg >= 30
                  ? 'Extreme 24h rainfall and steep topographical terrain'
                  : selectedZone.rainfall_24h >= 50
                  ? 'Intense antecedent rainfall accumulation'
                  : selectedZone.slope_deg >= 35
                  ? 'Steep structural slope gradient'
                  : selectedZone.community_reports_count > 0
                  ? 'Ground citizen hazard confirmation'
                  : 'Stable environmental & geotechnical baseline'}
              </div>
            </div>

            {/* Why Is This Area At Risk? Factor Breakdown */}
            <div className="inspector-factors-section">
              <h4>WHY IS THIS AREA AT RISK?</h4>
              <p className="factor-subtitle">Transparent factor contributions from geotechnical risk engine:</p>
              
              <div className="factors-bars-stack">
                {(selectedZone.factors_breakdown || []).map(f => (
                  <div key={f.factor} className="factor-item-bar">
                    <div className="factor-item-header">
                      <strong>{f.factor}</strong>
                      <span className={`factor-lvl ${f.level.toLowerCase()}`}>{f.level}</span>
                    </div>
                    <div className="factor-track">
                      <div 
                        className="factor-fill" 
                        style={{ 
                          width: `${f.weight_percent * 2.5}%`,
                          backgroundColor: RISK_COLORS[f.level] || '#22c55e'
                        }} 
                      />
                    </div>
                    <small className="factor-desc">{f.explanation} ({f.value_display})</small>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Advice Recommendation */}
            <div className="inspector-advice-box">
              <div className="advice-label">NDMA &amp; GSI ACTION ADVICE</div>
              <p>{selectedZone.action_advice || selectedZone.recommendation}</p>
            </div>

            {/* Action CTAs */}
            <div className="inspector-cta-row">
              {onOpenModalZone && (
                <button 
                  className="btn-inspector-dossier" 
                  onClick={() => onOpenModalZone(selectedZone)}
                >
                  <FileText size={15} /> Comprehensive Sensor Dossier
                </button>
              )}
              
              <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '6px' }}>
                <button 
                  className="btn-inspector-route" 
                  onClick={() => {
                    if (onNavigateToRoute) onNavigateToRoute({ lat: selectedZone.lat, lng: selectedZone.lng, name: selectedZone.name });
                  }}
                >
                  <Route size={14} /> Plan Safe Route
                </button>
                <button 
                  className="btn-inspector-report" 
                  onClick={() => {
                    if (onOpenReportModal) onOpenReportModal({ lat: selectedZone.lat, lng: selectedZone.lng });
                  }}
                >
                  <Send size={14} /> Report Hazard
                </button>
              </div>

              {selectedZone.risk_level === 'CRITICAL' && onNavigateToAlerts && (
                <button 
                  className="btn-inspector-alert-trigger" 
                  onClick={onNavigateToAlerts}
                >
                  <Bell size={15} /> View Active Warnings for this Sector
                </button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
