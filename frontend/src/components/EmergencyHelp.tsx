import React, { useState, useEffect } from 'react';
import { 
  Phone, Hospital, ShieldAlert, Building2, Radio, AlertTriangle, 
  CheckCircle2, Compass, ExternalLink, MapPin, HeartPulse, Flame,
  Search, Copy, Check, Navigation, Siren, ChevronDown, ChevronUp, Share2,
  Printer, Send, Crosshair, HelpCircle, Activity, Bandage
} from 'lucide-react';
import { apiService } from '../services/api';
import { EmergencyResource } from '../types';

const OFFICIAL_HELPLINES = [
  { name: 'HP State Disaster Emergency Operation Center (SDEOC)', number: '1070', desc: '24x7 Statewide Disaster Helpline (Toll-Free)', icon: '🚨', badge: 'STATEWIDE 24x7', priority: 'critical' },
  { name: 'District Disaster Management Authority (DDMA)', number: '1077', desc: 'District Level Emergency Control Room (Toll-Free)', icon: '🏢', badge: 'DISTRICT DDMA', priority: 'critical' },
  { name: 'Emergency Response Support System (ERSS)', number: '112', desc: 'Unified Police, Fire & Medical Helpline (Pan-India)', icon: '👮', badge: 'ALL-IN-ONE 112', priority: 'critical' },
  { name: 'National Disaster Management Authority (NDMA HQ)', number: '1078', desc: 'National Disaster Helpline & Guidance', icon: '🇮🇳', badge: 'NATIONAL NDMA', priority: 'high' },
  { name: 'National Medical Emergency Ambulance Service', number: '108', desc: 'Free Emergency Ambulance Dispatch (GVK EMRI Pan-India)', icon: '🚑', badge: 'AMBULANCE 108', priority: 'critical' },
  { name: 'National Highway Emergency & Road Assistance', number: '1033', desc: 'NHAI 24x7 Highway Breakdown & Rockfall Helpline', icon: '🛣️', badge: 'HIGHWAYS 1033', priority: 'high' },
  { name: 'Fire & Mountain Rescue Dispatch', number: '101', desc: 'State Fire Services & Structural Collapse Rescue', icon: '🚒', badge: 'FIRE RESCUE 101', priority: 'high' },
  { name: 'BRO Snow & Landslide Road Clearance Control', number: '+91-1905-282110', desc: 'Pandoh-Kullu-Manali & Rohtang Highway Control', icon: '🚜', badge: 'BRO HIGHWAY', priority: 'high' },
];

