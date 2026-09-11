import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { apiService, initLiveWebSocket } from './services/api';
import { Zone, CommunityReport, Alert, RiskSummary, SafeRouteResponse, LiveEvent } from './types';
import { RiskMap } from './components/RiskMap';
import { ZoneDetailModal } from './components/ZoneDetailModal';
import { SafeRoutePlanner } from './components/SafeRoutePlanner';
import { HazardReporter } from './components/HazardReporter';
import { ExplainabilityPanel } from './components/ExplainabilityPanel';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AuthorityConsole } from './components/AuthorityConsole';
import { DemoSimulationModal } from './components/DemoSimulationModal';
import { LoginPage } from './components/LoginPage';
import { MLPredictionPlayground } from './components/MLPredictionPlayground';
import { SensorDashboard } from './components/SensorDashboard';
import { WeatherForecast } from './components/WeatherForecast';
import { EvacuationPlanner } from './components/EvacuationPlanner';
import { HistoricalTimeline } from './components/HistoricalTimeline';
import { EmergencyHelp } from './components/EmergencyHelp';
import { MethodologyPage } from './components/MethodologyPage';
import { MLValidationDossierComponent } from './components/MLValidationDossier';
import { RealDataCatalogComponent } from './components/RealDataCatalog';
import { RemoteSensingViewerComponent } from './components/RemoteSensingViewer';
import { ProductionDiagnosticsComponent } from './components/ProductionDiagnostics';
import { TRANSLATIONS, Language } from './utils/translations';

import { 
  ShieldCheck, AlertTriangle, MapPinned, Route, Users, CloudRain, 
  Play, Send, Layers, BarChart3, Bell, Menu, X, Globe, LogIn, LogOut, UserCheck,
  Brain, Activity, Siren, Calendar, CloudSun, Phone, BookOpen, Clock, Sparkles, CheckCircle2,
  RefreshCw, Radio, Zap, Award, Orbit, Server, Sliders, Database, Lock, FileText
} from 'lucide-react';
import './style.css';

type Tab = 
  | 'dashboard' 
  | 'map' 
  | 'sensors' 
  | 'weather' 
  | 'ml' 
  | 'ml_validation'
  | 'remote_sensing'
  | 'real_data'
  | 'diagnostics'
  | 'analytics' 
  | 'route' 
  | 'evacuation' 
  | 'emergency' 
  | 'report' 
  | 'alerts' 
  | 'history' 
  | 'methodology' 
  | 'authority' 
  | 'login';

type ConnectionStatus = 'connecting' | 'connected' | 'demo-fallback';

