import React, { useState } from 'react';
import { MapPin, Navigation, Phone, ShieldCheck, Building2, Hospital, Siren, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Shelter {
  id: string;
  name: string;
  type: 'shelter' | 'hospital' | 'fire-station' | 'relief-camp';
  lat: number;
  lng: number;
  capacity: number;
  occupancy: number;
  distance_km: number;
  contact: string;
  status: 'open' | 'full' | 'preparing';
}

interface EvacuationZone {
  id: string;
  zone_name: string;
  population: number;
  risk_level: string;
  evacuation_status: 'standby' | 'alert' | 'evacuating' | 'complete';
  shelters_assigned: string[];
  estimated_time_min: number;
}

const SHELTERS: Shelter[] = [
  { id: 'SH-001', name: 'Wayanad Government Taluk Hospital & Relief Camp', type: 'hospital', lat: 11.53, lng: 76.13, capacity: 450, occupancy: 210, distance_km: 3.2, contact: '+91-4936-202444', status: 'open' },
  { id: 'SH-002', name: 'Mandi Zonal Hospital & Disaster Ward', type: 'hospital', lat: 31.70, lng: 76.93, capacity: 350, occupancy: 180, distance_km: 2.5, contact: '+91-1905-222100', status: 'open' },
  { id: 'SH-003', name: 'Rishikesh AIIMS Emergency Trauma Center', type: 'hospital', lat: 30.07, lng: 78.28, capacity: 600, occupancy: 390, distance_km: 6.8, contact: '+91-135-2462929', status: 'open' },
  { id: 'SH-004', name: 'Munnar Tea Estate High School Relief Shelter', type: 'relief-camp', lat: 10.08, lng: 77.06, capacity: 300, occupancy: 95, distance_km: 1.9, contact: '+91-4865-230230', status: 'open' },
  { id: 'SH-005', name: 'Mahad Municipal Sports Complex Shelter (Raigad)', type: 'shelter', lat: 18.23, lng: 73.42, capacity: 400, occupancy: 120, distance_km: 2.1, contact: '+91-2145-222123', status: 'open' },
  { id: 'SH-006', name: 'STNM Multispeciality Hospital Gangtok', type: 'hospital', lat: 27.32, lng: 88.61, capacity: 500, occupancy: 280, distance_km: 4.1, contact: '+91-3592-202525', status: 'open' },
  { id: 'SH-007', name: 'Darjeeling Sadar Civil Hospital', type: 'hospital', lat: 27.04, lng: 88.26, capacity: 250, occupancy: 160, distance_km: 1.7, contact: '+91-354-2254218', status: 'open' },
  { id: 'SH-008', name: 'Shimla IGMC Emergency Relief Block', type: 'hospital', lat: 31.10, lng: 77.18, capacity: 500, occupancy: 310, distance_km: 3.5, contact: '+91-177-2804251', status: 'open' },
];

const EVAC_ZONES: EvacuationZone[] = [
  { id: 'EV-001', zone_name: 'Wayanad Chooralmala & Mundakkai Valley Basin', population: 3200, risk_level: 'CRITICAL', evacuation_status: 'alert', shelters_assigned: ['SH-001'], estimated_time_min: 40 },
  { id: 'EV-002', zone_name: 'Mandi Pandoh Gorge & Aut Highway Cut', population: 2100, risk_level: 'CRITICAL', evacuation_status: 'alert', shelters_assigned: ['SH-002'], estimated_time_min: 35 },
  { id: 'EV-003', zone_name: 'Rudraprayag — Kedarnath Valley Highway Hamlet', population: 1400, risk_level: 'HIGH', evacuation_status: 'standby', shelters_assigned: ['SH-003'], estimated_time_min: 50 },
  { id: 'EV-004', zone_name: 'Idukki Pettimudi & Munnar Gap Tea Corridors', population: 1900, risk_level: 'HIGH', evacuation_status: 'standby', shelters_assigned: ['SH-004'], estimated_time_min: 45 },
  { id: 'EV-005', zone_name: 'Raigad Mahad — Poladpur Scarp Settlements', population: 1650, risk_level: 'HIGH', evacuation_status: 'standby', shelters_assigned: ['SH-005'], estimated_time_min: 30 },
  { id: 'EV-006', zone_name: 'North Sikkim Mangan — Chungthang River Ridge', population: 850, risk_level: 'CRITICAL', evacuation_status: 'evacuating', shelters_assigned: ['SH-006'], estimated_time_min: 60 },
];

const getRiskColor = (level: string) => {
  const map: Record<string, string> = { LOW: '#22c55e', MODERATE: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444' };
  return map[level] || '#94a3b8';
};

const getEvacStatusLabel = (s: string) => {
  const map: Record<string, { label: string; color: string }> = {
    standby: { label: '⏳ STANDBY', color: '#94a3b8' },
    alert: { label: '⚠️ ALERT ISSUED', color: '#eab308' },
    evacuating: { label: '🚨 EVACUATING', color: '#ef4444' },
    complete: { label: '✅ COMPLETE', color: '#22c55e' },
  };
  return map[s] || { label: s, color: '#94a3b8' };
};

const getTypeIcon = (t: string) => {
  const map: Record<string, string> = { shelter: '🏠', hospital: '🏥', 'fire-station': '🚒', 'relief-camp': '⛺' };
  return map[t] || '📍';
};

export const EvacuationPlanner: React.FC = () => {
  const [activeView, setActiveView] = useState<'zones' | 'shelters'>('zones');

  const totalPop = EVAC_ZONES.reduce((s, z) => s + z.population, 0);
  const totalCapacity = SHELTERS.reduce((s, sh) => s + sh.capacity, 0);
  const totalOccupancy = SHELTERS.reduce((s, sh) => s + sh.occupancy, 0);

  return (
    <div className="evacuation-planner">
      <div className="evac-header">
        <Siren size={24} className="brand-icon" />
        <div>
          <h2>Emergency Evacuation Planner</h2>
          <p>Real-time evacuation zones, nearest shelters/hospitals, and crowd capacity tracking</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="evac-kpi-row">
        <div className="evac-kpi">
          <Users size={20} />
          <div>
            <small>Affected Population</small>
            <strong>{totalPop.toLocaleString()}</strong>
          </div>
        </div>
        <div className="evac-kpi">
          <Building2 size={20} />
          <div>
            <small>Shelters Available</small>
            <strong>{SHELTERS.filter(s => s.status === 'open').length}/{SHELTERS.length}</strong>
          </div>
        </div>
        <div className="evac-kpi">
          <ShieldCheck size={20} />
          <div>
            <small>Total Shelter Capacity</small>
            <strong>{totalCapacity.toLocaleString()}</strong>
          </div>
        </div>
        <div className="evac-kpi">
          <Hospital size={20} />
          <div>
            <small>Current Occupancy</small>
            <strong>{Math.round((totalOccupancy / totalCapacity) * 100)}%</strong>
          </div>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="evac-tabs">
        <button className={activeView === 'zones' ? 'active' : ''} onClick={() => setActiveView('zones')}>
          <AlertTriangle size={16} /> Evacuation Zones ({EVAC_ZONES.length})
        </button>
        <button className={activeView === 'shelters' ? 'active' : ''} onClick={() => setActiveView('shelters')}>
          <Building2 size={16} /> Shelters & Hospitals ({SHELTERS.length})
        </button>
      </div>

      {activeView === 'zones' ? (
        <div className="evac-zones-list">
          {EVAC_ZONES.map(z => {
            const statusInfo = getEvacStatusLabel(z.evacuation_status);
            return (
              <div key={z.id} className={`evac-zone-card ${z.risk_level.toLowerCase()}`}>
                <div className="evac-zone-header">
                  <div>
                    <span className="evac-zone-id">{z.id}</span>
                    <h3>{z.zone_name}</h3>
                  </div>
                  <span className="evac-status-pill" style={{ background: statusInfo.color }}>{statusInfo.label}</span>
                </div>
                <div className="evac-zone-details">
                  <div className="evac-detail-item">
                    <Users size={14} />
                    <span>Population: <strong>{z.population.toLocaleString()}</strong></span>
                  </div>
                  <div className="evac-detail-item">
                    <AlertTriangle size={14} style={{ color: getRiskColor(z.risk_level) }} />
                    <span>Risk: <strong style={{ color: getRiskColor(z.risk_level) }}>{z.risk_level}</strong></span>
                  </div>
                  <div className="evac-detail-item">
                    <Navigation size={14} />
                    <span>Est. Evacuation Time: <strong>{z.estimated_time_min} min</strong></span>
                  </div>
                  <div className="evac-detail-item">
                    <Building2 size={14} />
                    <span>Assigned Shelters: <strong>{z.shelters_assigned.join(', ')}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="shelters-grid">
          {SHELTERS.map(sh => {
            const pctOccupied = Math.round((sh.occupancy / sh.capacity) * 100);
            return (
              <div key={sh.id} className="shelter-card">
                <div className="shelter-header">
                  <span className="shelter-type-icon">{getTypeIcon(sh.type)}</span>
                  <div>
                    <strong>{sh.name}</strong>
                    <span className="shelter-id">{sh.id} · {sh.type.replace('-', ' ').toUpperCase()}</span>
                  </div>
                </div>
                <div className="shelter-capacity-bar">
                  <div className="cap-bar-track">
                    <div
                      className="cap-bar-fill"
                      style={{
                        width: `${pctOccupied}%`,
                        background: pctOccupied >= 90 ? '#ef4444' : pctOccupied >= 70 ? '#eab308' : '#22c55e',
                      }}
                    ></div>
                  </div>
                  <span className="cap-label">{sh.occupancy}/{sh.capacity} ({pctOccupied}% full)</span>
                </div>
                <div className="shelter-meta">
                  <span><MapPin size={12} /> {sh.distance_km} km away</span>
                  <span><Phone size={12} /> {sh.contact}</span>
                </div>
                <span className={`shelter-status ${sh.status}`}>
                  {sh.status === 'open' ? '✅ Open' : sh.status === 'full' ? '🔴 Full' : '🟡 Preparing'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="evac-footer">
        <span>⚠️ Prototype evacuation planner. Real deployment integrates with NDMA, SDMA evacuation SOPs, and Google Maps Directions API.</span>
      </div>
    </div>
  );
};
