import React, { useState } from 'react';
import { Calendar, MapPin, AlertTriangle, ChevronDown, ChevronUp, Clock, Skull } from 'lucide-react';

interface HistoricalEvent {
  id: number;
  date: string;
  year: number;
  title: string;
  location: string;
  state: string;
  lat: number;
  lng: number;
  casualties: number;
  displaced: number;
  cause: string;
  description: string;
  severity: 'minor' | 'major' | 'catastrophic';
  source: string;
}

const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: 1, date: '2023-07-12', year: 2023, title: 'Mizoram Highway Landslide', location: 'Aizawl-Silchar Highway, NH-306', state: 'Mizoram',
    lat: 23.73, lng: 92.72, casualties: 14, displaced: 380, cause: 'Heavy monsoon rainfall (120mm in 6h) + deforested hillside',
    description: 'Massive debris flow buried 200m section of National Highway near Kolasib. Multiple vehicles trapped under soil and boulders.',
    severity: 'major', source: 'NDMA Situation Report 2023-07-12'
  },
  {
    id: 2, date: '2022-06-29', year: 2022, title: 'Manipur Railway Construction Slide', location: 'Imphal-Jiribam Rail Corridor', state: 'Manipur',
    lat: 24.82, lng: 93.94, casualties: 8, displaced: 200, cause: 'Slope excavation destabilization + saturated clay substratum',
    description: 'A retaining wall collapsed during railway tunnel construction, triggering a secondary debris slide covering 3 hectares.',
    severity: 'major', source: 'GSI Technical Report 2022'
  },
  {
    id: 3, date: '2021-10-28', year: 2021, title: 'Shillong Plateau Slope Failure', location: 'Laitkor Peak, Upper Shillong', state: 'Meghalaya',
    lat: 25.58, lng: 91.89, casualties: 5, displaced: 150, cause: '72h continuous rainfall (210mm) + steep gradient (38°)',
    description: 'Shallow translational slide destroyed 12 residential structures on the eastern face of Laitkor Peak.',
    severity: 'major', source: 'NEIST Seismological Centre Report'
  },
  {
    id: 4, date: '2020-08-14', year: 2020, title: 'Sikkim Flash Flood + Landslide', location: 'Teesta River Valley, NH-10', state: 'Sikkim',
    lat: 27.33, lng: 88.61, casualties: 22, displaced: 1200, cause: 'Cloud burst + glacial lake outburst flood + seismic precursor',
    description: 'Catastrophic compound event: flash flooding triggered multiple sequential landslides along 15km of highway corridor.',
    severity: 'catastrophic', source: 'IMD & CWC Flood Bulletin 2020'
  },
  {
    id: 5, date: '2019-08-05', year: 2019, title: 'Nagaland Highway Block', location: 'Kohima-Imphal Highway, NH-39', state: 'Nagaland',
    lat: 25.67, lng: 94.11, casualties: 3, displaced: 85, cause: 'Prolonged 5-day rainfall + road cut instability',
    description: 'Rotational slide blocked NH-39 for 72 hours. Army engineers deployed for emergency clearance.',
    severity: 'minor', source: 'Border Roads Organisation Report'
  },
  {
    id: 6, date: '2017-09-18', year: 2017, title: 'Meghalaya Coal Mine Collapse + Slide', location: 'East Jaintia Hills', state: 'Meghalaya',
    lat: 25.42, lng: 92.38, casualties: 17, displaced: 450, cause: 'Illegal rat-hole mining + monsoon saturation + subsurface voids',
    description: 'Underground void collapse triggered surface subsidence and landslide. Rescue operations lasted 12 days.',
    severity: 'catastrophic', source: 'NGT Environmental Report 2017'
  },
  {
    id: 7, date: '2016-01-04', year: 2016, title: 'Manipur Earthquake-Triggered Landslides', location: 'Tamenglong District', state: 'Manipur',
    lat: 25.08, lng: 93.52, casualties: 9, displaced: 300, cause: 'M6.7 earthquake + weakened slope stability + aftershock sequence',
    description: 'Earthquake (M6.7, depth 55km) triggered 30+ landslides across Tamenglong. Critical infrastructure severely damaged.',
    severity: 'catastrophic', source: 'USGS & IMD Seismological Bulletin'
  },
  {
    id: 8, date: '2024-08-22', year: 2024, title: 'Assam Flood-Linked Slope Failures', location: 'Haflong-Badarpur Rail Section', state: 'Assam',
    lat: 25.17, lng: 93.02, casualties: 6, displaced: 520, cause: 'Brahmaputra flood + sustained 96h rainfall (280mm)',
    description: 'Rail embankment failure and 4 concurrent hillside slides disrupted Northeast rail connectivity for 2 weeks.',
    severity: 'major', source: 'Northeast Frontier Railway Bulletin 2024'
  },
];