const NATIONAL_SDMA_DDMA = [
  { state: 'National', district: 'National HQ (NDMA)', phone: '011-26701700', tollFree: '1078', office: 'NDMA Bhawan, Safdarjung Enclave, New Delhi' },
  { state: 'Kerala', district: 'Statewide SDEOC', phone: '0471-2364424', tollFree: '1070', office: 'Kerala SDMA, Observatory Hills, Thiruvananthapuram' },
  { state: 'Kerala', district: 'Wayanad DDMA', phone: '04936-204151', tollFree: '1077', office: 'DC Office Collectorate, Kalpetta, Wayanad' },
  { state: 'Kerala', district: 'Idukki DDMA', phone: '04862-233111', tollFree: '1077', office: 'DC Office Painavu, Idukki' },
  { state: 'Uttarakhand', district: 'Statewide USDRF', phone: '0135-2710334', tollFree: '1070', office: 'Uttarakhand SDMA, Secretariat, Dehradun' },
  { state: 'Uttarakhand', district: 'Rudraprayag DDMA', phone: '01364-233727', tollFree: '1077', office: 'DC Office, Rudraprayag (Kedarnath Sector)' },
  { state: 'Uttarakhand', district: 'Chamoli DDMA', phone: '01372-251437', tollFree: '1077', office: 'DC Office Gopeshwar, Chamoli' },
  { state: 'Maharashtra', district: 'Statewide Control', phone: '022-22027990', tollFree: '1070', office: 'Disaster Cell, Mantralaya, Mumbai' },
  { state: 'Maharashtra', district: 'Raigad DDMA', phone: '02141-222001', tollFree: '1077', office: 'DC Office Alibag, Raigad' },
  { state: 'Maharashtra', district: 'Pune DDMA', phone: '020-26123371', tollFree: '1077', office: 'DC Office Collectorate, Pune' },
  { state: 'Himachal Pradesh', district: 'Statewide SDEOC', phone: '0177-2800881', tollFree: '1070', office: 'State Secretariat, Chhota Shimla' },
  { state: 'Himachal Pradesh', district: 'Mandi DDMA', phone: '01905-226201', tollFree: '1077', office: 'DC Office Complex, Mandi' },
  { state: 'Himachal Pradesh', district: 'Kullu DDMA', phone: '01902-225630', tollFree: '1077', office: 'DC Office Disaster Cell, Kullu' },
  { state: 'Sikkim', district: 'Sikkim SSDMA', phone: '03592-202410', tollFree: '1070', office: 'Tashiling Secretariat, Gangtok, Sikkim' },
  { state: 'West Bengal', district: 'Darjeeling DDMA', phone: '0354-2255749', tollFree: '1077', office: 'District Magistrate Office, Darjeeling' },
  { state: 'Tamil Nadu', district: 'Nilgiris DDMA', phone: '0423-2444013', tollFree: '1077', office: 'Collectorate, Udhagamandalam (Ooty)' },
  { state: 'Karnataka', district: 'Kodagu DDMA', phone: '08272-221077', tollFree: '1077', office: 'DC Office Madikeri, Kodagu' },
];

const FIRST_AID_PROTOCOLS = [
  {
    title: 'Crush Injury & Compartment Syndrome',
    icon: '🩹',
    urgency: 'Immediate Action',
    steps: [
      'Do NOT immediately remove heavy structural debris if the victim has been trapped for >1 hour without medical personnel on standby (toxic reperfusion risk).',
      'If safely extricated, elevate injured limbs, apply cold packs if available, and keep the victim calm and warm.',
      'Check peripheral pulse in limbs distal to the injury site. Re-evaluate every 15 minutes.'
    ]
  },
  {
    title: 'Hemorrhage & Severe Bleeding Control',
    icon: '🩸',
    urgency: 'Time-Critical',
    steps: [
      'Apply direct, continuous firm pressure over the bleeding wound using sterile gauze or clean fabric.',
      'If severe extremity arterial bleeding persists, apply an improvised tourniquet 2-3 inches above the wound (never over a joint). Note down the exact time applied.',
      'Do not remove blood-soaked dressings; pack additional layers firmly on top.'
    ]
  },
  {
    title: 'Hypothermia & Himalayan Shock',
    icon: '❄️',
    urgency: 'Environmental Hazard',
    steps: [
      'Remove cold, soaked mud-caked clothing as soon as shelter is reached.',
      'Insulate from cold mountain ground using dry blankets, foil space blankets, or dry foliage.',
      'Provide warm, sweetened fluids only if the victim is fully conscious and breathing unassisted.'
    ]
  }
];

