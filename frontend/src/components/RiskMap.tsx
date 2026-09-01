import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Zone, CommunityReport, MapLayerState, SafeRouteResponse } from '../types';
import { Layers, MapPin, Eye, Globe } from 'lucide-react';

interface RiskMapProps {
  zones: Zone[];
  reports: CommunityReport[];
  selectedZone: Zone | null;
  onSelectZone: (zone: Zone) => void;
  onOpenReportModal: () => void;
  onNavigateToRoute: () => void;
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
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
    name: '🛰️ Satellite',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
    name: '🏔️ Terrain',
  },
};

const HISTORICAL_LANDSLIDES = [
  { id: 'HIST-1', name: 'Mawkdok Bridge Slide (2020)', lat: 25.35, lng: 91.75, year: 2020 },
  { id: 'HIST-2', name: 'Noney Railway Disaster (2022)', lat: 24.81, lng: 93.63, year: 2022 },
  { id: 'HIST-3', name: 'Lunglei Cliff Failure (2021)', lat: 22.88, lng: 92.73, year: 2021 },
  { id: 'HIST-4', name: 'Pakyong Airport Highway Slide (2023)', lat: 27.23, lng: 88.58, year: 2023 },
];

const MapPanControl = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 1.5 });
    }
  }, [center, map]);
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

