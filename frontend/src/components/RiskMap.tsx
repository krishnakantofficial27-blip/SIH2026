import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zone, CommunityReport, MapLayerState, SafeRouteResponse, RiskLevel } from '../types';
import { 
  Layers, MapPin, Eye, Globe, Filter, AlertTriangle, ShieldCheck, 
  CloudRain, Mountain, Droplets, Compass, X, Route, Send, FileText
} from 'lucide-react';

interface RiskMapProps {
  zones: Zone[];
  reports: CommunityReport[];
  selectedZone: Zone | null;
  onSelectZone: (zone: Zone) => void;
  onOpenReportModal: () => void;
  onNavigateToRoute: () => void;
  onOpenModalZone?: (zone: Zone) => void;
  routeData?: SafeRouteResponse | null;
  userLocation?: { lat: number; lng: number } | null;
  onFetchLocation?: () => void;
  onLocationSelect?: (lat: number, lng: number) => void;
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
        map.flyTo(center, 12, { duration: 0.8 });
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

const MapClickListener = ({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
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
  onOpenReportModal,
  onOpenModalZone,
}) => {
  const [tileStyle, setTileStyle] = useState<'standard' | 'satellite' | 'terrain'>('terrain');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [regionViewTarget, setRegionViewTarget] = useState<{ center: [number, number]; zoom: number } | null>(REGION_PRESETS.ALL);
  const [layers, setLayers] = useState<MapLayerState>({
    riskZones: true,
    communityReports: true,
    historicalLandslides: true,
    safeRoute: true,
    rainfallRadar: false, // Off by default to avoid visual circle clutter
  });

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

        <div className="location-actions">
          {onFetchLocation && (
            <button className="my-location-btn" onClick={onFetchLocation}>
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
            center={selectedZone ? [selectedZone.lat, selectedZone.lng] : null} 
            route={routeData?.safe_route?.route as [number, number][] | undefined}
            regionView={!selectedZone && !routeData ? regionViewTarget : null}
          />
          <MapResizeControl selectedZone={selectedZone} />
          <MapClickListener onLocationSelect={onLocationSelect} />
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

          {/* Precipitation Overlay Radar Rings (clean smooth envelope without dashed loop confusion) */}
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
                    color: color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.95 : 0.70,
                    weight: isSelected ? 4 : 2,
                  }}
                  eventHandlers={{
                    click: () => onSelectZone(z),
                  }}
                >
                  <Popup>
                    <div className="map-popup-card">
                      <div className="popup-badge" style={{ backgroundColor: color }}>
                        {z.risk_level} ({z.risk_score}/100)
                      </div>
                      <h3>{z.name}</h3>
                      <p><strong>District:</strong> {z.district} ({z.state})</p>
                      <p><strong>Rainfall (24h):</strong> {z.rainfall_24h} mm | <strong>Slope:</strong> {z.slope_deg}°</p>
                      <p><strong>Soil Saturation:</strong> {Math.round(z.soil_moisture * 100)}%</p>
                      <p className="popup-factors"><strong>Advisory:</strong> {z.action_advice || z.recommendation}</p>
                      <button 
                        className="popup-inspect-btn" 
                        onClick={() => {
                          if (onOpenModalZone) {
                            onOpenModalZone(z);
                          } else {
                            onSelectZone(z);
                          }
                        }}
                      >
                        <Eye size={13} /> Full Assessment Dossier
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

          {/* Citizen Hazard Reports Markers */}
          {layers.communityReports &&
            filteredReports.map(r => (
              <CircleMarker
                key={`rep-${r.id}`}
                center={[r.latitude, r.longitude]}
                radius={8}
                pathOptions={{
                  color: getReportIconColor(r.status, r.severity),
                  fillColor: getReportIconColor(r.status, r.severity),
                  fillOpacity: 0.85,
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

          {/* Safe Route Polylines */}
          {layers.safeRoute && routeData && (
            <>
              <Polyline
                positions={routeData.safe_route.route}
                pathOptions={{ color: '#10b981', weight: 5, dashArray: '8, 8' }}
              />
              {routeData.fastest_route && (
                <Polyline
                  positions={routeData.fastest_route.route}
                  pathOptions={{ color: '#f97316', weight: 3, opacity: 0.6 }}
                />
              )}
            </>
          )}
        </MapContainer>

        {/* Selected Zone Side Panel */}
        {selectedZone && (
          <aside className="map-side-inspector">
            <div className="drawer-handle" />
            <div className="inspector-header">
              <div>
                <span className="zone-district-tag">{selectedZone.district} · {selectedZone.state}</span>
                <h3>{selectedZone.name}</h3>
              </div>
              <button className="inspector-close" onClick={() => onSelectZone(null as any)}>
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
              <small className="confidence-label">Confidence: {Math.round((selectedZone.confidence || 0.90) * 100)}% (Statistical Bounds)</small>
            </div>

            {/* Environmental Readings */}
            <div className="inspector-metrics-grid">
              <div className="inspector-metric">
                <CloudRain size={16} />
                <div>
                  <label>24h / 72h Rain</label>
                  <span>{selectedZone.rainfall_24h} mm / {selectedZone.rainfall_72h} mm</span>
                </div>
              </div>
              <div className="inspector-metric">
                <Mountain size={16} />
                <div>
                  <label>Slope / Elevation</label>
                  <span>{selectedZone.slope_deg}° / {selectedZone.elevation}m</span>
                </div>
              </div>
              <div className="inspector-metric">
                <Droplets size={16} />
                <div>
                  <label>Soil Saturation</label>
                  <span>{Math.round(selectedZone.soil_moisture * 100)}% TDR</span>
                </div>
              </div>
              <div className="inspector-metric">
                <ShieldCheck size={16} />
                <div>
                  <label>Past GSI Events</label>
                  <span>{selectedZone.historical_landslides} historical slides</span>
                </div>
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

            {/* Action Advice */}
            <div className="inspector-action-box">
              <AlertTriangle size={18} style={{ color: RISK_COLORS[selectedZone.risk_level] }} />
              <div>
                <strong>Recommended Action:</strong>
                <p>{selectedZone.action_advice || selectedZone.recommendation}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="inspector-actions-row">
              {onOpenModalZone && (
                <button className="btn-inspector-dossier" onClick={() => onOpenModalZone(selectedZone)}>
                  <FileText size={15} /> Full Dossier
                </button>
              )}
              <button className="btn-inspector-route" onClick={onNavigateToRoute}>
                <Route size={15} /> Safe Route
              </button>
              <button className="btn-inspector-report" onClick={onOpenReportModal}>
                <Send size={15} /> Report
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Map Legend Bar */}
      <div className="map-legend-bar">
        <span className="legend-label">Risk Index:</span>
        <div className="legend-item"><span className="legend-dot low"></span> 0–24 LOW</div>
        <div className="legend-item"><span className="legend-dot moderate"></span> 25–49 MODERATE</div>
        <div className="legend-item"><span className="legend-dot high"></span> 50–74 HIGH</div>
        <div className="legend-item"><span className="legend-dot critical"></span> 75–100 CRITICAL</div>
        <div className="legend-item"><span className="legend-dot verified"></span> Verified Ground Report</div>
        <div className="legend-item"><span className="legend-dot historical"></span> Historical Incident</div>
      </div>
    </div>
  );
};