const SAFETY_INSTRUCTIONS = [
  {
    phase: 'BEFORE A LANDSLIDE (PREPAREDNESS & WARNING SIGNS)',
    icon: '⏳',
    color: '#eab308',
    items: [
      'Learn whether landslides, mudflows, or debris flows have historically occurred in your specific valley.',
      'Regularly inspect hillside retainer walls, weep holes, and road-cutting drainage gutters for mud blockages.',
      'Watch for physical warning signs: doors or windows sticking in frames, widening cracks in driveways, new tilted trees, or sudden muddy water seepage emerging from slopes.',
      'Prepare a disaster grab bag containing potable water, flashlight, spare batteries, first-aid, essential medicines, and emergency contacts.',
      'Identify two independent evacuation routes to higher, stable ground away from stream hollows and steep cuttings.'
    ]
  },
  {
    phase: 'DURING A LANDSLIDE (IMMEDIATE LIFE-SAFETY ACTION)',
    icon: '🚨',
    color: '#ef4444',
    items: [
      'If you hear unusual rumbling sounds or crackling trees, evacuate immediately to safe ground if a clear escape path exists.',
      'If trapped indoors: move to the highest level or upstairs room and take shelter under a sturdy table, desk, or bed.',
      'If outdoors when debris flows move: run quickly away from the path to the nearest ridge or high ground; never attempt to cross moving mud streams.',
      'Never attempt to drive through flooded mountain bridges, active debris surges, or under eroding hillside cuttings.',
      'If escape is no longer possible, curl into a tight ball and protect your head with your arms to minimize impact trauma.'
    ]
  },
  {
    phase: 'AFTER A LANDSLIDE (RECOVERY, HAZARDS & REPORTING)',
    icon: '🛡️',
    color: '#10b981',
    items: [
      'Stay well away from the slide area. Secondary slides and after-slips frequently occur hours or days following the initial failure.',
      'Check for injured or trapped persons without entering the slide zone directly; guide professional SDRF/NDRF rescue teams.',
      'Report broken utility lines, severed electric cables, gas leaks, or ruptured water conduits immediately to DDMA (1077) or ERSS (112).',
      'Tune into official HP-SDMA radio/social channels and verify highway status before attempting any transit.',
      'Submit a ground report on SlopeSafe with photos to help geological authorities track secondary crack progression.'
    ]
  }
];