export const RiskMap: React.FC<RiskMapProps> = ({
  zones,
  reports,
  selectedZone,
  onSelectZone,
  routeData,
  userLocation,
  onFetchLocation,
  onLocationSelect,
}) => {
  const [tileStyle, setTileStyle] = useState<'standard' | 'satellite' | 'terrain'>('standard');
  const [layers, setLayers] = useState<MapLayerState>({
    riskZones: true,
    communityReports: true,
    historicalLandslides: true,
    safeRoute: true,
  });

  const toggleLayer = (key: keyof MapLayerState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getReportIconColor = (status: string, severity: string) => {
    if (status === 'VERIFIED') return '#9333ea';
    if (status === 'REJECTED') return '#94a3b8';
    return severity === 'CRITICAL' ? '#ef4444' : '#3b82f6';
  };

  return (
    <div className="risk-map-wrapper">
      <div className="map-toolbar">
        {/* Map Base Tile Switcher (Satellite vs Standard vs Terrain) */}
        <div className="map-tile-switcher">
          <span className="toolbar-title"><Globe size={15} /> Map View:</span>
          {(['standard', 'satellite', 'terrain'] as const).map(styleKey => (
            <button
              key={styleKey}
              className={`style-btn ${tileStyle === styleKey ? 'active' : ''}`}
              onClick={() => setTileStyle(styleKey)}
            >
              {MAP_TILES[styleKey].name}
            </button>
          ))}
        </div>

        <div className="layer-toggles">
          <span className="toolbar-title"><Layers size={15} /> Layers:</span>
          <label className="toggle-btn">
            <input
              type="checkbox"
              checked={layers.riskZones}
              onChange={() => toggleLayer('riskZones')}
            />
            Risk Zones
          </label>
          <label className="toggle-btn">
            <input
              type="checkbox"
              checked={layers.communityReports}
              onChange={() => toggleLayer('communityReports')}
            />
            Reports ({reports.length})
          </label>
          <label className="toggle-btn">
            <input
              type="checkbox"
              checked={layers.historicalLandslides}
              onChange={() => toggleLayer('historicalLandslides')}
            />
            Incidents
          </label>
          <label className="toggle-btn">
            <input
              type="checkbox"
              checked={layers.safeRoute}
              onChange={() => toggleLayer('safeRoute')}
            />
            Safe Route
          </label>
        </div>

        {onFetchLocation && (
          <button className="my-location-btn" onClick={onFetchLocation}>
            <MapPin size={15} /> {userLocation ? 'Location Active' : '📍 Use My Location'}
          </button>
        )}
      </div>

      <MapContainer
        center={[25.6, 92.7]}
        zoom={7}
        scrollWheelZoom={true}
        className="leaflet-map-canvas"
      >
        <MapPanControl center={userLocation ? [userLocation.lat, userLocation.lng] : null} />
        <MapClickListener onLocationSelect={onLocationSelect} />
        <TileLayer
          key={tileStyle}
          attribution={MAP_TILES[tileStyle].attribution}
          url={MAP_TILES[tileStyle].url}
        />

        {/* User Geolocation Marker */}
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={10}
            pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 3 }}
          >
            <Popup>
              <strong>Your Location</strong>
              <br />
              Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}
            </Popup>
          </CircleMarker>
        )}

        {/* Feature 1: Risk Zones */}
        {layers.riskZones &&
          zones.map(z => (
            <CircleMarker
              key={z.id}
              center={[z.lat, z.lng]}
              radius={18}
              pathOptions={{
                color: RISK_COLORS[z.risk_level] || '#22c55e',
                fillColor: RISK_COLORS[z.risk_level] || '#22c55e',
                fillOpacity: selectedZone?.id === z.id ? 0.9 : 0.65,
                weight: selectedZone?.id === z.id ? 4 : 2,
              }}
              eventHandlers={{
                click: () => onSelectZone(z),
              }}
            >
              <Popup>
                <div className="map-popup-card">
                  <div className="popup-badge" style={{ backgroundColor: RISK_COLORS[z.risk_level] }}>
                    {z.risk_level} ({z.risk_score}/100)
                  </div>
                  <h3>{z.name}</h3>
                  <p><strong>24h Rainfall:</strong> {z.rainfall_24h} mm</p>
                  <p><strong>Slope:</strong> {z.slope_deg}° | <strong>Moisture:</strong> {Math.round(z.soil_moisture * 100)}%</p>
                  <p className="popup-factors"><strong>Factors:</strong> {z.recommendation}</p>
                  <button className="popup-inspect-btn" onClick={() => onSelectZone(z)}>
                    <Eye size={13} /> View Full Zone Details
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* Feature 6: Community Reports on Map */}
        {layers.communityReports &&
          reports.map(r => (
            <CircleMarker
              key={r.id}
              center={[r.latitude, r.longitude]}
              radius={9}
              pathOptions={{
                color: getReportIconColor(r.status, r.severity),
                fillColor: getReportIconColor(r.status, r.severity),
                fillOpacity: 0.8,
              }}
            >
              <Popup>
                <div className="map-popup-card">
                  <div className="report-status-badge" data-status={r.status}>
                    {r.status} REPORT
                  </div>
                  <strong>{r.report_type.replace('_', ' ')}</strong> ({r.severity})
                  <p>{r.description}</p>
                  <small>{new Date(r.created_at).toLocaleString()}</small>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* Historical Landslides */}
        {layers.historicalLandslides &&
          HISTORICAL_LANDSLIDES.map(h => (
            <CircleMarker
              key={h.id}
              center={[h.lat, h.lng]}
              radius={6}
              pathOptions={{ color: '#475569', fillColor: '#334155', fillOpacity: 0.8 }}
            >
              <Popup>
                <strong>⚠️ Historical Incident</strong>
                <br />
                {h.name} ({h.year})
              </Popup>
            </CircleMarker>
          ))}

        {/* Feature 9: Safe Route Polyline */}
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

      {/* Map Legend */}
      <div className="map-legend-bar">
        <span className="legend-label">Risk Scale:</span>
        <div className="legend-item"><span className="legend-dot low"></span> 0–24 LOW</div>
        <div className="legend-item"><span className="legend-dot moderate"></span> 25–49 MODERATE</div>
        <div className="legend-item"><span className="legend-dot high"></span> 50–74 HIGH</div>
        <div className="legend-item"><span className="legend-dot critical"></span> 75–100 CRITICAL</div>
        <div className="legend-item"><span className="legend-dot verified"></span> Verified Report</div>
      </div>
    </div>
  );
};