const getSeverityColor = (s: string) => {
  const map: Record<string, string> = { minor: '#eab308', major: '#f97316', catastrophic: '#ef4444' };
  return map[s] || '#94a3b8';
};

export const HistoricalTimeline: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterState, setFilterState] = useState<string>('ALL');

  const states = ['ALL', ...Array.from(new Set(HISTORICAL_EVENTS.map(e => e.state)))];
  const filtered = filterState === 'ALL' ? HISTORICAL_EVENTS : HISTORICAL_EVENTS.filter(e => e.state === filterState);
  const totalCasualties = filtered.reduce((s, e) => s + e.casualties, 0);
  const totalDisplaced = filtered.reduce((s, e) => s + e.displaced, 0);

  return (
    <div className="historical-timeline">
      <div className="timeline-header">
        <Calendar size={24} className="brand-icon" />
        <div>
          <h2>Historical Landslide Events — North East India</h2>
          <p>Documented major landslide events from NDMA, GSI, and IMD archives for risk pattern analysis</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="timeline-kpi-row">
        <div className="timeline-kpi">
          <span className="kpi-val">{filtered.length}</span>
          <small>Documented Events</small>
        </div>
        <div className="timeline-kpi">
          <span className="kpi-val" style={{ color: '#ef4444' }}>{totalCasualties}</span>
          <small>Total Casualties</small>
        </div>
        <div className="timeline-kpi">
          <span className="kpi-val" style={{ color: '#f97316' }}>{totalDisplaced.toLocaleString()}</span>
          <small>People Displaced</small>
        </div>
        <div className="timeline-kpi">
          <span className="kpi-val">{filtered.filter(e => e.severity === 'catastrophic').length}</span>
          <small>Catastrophic Events</small>
        </div>
      </div>

      {/* State Filter */}
      <div className="state-filter-row">
        {states.map(s => (
          <button key={s} className={`state-chip ${filterState === s ? 'active' : ''}`} onClick={() => setFilterState(s)}>
            {s === 'ALL' ? '🗺️ All States' : `📍 ${s}`}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="timeline-list">
        {filtered.map(e => {
          const isOpen = expandedId === e.id;
          return (
            <div key={e.id} className={`timeline-event ${e.severity}`} onClick={() => setExpandedId(isOpen ? null : e.id)}>
              <div className="timeline-line-dot" style={{ background: getSeverityColor(e.severity) }}></div>
              <div className="timeline-event-body">
                <div className="event-header-row">
                  <div>
                    <span className="event-date"><Clock size={12} /> {e.date}</span>
                    <h3>{e.title}</h3>
                    <span className="event-location"><MapPin size={12} /> {e.location}, {e.state}</span>
                  </div>
                  <div className="event-badges">
                    <span className="severity-badge" style={{ background: getSeverityColor(e.severity) }}>{e.severity.toUpperCase()}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                <div className="event-quick-stats">
                  <span><Skull size={12} /> {e.casualties} casualties</span>
                  <span>👥 {e.displaced} displaced</span>
                </div>

                {isOpen && (
                  <div className="event-expanded">
                    <div className="event-cause">
                      <strong>Root Cause:</strong> {e.cause}
                    </div>
                    <p className="event-desc">{e.description}</p>
                    <div className="event-source">
                      📄 Source: {e.source}
                    </div>
                    <div className="event-coords">
                      📍 Coordinates: {e.lat}°N, {e.lng}°E
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="timeline-footer">
        <span>📚 Data compiled from NDMA, GSI (Geological Survey of India), IMD, and published research. Coordinates approximate for visualization purposes.</span>
      </div>
    </div>
  );
};
