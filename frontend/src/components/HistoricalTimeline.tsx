import React, { useState } from 'react';
import { Calendar, MapPin, AlertTriangle, ChevronDown, ChevronUp, Clock, Skull, Info, History } from 'lucide-react';

interface HistoricalEvent {
  id: number;
  date: string;
  year: number;
  title: string;
  location: string;
  district: string;
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

const NATIONAL_HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: 10, date: '2024-07-30', year: 2024, title: 'Wayanad Chooralmala & Mundakkai Catastrophic Debris Surge', 
    location: 'Meppadi / Chooralmala, Wayanad', district: 'Wayanad', state: 'Kerala',
    lat: 11.53, lng: 76.13, casualties: 420, displaced: 4500, 
    cause: 'Orographic monsoon deluge (572mm in 48h) triggered mass soil liquefaction on 39° escarpment',
    description: 'Catastrophic double debris flow surged at 2:00 AM and 4:10 AM, completely pulverizing the villages of Chooralmala, Mundakkai, and Attamala, destroying the primary bridge and reshaping the river valley.',
    severity: 'catastrophic', source: 'Kerala SDMA & Geological Survey of India (GSI) National Report 2024'
  },
  {
    id: 11, date: '2014-07-30', year: 2014, title: 'Malin Ambegaon Village Mudflow Catastrophe', 
    location: 'Malin, Ambegaon Taluka, Pune', district: 'Pune', state: 'Maharashtra',
    lat: 19.16, lng: 73.68, casualties: 151, displaced: 320, 
    cause: 'Heavy monsoon downpour on deforested hill slope with flattened paddy terraces',
    description: 'Entire hillside broke loose during the early morning hours, burying 44 houses and the village school under meters of mud and basalt debris in under 3 minutes.',
    severity: 'catastrophic', source: 'NDRF 5th Battalion & National Institute of Disaster Management (NIDM)'
  },
  {
    id: 12, date: '2013-06-16', year: 2013, title: 'Kedarnath-Mandakini High Himalayan Valley Debris Floods', 
    location: 'Kedarnath Temple Valley, Rudraprayag', district: 'Rudraprayag', state: 'Uttarakhand',
    lat: 30.73, lng: 79.06, casualties: 5700, displaced: 12000, 
    cause: 'Chorabari glacial lake outburst flood (GLOF) + multi-day extreme downpour over moraines',
    description: 'Cataclysmic flash surge and concurrent moraine landslides obliterated the Kedarnath temple township, washing out roads, bridges, and settlements throughout the entire Mandakini basin.',
    severity: 'catastrophic', source: 'Wadia Institute of Himalayan Geology & NDMA Special Commission'
  },
  {
    id: 1, date: '2023-08-14', year: 2023, title: 'Shimla Summer Hill Shiv Temple Debris Avalanche', 
    location: 'Summer Hill, Shimla Town', district: 'Shimla', state: 'Himachal Pradesh',
    lat: 31.11, lng: 77.14, casualties: 21, displaced: 450, 
    cause: 'Extreme rainfall surge (140mm in 12h) + saturated clay overburden on 34° slope',
    description: 'Massive slope liquefaction sheared downhill from Summer Hill, demolishing the historic temple structure and washing through residential slope terraces.',
    severity: 'catastrophic', source: 'HP-SDMA & GSI Investigation Report 2023'
  },
  {
    id: 2, date: '2023-08-13', year: 2023, title: 'Mandi-Pandoh NH-21 Multi-Slope Collapse', 
    location: 'Pandoh Gorge Sector, NH-21', district: 'Mandi', state: 'Himachal Pradesh',
    lat: 31.67, lng: 77.05, casualties: 18, displaced: 600, 
    cause: '72h cumulative monsoon precipitation (280mm) + Beas River toe-cutting',
    description: 'Catastrophic hillside breach completely severed NH-21 between Mandi and Aut, stranding hundreds of vehicles and destroying hillside settlements.',
    severity: 'catastrophic', source: 'NDMA Situation Report & BRO Bulletin 2023'
  },
  {
    id: 4, date: '2021-08-11', year: 2021, title: 'Kinnaur Nigulsari Massive Highway Rockslide', 
    location: 'Nigulsari, NH-5 Hindustan-Tibet Road', district: 'Kinnaur', state: 'Himachal Pradesh',
    lat: 31.52, lng: 78.02, casualties: 28, displaced: 100, 
    cause: 'Sudden wedge failure in jointed granitic gneiss cliff on 44° slope',
    description: 'Large rock mass detached from near-vertical ridge above NH-5, burying an HRTC passenger bus and several vehicles under hundreds of tons of granite debris.',
    severity: 'catastrophic', source: 'NDRF 7th Battalion & GSI Technical Review'
  },
  {
    id: 13, date: '2015-07-01', year: 2015, title: 'Mirik-Darjeeling Multi-Slope Tea Garden Disasters', 
    location: 'Mirik, Tindharia & Kalimpong Slopes', district: 'Darjeeling', state: 'West Bengal',
    lat: 26.90, lng: 88.28, casualties: 40, displaced: 850, 
    cause: 'Heavy cloudburst (280mm in 6h) on saturated weathered phyllite terrain',
    description: 'Multiple simultaneous translational slips severed NH-55, damaged tea plantations, and destroyed homes across the Mirik Valley and Kurseong.',
    severity: 'catastrophic', source: 'West Bengal Disaster Management Department & GSI Eastern Region'
  },
  {
    id: 14, date: '2020-08-06', year: 2020, title: 'Pettimudi Munnar Plantation Colluvial Slide', 
    location: 'Pettimudi, Rajamala, Idukki', district: 'Idukki', state: 'Kerala',
    lat: 10.08, lng: 77.06, casualties: 66, displaced: 200, 
    cause: 'Heavy monsoon downpour triggering rotational slope failure on steep tea garden hills',
    description: 'Huge mass of mud, rock, and water slid 1.5km down the hill, completely burying tea estate worker settlements under 15-20 feet of debris.',
    severity: 'catastrophic', source: 'Kerala Forest Dept & Revenue Department Assessment'
  }
];