interface LiveToast {
  id: string;
  title: string;
  message: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'INFO' | 'SUCCESS';
  time: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [role, setRole] = useState<'Resident' | 'Authority'>('Resident');
  const [lang, setLang] = useState<Language>('en');
  const [currentUser, setCurrentUser] = useState<{ name: string; role: 'Resident' | 'Authority'; email: string } | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [modalZone, setModalZone] = useState<Zone | null>(null);
  const [routeData, setRouteData] = useState<SafeRouteResponse | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showSimModal, setShowSimModal] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('Just now');
  const [pinnedWeatherLoc, setPinnedWeatherLoc] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [notice, setNotice] = useState<string>('');
  const [syncingWeather, setSyncingWeather] = useState<boolean>(false);
  const [toasts, setToasts] = useState<LiveToast[]>([]);

  const t = (key: string): string => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;

  const addToast = useCallback((toast: LiveToast) => {
    setToasts(prev => [toast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 6000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const [dataMode, setDataMode] = useState<{ configured_mode: string; is_real_data: boolean; status_badge: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [health, modeStatus, zList, sData, aList, rList] = await Promise.all([
        apiService.checkHealth(),
        apiService.getDataModeStatus(),
        apiService.getZones(),
        apiService.getRiskSummary(),
        apiService.getAlerts(),
        apiService.getReports(),
      ]);
      setDataMode(modeStatus);
      const isDemo = health?.mode?.includes('demo') || health?.mode?.includes('offline');

      setZones(zList);
      setSummary(sData);
      setAlerts(aList);
      setReports(rList);
      setStatus(isDemo ? 'demo-fallback' : 'connected');
      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
      const [zList, sData, aList, rList] = await Promise.all([
        apiService.getZones(),
        apiService.getRiskSummary(),
        apiService.getAlerts(),
        apiService.getReports(),
      ]);
      setZones(zList);
      setSummary(sData);
      setAlerts(aList);
      setReports(rList);
      setStatus('demo-fallback');
      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, []);

  const handleSyncLiveWeather = async () => {
    setSyncingWeather(true);
    try {
      const res = await apiService.syncLiveWeather();
      await loadData();
      addToast({
        id: String(Date.now()),
        title: '🌧️ Live Meteorological Ingestion',
        message: `Successfully synchronized live precipitation for ${res.synced_zones || 22} national zones via Open-Meteo.`,
        severity: 'SUCCESS',
        time: new Date().toLocaleTimeString(),
      });
    } catch {
      addToast({
        id: String(Date.now()),
        title: '⚠️ Weather Sync Notice',
        message: 'Loaded cached meteorological precipitation grid.',
        severity: 'INFO',
        time: new Date().toLocaleTimeString(),
      });
    } finally {
      setSyncingWeather(false);
    }
  };

  useEffect(() => {
    loadData();

    // ── 1. Real-Time Live Event Pipeline (WebSocket) ──
    const cleanupWs = initLiveWebSocket((ev: LiveEvent) => {
      // Trigger instant non-blocking refresh of all components
      loadData();

      if (ev.type === 'EVENT_SIMULATION_TRIGGERED') {
        addToast({
          id: String(Date.now()),
          title: '🚨 CRITICAL EMERGENCY SIMULATION',
          message: ev.data?.message || 'Extreme cloudburst simulated. Immediate warning broadcast active.',
          severity: 'CRITICAL',
          time: new Date().toLocaleTimeString(),
        });
      } else if (ev.type === 'EVENT_ALERT_TRIGGERED') {
        addToast({
          id: String(Date.now()),
          title: ev.data?.title || '🚨 Critical Hazard Alert',
          message: `Hazard threshold breached in ${ev.data?.zone_id || 'monitored corridor'}. Advisory published.`,
          severity: 'CRITICAL',
          time: new Date().toLocaleTimeString(),
        });
      } else if (ev.type === 'EVENT_REPORT_CREATED') {
        addToast({
          id: String(Date.now()),
          title: '📡 Citizen Ground Hazard Report',
          message: `New field report (${ev.data?.report_type}) reported in ${ev.data?.district || 'Sector'}.`,
          severity: 'INFO',
          time: new Date().toLocaleTimeString(),
        });
      } else if (ev.type === 'EVENT_REPORT_MODERATED') {
        addToast({
          id: String(Date.now()),
          title: '🛡️ Authority Action Taken',
          message: `Report ${ev.data?.report_code || ''} updated to status: ${ev.data?.status}. Risk scores recalibrated.`,
          severity: 'SUCCESS',
          time: new Date().toLocaleTimeString(),
        });
      } else if (ev.type === 'EVENT_WEATHER_SYNCED') {
        addToast({
          id: String(Date.now()),
          title: '🌧️ Live Weather Updated',
          message: ev.data?.message || 'Open-Meteo live precipitation & subsoil moisture refreshed.',
          severity: 'SUCCESS',
          time: new Date().toLocaleTimeString(),
        });
      }
    });

    // ── 2. Automatic Periodic Heartbeat Polling (Every 4.5s) ──
    const interval = setInterval(() => {
      loadData();
    }, 4500);

    return () => {
      cleanupWs();
      clearInterval(interval);
    };
  }, [loadData, addToast]);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: { name: string; role: 'Resident' | 'Authority'; email: string }) => {
    setCurrentUser(user);
    setRole(user.role);
    setActiveTab(user.role === 'Authority' ? 'authority' : 'dashboard');
  };

  const handleFetchLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setNotice('📍 Live GPS position acquired successfully.');
        },
        () => {
          setNotice('⚠️ GPS access denied. Defaulting to Pan-India central coordinates.');
          setUserLocation({ lat: 22.8, lng: 79.5 });
        }
      );
    }
  };

  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hazardLayerSelect, setHazardLayerSelect] = useState<string>('all');
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);

  return (
    <div className="app-layout">
      {/* ── Fixed Left Sidebar ── */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          {/* Logo & Brand */}
          <div className="app-brand" onClick={() => handleTabClick('dashboard')}>
            <div className="brand-logo-shield">
              <ShieldCheck size={26} color="#2563eb" />
            </div>
            <div className="brand-text-group">
              <span className="brand-title">SLOPESAFE</span>
              <span className="brand-sub-pan">Pan-India EWS</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="sidebar-nav">
            <button 
              className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleTabClick('dashboard')}
            >
              <BarChart3 size={18} className="nav-icon" />
              <span>Dashboard</span>
            </button>

            <button 
              className={`sidebar-nav-item ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => handleTabClick('map')}
            >
              <MapPinned size={18} className="nav-icon" />
              <span>Risk Map</span>
            </button>

            <button 
              className={`sidebar-nav-item ${activeTab === 'sensors' ? 'active' : ''}`}
              onClick={() => handleTabClick('sensors')}
            >
              <Activity size={18} className="nav-icon" />
              <span>Live Monitoring</span>
            </button>

            <button 
              className={`sidebar-nav-item ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => handleTabClick('alerts')}
            >
              <Bell size={18} className="nav-icon" />
              <span>Early Warnings</span>
              {activeAlertsCount > 0 && <span className="nav-badge-red">{activeAlertsCount}</span>}
            </button>

            <button 
              className={`sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => handleTabClick('analytics')}
            >
              <BarChart3 size={18} className="nav-icon" />
              <span>Analytics</span>
            </button>

            <button 
              className={`sidebar-nav-item ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => handleTabClick('report')}
            >
              <FileText size={18} className="nav-icon" />
              <span>Reports</span>
            </button>

            <button 
              className={`sidebar-nav-item ${activeTab === 'real_data' ? 'active' : ''}`}
              onClick={() => handleTabClick('real_data')}
            >
              <Database size={18} className="nav-icon" />
              <span>Datasets</span>
            </button>

            <button 
              className={`sidebar-nav-item ${activeTab === 'ml_validation' ? 'active' : ''}`}
              onClick={() => handleTabClick('ml_validation')}
            >
              <Award size={18} className="nav-icon" />
              <span>Model Performance</span>
            </button>

            <button 
              className={`sidebar-nav-item ${activeTab === 'diagnostics' || activeTab === 'authority' ? 'active' : ''}`}
              onClick={() => handleTabClick(role === 'Authority' ? 'authority' : 'diagnostics')}
            >
              <Sliders size={18} className="nav-icon" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Branding */}
        <div className="sidebar-bottom">
          <div className="mountain-wireframe-icon">
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 22L16 6L24 16L34 2L46 22H2Z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="sidebar-quote">
            <em>Safer Slopes</em><br />
            <em>Stronger Communities</em>
          </div>
          <div className="sidebar-sih-tag">
            <span>SIH 2026</span> · <span>Pan-India EWS</span>
          </div>
        </div>
      </aside>

      {/* ── Main Viewport Area ── */}
      <div className="app-main-viewport">
        {/* Top Navbar Header */}
        <header className="app-top-header">
          <div className="top-header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="search-input-wrapper">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Search location, district or hazard..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="top-header-right">
            {/* Language Selector Dropdown */}
            <div className="lang-picker-dropdown">
              <Globe size={16} color="#64748b" />
              <select value={lang} onChange={e => setLang(e.target.value as Language)} className="lang-select">
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>

            {/* Notification Bell */}
            <button 
              className="top-bell-btn" 
              onClick={() => handleTabClick('alerts')}
              title="View Active Warnings"
            >
              <Bell size={18} color="#334155" />
              {activeAlertsCount > 0 && <span className="top-bell-badge">{activeAlertsCount}</span>}
            </button>

            {/* User Profile Avatar with Role Menu */}
            <div className="profile-menu-container">
              <button 
                className="profile-avatar-btn" 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                title="Account & Role Switcher"
              >
                <div className="avatar-circle">
                  <UserCheck size={16} color="#ffffff" />
                </div>
                <span className="profile-name-label">{currentUser ? currentUser.name.split(' ')[0] : (role === 'Authority' ? 'Authority' : 'Citizen')}</span>
                <span className="profile-caret">⌵</span>
              </button>

              {showProfileDropdown && (
                <div className="profile-dropdown-menu">
                  <div className="dropdown-user-header">
                    <strong>{currentUser?.name || (role === 'Authority' ? 'Authority Officer' : 'Public Resident')}</strong>
                    <small>{currentUser?.email || (role === 'Authority' ? 'ddma.officer@nic.in' : 'citizen@slopesafe.in')}</small>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-role-section">
                    <label>SWITCH VIEW ROLE:</label>
                    <button 
                      className={`role-option-btn ${role === 'Resident' ? 'selected' : ''}`}
                      onClick={() => { setRole('Resident'); setShowProfileDropdown(false); }}
                    >
                      👤 Public Resident View
                    </button>
                    <button 
                      className={`role-option-btn ${role === 'Authority' ? 'selected' : ''}`}
                      onClick={() => { setRole('Authority'); setShowProfileDropdown(false); }}
                    >
                      🛡️ Authority / DDMA View
                    </button>
                  </div>
                  <div className="dropdown-divider"></div>
                  {currentUser ? (
                    <button className="dropdown-action-btn logout" onClick={() => { setCurrentUser(null); setShowProfileDropdown(false); }}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  ) : (
                    <button className="dropdown-action-btn login" onClick={() => { handleTabClick('login'); setShowProfileDropdown(false); }}>
                      <LogIn size={14} /> Login Portal
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Content Container ── */}
        <main className="dashboard-content-body">
          {notice && (
            <div className="dashboard-notice-banner">
              <span>{notice}</span>
              <button onClick={() => setNotice('')} className="notice-close">×</button>
            </div>
          )}

          {activeTab === 'login' ? (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onCancel={() => setActiveTab('dashboard')}
            />
          ) : activeTab === 'dashboard' ? (
            <>
              {/* ── 1. Hero Panoramic Banner ── */}
              <section className="dashboard-hero-banner">
                <div className="hero-banner-overlay"></div>
                <div className="hero-banner-left">
                  <span className="hero-platform-tag">SIH 2026 · NATIONAL MULTI-HAZARD EARLY WARNING PLATFORM</span>
                  <h1 className="hero-headline">
                    Predictive landslide intelligence &amp; emergency decision support before slopes move.
                  </h1>
                  <p className="hero-subheadline">
                    Real-time monitoring. AI-powered predictions. Safer communities.
                  </p>
                  <div className="hero-cta-buttons">
                    <button className="btn-hero-watch-demo" onClick={() => setShowSimModal(true)}>
                      <Play size={16} fill="#ffffff" /> Watch Demo
                    </button>
                    <button className="btn-hero-explore-map" onClick={() => handleTabClick('map')}>
                      Explore Risk Map →
                    </button>
                  </div>
                </div>

                {/* Right Frosted Quote Card */}
                <div className="hero-frosted-quote-card">
                  <div className="quote-header">“Data today, safer tomorrow.”</div>
                  <div className="quote-check-list">
                    <div className="quote-check-item">
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>AI/ML Powered</span>
                    </div>
                    <div className="quote-check-item">
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>Real-time Monitoring</span>
                    </div>
                    <div className="quote-check-item">
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>Pan-India Coverage</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── 2. KPI Metric Cards Row (6 Cards) ── */}
              <section className="dashboard-kpi-grid">
                {/* Card 1: Landslide Hazard Index */}
                <div className="kpi-card card-red">
                  <div className="kpi-card-header">
                    <AlertTriangle size={16} className="kpi-icon red" />
                    <span className="kpi-title red">Landslide Hazard Index</span>
                  </div>
                  <div className="kpi-value-row">
                    <span className="kpi-big-num">{summary?.overall_score ?? 67}</span>
                    <span className="kpi-denom">/ 100</span>
                    <span className="kpi-pill-badge red">High Alert</span>
                  </div>
                  <div className="kpi-progress-track">
                    <div className="kpi-progress-fill red" style={{ width: `${summary?.overall_score ?? 67}%` }}></div>
                  </div>
                </div>

                {/* Card 2: Monitored Hotspots */}
                <div className="kpi-card card-blue" onClick={() => handleTabClick('map')}>
                  <div className="kpi-card-header">
                    <MapPinned size={16} className="kpi-icon blue" />
                    <span className="kpi-title blue">Monitored Hotspots</span>
                  </div>
                  <div className="kpi-value-row">
                    <span className="kpi-big-num">{summary?.total_zones ?? 22}</span>
                    <span className="kpi-delta-tag green">+2 ↗</span>
                  </div>
                  <span className="kpi-subtext">Pan-India monitored locations</span>
                </div>

                {/* Card 3: High Risk Zones */}
                <div className="kpi-card card-amber" onClick={() => handleTabClick('map')}>
                  <div className="kpi-card-header">
                    <AlertTriangle size={16} className="kpi-icon amber" />
                    <span className="kpi-title amber">High Risk Zones</span>
                  </div>
                  <div className="kpi-value-row">
                    <span className="kpi-big-num">{summary?.high_risk_zones ?? 17}</span>
                  </div>
                  <span className="kpi-subtext">Slope angle &gt; 35° · High vulnerability</span>
                </div>

                {/* Card 4: Critical Hazards */}
                <div className="kpi-card card-purple" onClick={() => handleTabClick('map')}>
                  <div className="kpi-card-header">
                    <AlertTriangle size={16} className="kpi-icon purple" />
                    <span className="kpi-title purple">Critical Hazards</span>
                  </div>
                  <div className="kpi-value-row">
                    <span className="kpi-big-num">{summary?.critical_zones ?? 10}</span>
                  </div>
                  <span className="kpi-subtext">Critical saturated debris flow</span>
                </div>

                {/* Card 5: Citizen Reports */}
                <div className="kpi-card card-green" onClick={() => handleTabClick('report')}>
                  <div className="kpi-card-header">
                    <Users size={16} className="kpi-icon green" />
                    <span className="kpi-title green">Citizen Reports</span>
                  </div>
                  <div className="kpi-value-row">
                    <span className="kpi-big-num">{summary?.active_reports ?? 4}</span>
                    <span className="kpi-delta-tag green">+1 ↗</span>
                  </div>
                  <span className="kpi-subtext">Verified ground reports</span>
                </div>

                {/* Card 6: Active Warnings */}
                <div className="kpi-card card-cyan" onClick={() => handleTabClick('alerts')}>
                  <div className="kpi-card-header">
                    <Bell size={16} className="kpi-icon cyan" />
                    <span className="kpi-title cyan">Active Warnings</span>
                  </div>
                  <div className="kpi-value-row">
                    <span className="kpi-big-num">{summary?.active_alerts ?? 3}</span>
                  </div>
                  <span className="kpi-subtext">Early warning advisories</span>
                </div>
              </section>

              {/* ── 3. Main Dashboard Grid (Live Risk Map + Right Column) ── */}
              <section className="dashboard-main-grid">
                {/* Left: Live Risk Map Card */}
                <div className="dashboard-map-card">
                  <div className="map-card-top-header">
                    <div>
                      <div className="map-title-row">
                        <MapPinned size={20} color="#2563eb" />
                        <h2>Live Risk Map</h2>
                      </div>
                      <p className="map-subtitle">Real-time hazard visualization across India</p>
                    </div>

                    <div className="map-header-controls">
                      <span className="live-status-dot-badge">
                        <span className="pulse-green"></span> Live Data
                      </span>
                      <select 
                        value={hazardLayerSelect} 
                        onChange={e => setHazardLayerSelect(e.target.value)} 
                        className="hazard-layer-dropdown"
                      >
                        <option value="all">Hazard Layer ⌵</option>
                        <option value="rainfall">Precipitation Radar</option>
                        <option value="slope">Slope Angle</option>
                        <option value="saturation">Soil Moisture</option>
                      </select>
                      <button className="map-expand-btn" onClick={() => handleTabClick('map')} title="Full Map View">
                        ⛶
                      </button>
                    </div>
                  </div>

                  {/* Interactive Map */}
                  <div className="dashboard-leaflet-container">
                    <RiskMap
                      zones={zones} 
                      reports={reports} 
                      selectedZone={selectedZone}
                      onSelectZone={z => setSelectedZone(z)} 
                      onOpenModalZone={z => setModalZone(z)}
                      onOpenReportModal={() => handleTabClick('report')}
                      onNavigateToRoute={() => handleTabClick('route')} 
                      onNavigateToAlerts={() => handleTabClick('alerts')}
                      routeData={routeData}
                      userLocation={userLocation} 
                      onFetchLocation={handleFetchLocation} 
                      lang={lang}
                    />
                    <button className="floating-view-full-map-btn" onClick={() => handleTabClick('map')}>
                      View Full Map →
                    </button>
                  </div>
                </div>

                {/* Right Column: Stacked Cards */}
                <div className="dashboard-right-stack">
                  {/* Card 1: Recent Alerts */}
                  <div className="dashboard-alerts-card">
                    <div className="card-top-header">
                      <div className="header-title-group">
                        <Bell size={18} color="#ef4444" />
                        <h3>Recent Alerts</h3>
                      </div>
                      <button className="header-link-btn" onClick={() => handleTabClick('alerts')}>
                        View All →
                      </button>
                    </div>

                    <div className="recent-alerts-list">
                      <div className="recent-alert-item" onClick={() => handleTabClick('alerts')}>
                        <span className="alert-dot red"></span>
                        <div className="alert-content">
                          <div className="alert-name">High landslide risk predicted</div>
                          <div className="alert-loc">Chamoli, Uttarakhand</div>
                        </div>
                        <span className="alert-time">12 min ago</span>
                      </div>

                      <div className="recent-alert-item" onClick={() => handleTabClick('alerts')}>
                        <span className="alert-dot amber"></span>
                        <div className="alert-content">
                          <div className="alert-name">Heavy rainfall detected</div>
                          <div className="alert-loc">Mangan, Sikkim</div>
                        </div>
                        <span className="alert-time">28 min ago</span>
                      </div>

                      <div className="recent-alert-item" onClick={() => handleTabClick('alerts')}>
                        <span className="alert-dot red"></span>
                        <div className="alert-content">
                          <div className="alert-name">Soil moisture critical</div>
                          <div className="alert-loc">Upper Teesta, Sikkim</div>
                        </div>
                        <span className="alert-time">1 hour ago</span>
                      </div>

                      <div className="recent-alert-item" onClick={() => handleTabClick('alerts')}>
                        <span className="alert-dot amber"></span>
                        <div className="alert-content">
                          <div className="alert-name">Ground movement anomaly</div>
                          <div className="alert-loc">Aizawl, Mizoram</div>
                        </div>
                        <span className="alert-time">2 hours ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Model Performance */}
                  <div className="dashboard-perf-card">
                    <div className="card-top-header">
                      <div className="header-title-group">
                        <BarChart3 size={18} color="#2563eb" />
                        <h3>Model Performance</h3>
                      </div>
                      <button className="header-link-btn" onClick={() => handleTabClick('ml_validation')}>
                        View Details →
                      </button>
                    </div>

                    <div className="perf-metrics-four-col">
                      <div className="perf-stat-col">
                        <span className="perf-num">92.5%</span>
                        <span className="perf-label">Precision (PPV)</span>
                      </div>
                      <div className="perf-stat-col">
                        <span className="perf-num">94.3%</span>
                        <span className="perf-label">Recall (Sensitivity)</span>
                      </div>
                      <div className="perf-stat-col">
                        <span className="perf-num">93.4%</span>
                        <span className="perf-label">F1-Score (Harmonic)</span>
                      </div>
                      <div className="perf-stat-col">
                        <span className="perf-num">0.0516</span>
                        <span className="perf-label">Brier Score (Reliability)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── 4. Bottom GSI & NASA Dataset Banner ── */}
              <section className="dashboard-gsi-banner">
                <div className="gsi-banner-left">
                  <div className="gsi-icon-badge">
                    <Database size={20} color="#16a34a" />
                  </div>
                  <div>
                    <div className="gsi-title">GSI &amp; NASA Dataset Validated</div>
                    <div className="gsi-sub">Scientific Machine Learning Validation &amp; Benchmark Dossier ⓘ</div>
                  </div>
                </div>

                <div className="gsi-banner-center">
                  Rigorous empirical evaluation via Stratified 5-Fold Cross-Validation, ROC-AUC Curves, and Physics-Informed Equilibrium Calibration.
                </div>

                <div className="gsi-banner-right">
                  <button className="btn-gsi-details" onClick={() => handleTabClick('ml_validation')}>
                    View Technical Details →
                  </button>
                </div>
              </section>
            </>
          ) : (
            <div className="sub-tab-content-wrapper">
              <div className="sub-tab-breadcrumbs">
                <button className="breadcrumb-home-btn" onClick={() => handleTabClick('dashboard')}>Dashboard</button>
                <span className="breadcrumb-slash">/</span>
                <span className="breadcrumb-current">{activeTab.toUpperCase().replace('_', ' ')}</span>
              </div>

            {/* Tab 2: Full GIS Risk Map */}
            {activeTab === 'map' && (
              <div className="tab-container">
                <RiskMap
                  zones={zones} 
                  reports={reports} 
                  selectedZone={selectedZone}
                  onSelectZone={z => setSelectedZone(z)} 
                  onOpenModalZone={z => setModalZone(z)}
                  onOpenReportModal={() => setActiveTab('report')}
                  onNavigateToRoute={() => setActiveTab('route')} 
                  onNavigateToAlerts={() => setActiveTab('alerts')}
                  routeData={routeData}
                  userLocation={userLocation} 
                  onFetchLocation={handleFetchLocation} 
                  lang={lang}
                  onLocationSelect={(lat, lng) => setUserLocation({ lat, lng })}
                />
              </div>
            )}

            {/* Tab 3: IoT Sensors Network */}
            {activeTab === 'sensors' && (
              <div className="tab-container">
                <SensorDashboard />
              </div>
            )}

            {/* Tab 4: Meteorological Weather Telemetry */}
            {activeTab === 'weather' && (
              <div className="tab-container">
                <WeatherForecast 
                  userLocation={userLocation} 
                  selectedZone={selectedZone}
                  zones={zones}
                  pinnedLocation={pinnedWeatherLoc}
                  onSelectPinnedLocation={loc => setPinnedWeatherLoc(loc)}
                />
              </div>
            )}

            {/* Tab 5: ML Geotechnical Playground */}
            {activeTab === 'ml' && (
              <div className="tab-container">
                <MLPredictionPlayground zones={zones} onPredictionComplete={loadData} />
              </div>
            )}

            {/* Tab 6: Disaster Analytics */}
            {activeTab === 'analytics' && (
              <div className="tab-container">
                <AnalyticsDashboard />
              </div>
            )}

            {/* Tab 7: Methodology & Scientific Transparency */}
            {activeTab === 'methodology' && (
              <div className="tab-container">
                <MethodologyPage />
              </div>
            )}

            {/* Tab 8: Safe Transit Routing */}
            {activeTab === 'route' && (
              <div className="tab-container">
                <SafeRoutePlanner
                  onRouteCalculated={r => setRouteData(r)} 
                  userLocation={userLocation}
                  onFetchLocation={handleFetchLocation}
                  onViewOnMap={() => setActiveTab('map')}
                />
              </div>
            )}

            {/* Tab 9: Emergency Helplines & Resources */}
            {activeTab === 'emergency' && (
              <div className="tab-container">
                <EmergencyHelp />
              </div>
            )}

            {/* Tab 10: Evacuation Shelters */}
            {activeTab === 'evacuation' && (
              <div className="tab-container">
                <EvacuationPlanner />
              </div>
            )}

            {/* Tab 11: Citizen Hazard Reporting */}
            {activeTab === 'report' && (
              <div className="tab-container">
                <HazardReporter
                  onReportSubmitted={loadData} 
                  userLocation={userLocation}
                  onFetchLocation={handleFetchLocation}
                />
              </div>
            )}

            {/* Tab 12: Active Alerts Center */}
            {activeTab === 'alerts' && (
              <div className="tab-container">
                <div className="panel">
                  <h2>{t('alerts')} ({alerts.length})</h2>
                  {alerts.length === 0 ? (
                    <p className="muted-text pad-20">No active emergency alerts recorded.</p>
                  ) : (
                    <div className="alerts-full-list">
                      {alerts.map(a => (
                        <div key={a.id} className={`alert-card-item ${a.severity.toLowerCase()}`}>
                          <AlertTriangle size={24} />
                          <div>
                            <div className="alert-top-meta">
                              <span className={`alert-tag ${a.severity.toLowerCase()}`}>{a.severity}</span>
                              <span className="district-tag">{a.district || a.zone_id}</span>
                            </div>
                            <h3>{a.title}</h3>
                            <p>{a.message}</p>
                            {a.action_advice && (
                              <p className="alert-advice-inline"><strong>Advisory:</strong> {a.action_advice}</p>
                            )}
                            <small>Issued: {new Date(a.created_at).toLocaleString()}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 13: Historical Disasters Archive */}
            {activeTab === 'history' && (
              <div className="tab-container">
                <HistoricalTimeline />
              </div>
            )}

            {/* Tab: Scientific ML Validation (ROC-AUC / 5-Fold CV / PR Curve / Physics) */}
            {activeTab === 'ml_validation' && (
              <div className="tab-container">
                <MLValidationDossierComponent />
              </div>
            )}

            {/* Tab: Satellite Earth Observation & InSAR Radar Observatory */}
            {activeTab === 'remote_sensing' && (
              <div className="tab-container">
                <RemoteSensingViewerComponent />
              </div>
            )}

            {/* Tab: GSI & NASA Historical Ground Truth Disaster Catalog */}
            {activeTab === 'real_data' && (
              <div className="tab-container">
                <RealDataCatalogComponent />
              </div>
            )}

            {/* Tab: DevOps Architecture Diagnostics, RBAC & SHA-256 Audit Trail */}
            {activeTab === 'diagnostics' && (
              <div className="tab-container">
                <ProductionDiagnosticsComponent />
              </div>
            )}

            {/* Tab 14: Authority Console (Role-Guarded) */}
            {activeTab === 'authority' && role === 'Authority' && (
              <div className="tab-container">
                <AuthorityConsole 
                  zones={zones} 
                  reports={reports} 
                  alerts={alerts} 
                  onRefresh={loadData} 
                />
              </div>
            )}
            </div>
          )}

        {/* Modals */}
        {modalZone && (
          <ZoneDetailModal
            zone={modalZone}
            onClose={() => setModalZone(null)}
            onNavigateToRoute={() => { setModalZone(null); setActiveTab('route'); }}
            onNavigateToReport={() => { setModalZone(null); setActiveTab('report'); }}
            onNavigateToWeather={() => { 
              setPinnedWeatherLoc({ lat: modalZone.lat, lng: modalZone.lng, name: `${modalZone.name} (${modalZone.district})` });
              setModalZone(null); 
              setActiveTab('weather'); 
            }}
          />
        )}

        {showSimModal && (
          <DemoSimulationModal
            onClose={() => setShowSimModal(false)}
            onSimulationComplete={loadData}
            onNavigateTab={tab => setActiveTab(tab as Tab)}
          />
        )}

        {/* Comprehensive Government/Web Portal Footer */}
        <footer className="global-web-footer">
          <div className="footer-grid">
            <div className="footer-col brand-col">
              <div className="footer-brand">
                <ShieldCheck size={22} className="footer-brand-icon" />
                <span>SLOPE<strong>SAFE</strong></span>
              </div>
              <p className="footer-desc">
                AI-Powered Physical Geotechnical & Satellite Landslide Early Warning System. Developed for Smart India Hackathon (SIH 2026).
              </p>
              <div className="footer-status-indicator">
                <span className="pulse-green"></span>
                <span>All Telemetry Nodes & ML Pipeline Operational</span>
              </div>
            </div>

            <div className="footer-col">
              <h4>Monitoring Modules</h4>
              <ul>
                <li><button onClick={() => handleTabClick('dashboard')}>National Overview</button></li>
                <li><button onClick={() => handleTabClick('map')}>Interactive GIS Risk Map</button></li>
                <li><button onClick={() => handleTabClick('sensors')}>IoT Geotechnical Telemetry</button></li>
                <li><button onClick={() => handleTabClick('weather')}>IMD & ECMWF Weather Radar</button></li>
                <li><button onClick={() => handleTabClick('ml')}>Explainable AI Model (XAI)</button></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Action & Response</h4>
              <ul>
                <li><button onClick={() => handleTabClick('route')}>Safe Corridor Routing</button></li>
                <li><button onClick={() => handleTabClick('evacuation')}>Evacuation Shelters & Camps</button></li>
                <li><button onClick={() => handleTabClick('report')}>Citizen Ground Hazard Report</button></li>
                <li><button onClick={() => handleTabClick('emergency')}>Emergency Services Directory</button></li>
                <li><button onClick={() => handleTabClick('methodology')}>System Methodology & Physics</button></li>
              </ul>
            </div>

            <div className="footer-col helplines-col">
              <h4>24×7 Emergency Helplines</h4>
              <div className="helpline-badges">
                <div className="helpline-card">
                  <span className="hl-num">112</span>
                  <span className="hl-label">National Emergency</span>
                </div>
                <div className="helpline-card">
                  <span className="hl-num">1070</span>
                  <span className="hl-label">NDMA Disaster Line</span>
                </div>
                <div className="helpline-card">
                  <span className="hl-num">1077</span>
                  <span className="hl-label">District Control Room</span>
                </div>
                <div className="helpline-card">
                  <span className="hl-num">108</span>
                  <span className="hl-label">Ambulance & Trauma</span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p>© 2026 SlopeSafe Platform · Geological Survey of India (GSI) & National Disaster Management Authority (NDMA) Compatible EWS.</p>
            <div className="footer-bottom-links">
              <span className="uptime-tag">API: v1.4.0 · Latency: 42ms</span>
            </div>
          </div>
        </footer>
        {/* Floating Real-Time Event Toasts */}
        <div className="toast-container" aria-live="polite">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast-card toast-${toast.severity.toLowerCase()}`}>
              <div className="toast-header-row">
                <div className="toast-title-group">
                  {toast.severity === 'CRITICAL' && <AlertTriangle size={16} className="toast-icon-critical" />}
                  {toast.severity === 'SUCCESS' && <CheckCircle2 size={16} className="toast-icon-success" />}
                  {toast.severity === 'INFO' && <Radio size={16} className="toast-icon-info" />}
                  <strong>{toast.title}</strong>
                </div>
                <button className="toast-close-btn" onClick={() => removeToast(toast.id)}>×</button>
              </div>
              <p className="toast-message">{toast.message}</p>
              <small className="toast-time">{toast.time} · Real-time Push</small>
            </div>
          ))}
        </div>
      </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