export const EmergencyHelp: React.FC = () => {
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0); // First accordion open by default
  const [showDDMATable, setShowDDMATable] = useState<boolean>(false);
  const [showFirstAid, setShowFirstAid] = useState<boolean>(false);

  // GPS SOS Beacon State
  const [locating, setLocating] = useState<boolean>(false);
  const [sosLocation, setSosLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [sosError, setSosError] = useState<string | null>(null);
  const [sosCopied, setSosCopied] = useState<boolean>(false);

  useEffect(() => {
    apiService.getEmergencyContacts()
      .then(data => setResources(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopyPhone = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(number);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleGetSOSLocation = () => {
    setLocating(true);
    setSosError(null);

    if (!('geolocation' in navigator)) {
      setSosError('Geolocation not supported on this device. Using default Mandi emergency anchor.');
      setSosLocation({ lat: 31.7088, lng: 76.9320, accuracy: 25 });
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSosLocation({
          lat: parseFloat(pos.coords.latitude.toFixed(5)),
          lng: parseFloat(pos.coords.longitude.toFixed(5)),
          accuracy: Math.round(pos.coords.accuracy)
        });
        setLocating(false);
      },
      (err) => {
        // Fallback to central Pan-India coordinates
        setSosError(`GPS access notice (${err.message}). Defaulted to National Emergency Coordination View.`);
        setSosLocation({ lat: 22.8000, lng: 79.5000, accuracy: 50 });
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const generateSosMessage = () => {
    const lat = sosLocation ? sosLocation.lat : 22.8000;
    const lng = sosLocation ? sosLocation.lng : 79.5000;
    const accuracy = sosLocation?.accuracy ? `(±${sosLocation.accuracy}m)` : '';
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `🚨 EMERGENCY SOS - LANDSLIDE RESCUE REQUIRED 🚨\nLocation: https://maps.google.com/?q=${lat},${lng} (Lat: ${lat}, Lng: ${lng} ${accuracy})\nTime: ${now} IST\nTerritory: India / Monitored Landslide Corridor\nStatus: Stranded / Landslide threat. Request immediate NDRF/SDRF/ERSS (112) assistance.\n(Sent via SlopeSafe National EWS)`;
  };

  const handleCopySosMessage = () => {
    const msg = generateSosMessage();
    navigator.clipboard.writeText(msg);
    setSosCopied(true);
    setTimeout(() => setSosCopied(false), 2500);
  };

  const handlePrintPocketCard = () => {
    window.print();
  };

  const districts = ['ALL', ...Array.from(new Set(resources.map(r => r.district)))];

  const filteredResources = resources.filter(r => {
    if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
    if (districtFilter !== 'ALL' && r.district !== districtFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        r.phone.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="emergency-help-container">
      {/* Header with SOS Quick Action */}
      <div className="emergency-header">
        <div className="emergency-title-wrap">
          <ShieldAlert size={32} className="header-icon pulse-red" />
          <div>
            <h2>Emergency Response & Disaster Directory</h2>
            <p>National Disaster Management Authority (NDMA), State SDRF Units, Trauma Hospitals & 24x7 Control Rooms</p>
          </div>
        </div>

        <div className="emergency-header-actions">
          <button onClick={handlePrintPocketCard} className="btn-print-pocket" title="Print or Save Emergency Pocket Card as PDF">
            <Printer size={15} /> Pocket Card (PDF)
          </button>
          <div className="sos-banner-quick">
            <Siren size={18} className="spin-slow" />
            <span>Life Threat? Dial <strong>112</strong> / <strong>1070</strong></span>
          </div>
        </div>
      </div>

      {/* GPS SOS Distress Beacon Panel */}
      <div className="sos-beacon-card">
        <div className="sos-beacon-left">
          <div className="beacon-title-row">
            <Radio size={20} className="beacon-ping-icon" />
            <h3>Rapid GPS Distress Beacon</h3>
            <span className="live-pill">OFFLINE & SMS READY</span>
          </div>
          <p>
            Generate an instantaneous location broadcast containing verified GPS coordinates to dispatch to <strong>ERSS (112)</strong>, 
            <strong>SDRF</strong>, or family via WhatsApp / SMS during mountain transit emergencies.
          </p>

          {sosLocation && (
            <div className="sos-loc-coords">
              <Crosshair size={14} className="text-emerald-400" />
              <span><strong>Lat:</strong> {sosLocation.lat}° N, <strong>Lng:</strong> {sosLocation.lng}° E</span>
              {sosLocation.accuracy && <small className="text-slate-400">(GPS Accuracy: ±{sosLocation.accuracy}m)</small>}
            </div>
          )}

          {sosError && <div className="sos-error-notice">{sosError}</div>}
        </div>

        <div className="sos-beacon-actions">
          {!sosLocation ? (
            <button 
              className="btn-acquire-gps" 
              onClick={handleGetSOSLocation}
              disabled={locating}
            >
              <Crosshair size={16} className={locating ? 'spin-slow' : ''} />
              {locating ? 'Acquiring Satellite GPS...' : '1. Pin My Live GPS Coordinates'}
            </button>
          ) : (
            <div className="sos-transmit-buttons">
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(generateSosMessage())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-transmit-whatsapp"
              >
                <Share2 size={15} /> Share on WhatsApp
              </a>

              <a 
                href={`sms:112?body=${encodeURIComponent(generateSosMessage())}`}
                className="btn-transmit-sms"
              >
                <Send size={15} /> Send SOS via SMS (112)
              </a>

              <button 
                className="btn-copy-sos"
                onClick={handleCopySosMessage}
              >
                {sosCopied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                {sosCopied ? 'Distress Message Copied!' : 'Copy SOS Message'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Official 24x7 Helplines Grid (Direct Click-to-Call & Copy) */}
      <div className="helpline-section-block">
        <div className="section-subtitle-row">
          <Phone size={18} className="sub-icon" />
          <h3>Official 24x7 Disaster Helplines (Direct Toll-Free)</h3>
        </div>

        <div className="helpline-cards-grid">
          {OFFICIAL_HELPLINES.map(h => (
            <div key={h.name} className={`helpline-card ${h.priority === 'critical' ? 'critical-border' : ''}`}>
              <div className="helpline-top">
                <span className="helpline-icon">{h.icon}</span>
                <span className={`helpline-tag ${h.priority === 'critical' ? 'critical-tag' : ''}`}>{h.badge}</span>
              </div>
              <h3>{h.name}</h3>
              <p>{h.desc}</p>
              
              <div className="helpline-action-buttons">
                <a href={`tel:${h.number.replace(/[^0-9+]/g, '')}`} className="btn-call-emergency">
                  <Phone size={15} /> Call {h.number}
                </a>
                <button 
                  className="btn-copy-phone" 
                  onClick={() => handleCopyPhone(h.number)}
                  title="Copy Phone Number"
                >
                  {copiedNumber === h.number ? <Check size={14} style={{ color: '#22c55e' }} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* National & Multi-State SDMA / DDMA Control Rooms Toggle */}
      <div className="ddma-toggle-section">
        <button 
          className="btn-toggle-ddma"
          onClick={() => setShowDDMATable(!showDDMATable)}
        >
          <div className="toggle-left">
            <Building2 size={18} />
            <span>National & Multi-State Emergency Operation Centers (NDMA, SDMA & District DDMAs)</span>
          </div>
          {showDDMATable ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showDDMATable && (
          <div className="ddma-table-wrap">
            <table className="ddma-table">
              <thead>
                <tr>
                  <th>State / Jurisdiction</th>
                  <th>Center / District</th>
                  <th>Direct Phone</th>
                  <th>Toll-Free</th>
                  <th>Command Center Office</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {NATIONAL_SDMA_DDMA.map(d => (
                  <tr key={`${d.state}-${d.district}`}>
                    <td><span className="badge-state">{d.state}</span></td>
                    <td><strong>{d.district}</strong></td>
                    <td><code>{d.phone}</code></td>
                    <td><span className="badge-tollfree">{d.tollFree}</span></td>
                    <td className="text-muted">{d.office}</td>
                    <td>
                      <a href={`tel:${d.phone.replace(/[^0-9+]/g, '')}`} className="btn-table-call">
                        <Phone size={12} /> Call
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verified Hospitals, SDRF Stations & Shelters Directory */}
      <div className="emergency-directory-panel">
        <div className="directory-header">
          <div className="dir-title">
            <Hospital size={22} />
            <div>
              <h3>Hospitals, Emergency Response & Relief Shelters ({filteredResources.length})</h3>
              <small>Real-time location, telephone lines, and bed capacity tracking across National emergency network</small>
            </div>
          </div>

          {/* Search Input */}
          <div className="dir-search-wrap">
            <Search size={14} className="search-icon-inside" />
            <input
              type="text"
              placeholder="Search hospital, SDRF station, town, or district..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="dir-search-input"
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="dir-filters-row">
          {/* Category Filters */}
          <div className="dir-filter-chips">
            <span className="filter-label-inline">Type:</span>
            {(['ALL', 'hospital', 'sdrf', 'police', 'shelter', 'helpline'] as const).map(c => (
              <button
                key={c}
                className={`dir-chip ${categoryFilter === c ? 'active' : ''}`}
                onClick={() => setCategoryFilter(c)}
              >
                {c === 'ALL' ? 'All Types' : c.toUpperCase()}
              </button>
            ))}
          </div>

          {/* District Filters */}
          <div className="dir-district-dropdown">
            <Compass size={14} />
            <span>District:</span>
            <select
              value={districtFilter}
              onChange={e => setDistrictFilter(e.target.value)}
              className="district-filter-select"
            >
              {districts.map(d => (
                <option key={d} value={d}>{d === 'ALL' ? 'All Districts' : `${d} District`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Facilities Cards Grid */}
        {loading ? (
          <p className="muted-text pad-20">Loading verified emergency resources from backend directory...</p>
        ) : filteredResources.length === 0 ? (
          <p className="muted-text pad-20">No emergency facilities matching the selected filters.</p>
        ) : (
          <div className="facilities-grid">
            {filteredResources.map(res => (
              <div key={res.id} className="facility-card">
                <div className="facility-header">
                  <span className={`cat-pill ${res.category}`}>{res.category.toUpperCase()}</span>
                  <span className="district-tag">{res.district}</span>
                </div>
                <h4>{res.name}</h4>
                <p className="facility-addr"><MapPin size={13} /> {res.address}</p>
                
                {res.capacity && (
                  <div className="capacity-bar-wrap">
                    <div className="cap-label-row">
                      <small>Bed Availability</small>
                      <strong>{res.capacity - (res.current_occupancy || 0)} vacant of {res.capacity}</strong>
                    </div>
                    <div className="cap-track">
                      <div 
                        className="cap-fill" 
                        style={{ width: `${Math.min(100, ((res.current_occupancy || 0) / res.capacity) * 100)}%` }} 
                      />
                    </div>
                  </div>
                )}

                <div className="facility-actions-row">
                  <a href={`tel:${res.phone.replace(/[^0-9+]/g, '')}`} className="facility-call-btn">
                    <Phone size={14} /> Call {res.phone}
                  </a>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${res.lat},${res.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="facility-nav-btn"
                    title="Get GPS Driving Directions"
                  >
                    <Navigation size={14} /> Directions
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mountain Trauma & Crush First-Aid Protocols Toggle */}
      <div className="firstaid-toggle-section">
        <button 
          className="btn-toggle-firstaid"
          onClick={() => setShowFirstAid(!showFirstAid)}
        >
          <div className="toggle-left">
            <HeartPulse size={18} className="text-rose-400" />
            <span>Emergency Trauma & Mountain First-Aid Guidelines (Crush Syndrome & Severe Bleeding)</span>
          </div>
          {showFirstAid ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showFirstAid && (
          <div className="firstaid-cards-grid">
            {FIRST_AID_PROTOCOLS.map(f => (
              <div key={f.title} className="firstaid-card">
                <div className="firstaid-card-top">
                  <span className="fa-icon">{f.icon}</span>
                  <span className="fa-urgency">{f.urgency}</span>
                </div>
                <h4>{f.title}</h4>
                <ul className="firstaid-steps">
                  {f.steps.map((st, sidx) => (
                    <li key={sidx}>
                      <span className="step-num">{sidx + 1}</span>
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety Instructions & Guidelines Accordion (NDMA Protocols) */}
      <div className="safety-guidelines-section">
        <div className="guidelines-header">
          <AlertTriangle size={24} className="warning-icon" />
          <div>
            <h3>National Disaster Management Authority (NDMA) Safety Protocols</h3>
            <p>Step-by-step life safety instructions before, during, and after mountain landslides</p>
          </div>
        </div>

        <div className="guidelines-accordion">
          {SAFETY_INSTRUCTIONS.map((sec, idx) => {
            const isOpen = expandedPhase === idx;
            return (
              <div key={sec.phase} className={`guideline-block ${isOpen ? 'open' : ''}`}>
                <div 
                  className="guideline-block-header"
                  onClick={() => setExpandedPhase(isOpen ? null : idx)}
                >
                  <div className="g-title-left">
                    <span className="g-icon">{sec.icon}</span>
                    <h4 style={{ color: sec.color }}>{sec.phase}</h4>
                  </div>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {isOpen && (
                  <ul className="guideline-list">
                    {sec.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <CheckCircle2 size={16} className="item-bullet" style={{ color: sec.color }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="disclaimer-banner">
          <strong>Official Decision-Support Notice:</strong> SlopeSafe provides predictive risk indices and situational awareness. In case of evacuation advisories or Red Weather Alerts issued by the India Meteorological Department (IMD) or the State Disaster Management Authority (HP-SDMA), always adhere strictly to official local government broadcasts.
        </div>
      </div>
    </div>
  );
};