const getSeverityColor = (s: string) => {
  const map: Record<string, string> = { minor: '#eab308', major: '#f97316', catastrophic: '#ef4444' };
  return map[s] || '#94a3b8';
};

export const HistoricalTimeline: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(10);
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const states = ['ALL', ...Array.from(new Set(NATIONAL_HISTORICAL_EVENTS.map(e => e.state)))];

  const filteredEvents = NATIONAL_HISTORICAL_EVENTS.filter(e => {
    if (stateFilter !== 'ALL' && e.state !== stateFilter) return false;
    if (severityFilter !== 'ALL' && e.severity !== severityFilter) return false;
    return true;
  });

  const totalCasualties = NATIONAL_HISTORICAL_EVENTS.reduce((sum, e) => sum + e.casualties, 0);

  return (
    <div className="historical-timeline-container">
      {/* Header */}
      <div className="timeline-header">
        <History size={28} className="header-icon" />
        <div>
          <h2>Historical Landslide Disasters Archive — National Catalog</h2>
          <p>Documented major slope failure disasters from GSI, NDMA, and State SDMA archives</p>
        </div>
      </div>

      {/* State / Region Filter Row */}
      <div className="state-filter-row">
        {states.map(s => (
          <button 
            key={s} 
            className={`state-chip ${stateFilter === s ? 'active' : ''}`} 
            onClick={() => setStateFilter(s)}
          >
            {s === 'ALL' ? '🇮🇳 All Regions' : `📍 ${s}`}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="timeline-list">
        {filteredEvents.map(e => {
          const isOpen = expandedId === e.id;
          return (
            <div key={e.id} className={`timeline-event ${e.severity}`} onClick={() => setExpandedId(isOpen ? null : e.id)}>
              <div className="timeline-line-dot" style={{ background: getSeverityColor(e.severity) }} />
              <div className="timeline-event-body">
                <div className="event-header-row">
                  <div>
                    <span className="event-date"><Clock size={12} /> {e.date}</span>
                    <h3>{e.title}</h3>
                    <span className="event-location"><MapPin size={12} /> {e.location} · {e.district} ({e.state})</span>
                  </div>
                  <div className="event-badges">
                    <span className="severity-badge" style={{ background: getSeverityColor(e.severity) }}>
                      {e.severity.toUpperCase()}
                    </span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                <div className="event-quick-stats">
                  <span><Skull size={13} /> {e.casualties} casualties</span>
                  <span>👥 {e.displaced.toLocaleString()} displaced</span>
                  <span>📍 Coords: {e.lat.toFixed(2)}°N, {e.lng.toFixed(2)}°E</span>
                </div>

                {isOpen && (
                  <div className="event-expanded-details">
                    <div className="detail-field">
                      <strong>Geotechnical Cause:</strong>
                      <p>{e.cause}</p>
                    </div>
                    <div className="detail-field">
                      <strong>Incident Description:</strong>
                      <p>{e.description}</p>
                    </div>
                    <div className="detail-field">
                      <strong>Official Documentation Source:</strong>
                      <small>{e.source}</small>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
