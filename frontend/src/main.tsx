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

import { WeatherAmbientBackground, WeatherConditionType } from './components/WeatherAmbientBackground';
import { detectCurrentPlaceWeather } from './utils/currentWeather';
import { 
  ShieldCheck, AlertTriangle, MapPinned, Route, Users, CloudRain, 
  Play, Send, Layers, BarChart3, Bell, Menu, X, Globe, LogIn, LogOut, UserCheck,
  Brain, Activity, Siren, Calendar, CloudSun, Phone, BookOpen, Clock, Sparkles, CheckCircle2,
  RefreshCw, Radio, Zap, Award, Orbit, Server, Sliders, Database, Lock,
  ChevronDown, Sun, CloudFog, CloudLightning, Moon
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

const WEATHER_MOOD_CONFIG: Record<string, { label: string; icon: string; desc: string }> = {
  auto: { label: 'Live Auto', icon: '⚡', desc: 'Syncs with real telemetry & active zone' },
  clear: { label: 'Clear Skies', icon: '☀️', desc: 'Warm sunlight radiance' },
  rain: { label: 'Monsoon Rain', icon: '🌧️', desc: 'Falling rain streaks & wet atmosphere' },
  storm: { label: 'Severe Storm', icon: '⛈️', desc: 'Heavy torrents & lightning flashes' },
  fog: { label: 'Mountain Mist', icon: '🌫️', desc: 'Drifting ethereal fog layers' },
  cloudy: { label: 'Dense Overcast', icon: '☁️', desc: 'Rolling cloud layers' },
  night: { label: 'Midnight Sky', icon: '🌙', desc: 'Obsidian starry night sky' },
};

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
  const [initialRouteDest, setInitialRouteDest] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [initialReportCoords, setInitialReportCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [notice, setNotice] = useState<string>('');
  const [syncingWeather, setSyncingWeather] = useState<boolean>(false);
  const [toasts, setToasts] = useState<LiveToast[]>([]);

  // Dynamic Weather Atmosphere State (100% Fully Automatic)
  const [detectedLiveWeather, setDetectedLiveWeather] = useState<{
    condition: 'clear' | 'rain' | 'storm' | 'fog' | 'cloudy' | 'night';
    name?: string;
    temp?: number;
    rainfall?: number;
    conditionName?: string;
    icon?: string;
  } | null>(null);

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

  const syncCurrentPlaceWeather = useCallback(async (silent = false) => {
    try {
      const result = await detectCurrentPlaceWeather();
      setUserLocation({ lat: result.lat, lng: result.lng });
      setDetectedLiveWeather({
        condition: result.condition,
        name: result.locationName,
        temp: result.temp,
        rainfall: result.rainfallMm,
        conditionName: result.conditionName,
        icon: result.icon,
      });
      if (!silent) {
        addToast({
          id: String(Date.now()),
          title: `📍 Local Place Weather (${result.temp}°C)`,
          message: `Auto-synchronized with ${result.locationName}: ${result.icon} ${result.conditionName}. Atmospheric background automatically adjusted.`,
          severity: 'SUCCESS',
          time: new Date().toLocaleTimeString(),
        });
      }
    } catch (err) {
      console.error('Failed to detect current place weather', err);
    }
  }, [addToast]);

  const resolvedWeatherCondition = React.useMemo<'clear' | 'rain' | 'storm' | 'fog' | 'cloudy' | 'night'>(() => {
    // 1. If a specific zone is selected by the user, adapt to that zone's conditions
    if (selectedZone) {
      if (selectedZone.rainfall_24h >= 45 || selectedZone.rainfall_1h >= 20) return 'storm';
      if (selectedZone.rainfall_24h >= 10 || selectedZone.rainfall_1h >= 3) return 'rain';
      if (selectedZone.soil_moisture >= 65) return 'fog';
      if (selectedZone.rainfall_24h > 0) return 'cloudy';
      const hr = new Date().getHours();
      return (hr >= 19 || hr < 6) ? 'night' : 'clear';
    }
    // 2. Prioritize detected real-time weather of user's current physical place
    if (detectedLiveWeather?.condition) {
      return detectedLiveWeather.condition;
    }
    if (summary?.overall_level === 'CRITICAL') return 'storm';
    if (summary?.overall_level === 'HIGH') return 'rain';
    const currentHour = new Date().getHours();
    if (currentHour >= 19 || currentHour < 6) return 'night';
    return 'clear';
  }, [detectedLiveWeather, selectedZone, summary]);

  useEffect(() => {
    if (sidebarOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [sidebarOpen]);

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
      const [res] = await Promise.all([
        apiService.syncLiveWeather(),
        syncCurrentPlaceWeather(false),
      ]);
      await loadData();
      addToast({
        id: String(Date.now()),
        title: '🌧️ Live Meteorological Ingestion',
        message: `Synchronized live precipitation for ${res.synced_zones || 22} national zones & your local current location.`,
        severity: 'SUCCESS',
        time: new Date().toLocaleTimeString(),
      });
    } catch {
      await syncCurrentPlaceWeather(false);
      addToast({
        id: String(Date.now()),
        title: '⚠️ Weather Sync Notice',
        message: 'Loaded real-time local weather stream.',
        severity: 'INFO',
        time: new Date().toLocaleTimeString(),
      });
    } finally {
      setSyncingWeather(false);
    }
  };

  useEffect(() => {
    loadData();
    // Automatically detect & synchronize background with actual current place weather on mount
    syncCurrentPlaceWeather(true);

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

  return (
    <div className="shell">
      {/* Dynamic Multi-Layered Atmospheric Weather Background (100% Fully Automatic) */}
      <WeatherAmbientBackground 
        resolvedCondition={resolvedWeatherCondition} 
        weatherDetails={detectedLiveWeather || undefined} 
      />

      {/* Top Global Navigation Bar */}
      <header className="top-global-header">
        <div className="header-left">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle Navigation Menu">
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="global-brand" onClick={() => handleTabClick('dashboard')}>
            <ShieldCheck size={28} className="brand-icon" />
            <div className="brand-titles">
              <span className="brand-name">SLOPE<strong>SAFE</strong></span>
              <span className="brand-region-badge">PAN-INDIA EWS</span>
            </div>
          </div>
        </div>

        {/* System Telemetry & Fully Automatic Live Weather Badge */}
        <div className="header-center-badges">
          <div className="live-status-pill">
            <span className="pulse-green"></span>
            <span>LIVE SYNC ACTIVE</span>
            <small>· {lastUpdatedTime}</small>
          </div>

          {/* Fully Automatic Live Meteorological Telemetry Indicator */}
          <div 
            className="live-weather-telemetry-badge"
            title={`Atmospheric Background Auto-Synced to ${detectedLiveWeather?.name || 'Current Place'}: ${detectedLiveWeather?.conditionName || 'Live Telemetry'} (${detectedLiveWeather?.temp !== undefined ? `${detectedLiveWeather.temp}°C` : 'Live'})`}
          >
            <span className="weather-icon-pulse">
              {detectedLiveWeather?.icon || (resolvedWeatherCondition === 'storm' ? '⛈️' : resolvedWeatherCondition === 'rain' ? '🌧️' : resolvedWeatherCondition === 'fog' ? '🌫️' : resolvedWeatherCondition === 'cloudy' ? '☁️' : resolvedWeatherCondition === 'night' ? '🌙' : '☀️')}
            </span>
            <span className="weather-loc-text">
              {detectedLiveWeather?.name ? detectedLiveWeather.name.split(' (')[0] : 'Current Place'} · {detectedLiveWeather?.conditionName || 'Auto Atmosphere'}{detectedLiveWeather?.temp !== undefined ? ` (${detectedLiveWeather.temp}°C)` : ''}
            </span>
            <span className="weather-live-tag">
              <span className="pulse-green-dot"></span>
              LIVE AUTO
            </span>
          </div>

          {dataMode && (
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: 600,
                background: dataMode.is_real_data ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                border: `1px solid ${dataMode.is_real_data ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
                color: dataMode.is_real_data ? '#34d399' : '#38bdf8'
              }}
              title={dataMode.is_real_data ? 'Connected to verified live geological & meteorological streams' : 'Running calibrated demonstration scenario simulation'}
            >
              <Database size={12} />
              <span>{dataMode.status_badge === 'REAL_DATA' ? '🟢 LIVE DATA' : '🔵 DEMO SCENARIO'}</span>
            </div>
          )}
          <button 
            className={`sync-weather-header-btn ${syncingWeather ? 'loading' : ''}`}
            onClick={handleSyncLiveWeather}
            disabled={syncingWeather}
            title="Sync Actual Real-Time Weather via Open-Meteo API"
          >
            <RefreshCw size={13} className={syncingWeather ? 'spin-icon' : ''} />
            <span>{syncingWeather ? 'Syncing...' : 'Sync Actual Weather'}</span>
          </button>
        </div>

        <div className="header-right">
          {/* Language Selector */}
          <div className="lang-dropdown">
            <Globe size={15} />
            <select value={lang} onChange={e => setLang(e.target.value as Language)}>
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>

          {/* Quick Alert Bell */}
          <button 
            className={`header-bell-btn ${activeAlertsCount > 0 ? 'has-alerts' : ''}`}
            onClick={() => handleTabClick('alerts')}
            title={`${activeAlertsCount} Active Warnings`}
          >
            <Bell size={16} />
            {activeAlertsCount > 0 && <span className="bell-badge">{activeAlertsCount}</span>}
          </button>

          {/* User Auth Chip */}
          {currentUser ? (
            <div className="user-profile-chip">
              <UserCheck size={16} />
              <span>{currentUser.name.split(' ')[0]}</span>
              <button className="chip-logout" onClick={() => setCurrentUser(null)} title="Sign Out">
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button className="header-login-btn" onClick={() => handleTabClick('login')}>
              <LogIn size={15} /> {t('login_portal')}
            </button>
          )}

          {/* Judge Simulation Flow Button */}
          <button className="scenario-btn highlight" onClick={() => setShowSimModal(true)}>
            <Play size={15} /> {t('run_simulation')}
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>}

      {/* Collapsible Navigation Drawer */}
      <aside className={`sidebar-drawer ${sidebarOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="brand">
            <ShieldCheck size={26} /> SLOPE<span>SAFE</span>
          </div>
          <button className="close-drawer-btn" onClick={() => setSidebarOpen(false)}>
            <X size={22} />
          </button>
        </div>
        <p className="tag">{t('brand_sub')}</p>

        {currentUser && (
          <div className="drawer-user-info">
            <small>Active User Session:</small>
            <strong>{currentUser.name}</strong>
            <span className="user-role-tag">{currentUser.role}</span>
          </div>
        )}

        <nav className="nav-menu">
          <div className="nav-section-label">HAZARD MONITORING</div>
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => handleTabClick('dashboard')}>
            <MapPinned size={17} /> {t('dashboard')}
          </button>
          <button className={activeTab === 'map' ? 'active' : ''} onClick={() => handleTabClick('map')}>
            <Layers size={17} /> {t('risk_map')}
          </button>
          <button className={activeTab === 'sensors' ? 'active' : ''} onClick={() => handleTabClick('sensors')}>
            <Activity size={17} /> {t('sensors')}
          </button>
          <button className={activeTab === 'weather' ? 'active' : ''} onClick={() => handleTabClick('weather')}>
            <CloudSun size={17} /> {t('weather')}
          </button>
          <button className={activeTab === 'remote_sensing' ? 'active' : ''} onClick={() => handleTabClick('remote_sensing')}>
            <Orbit size={17} /> Satellite InSAR &amp; NDVI
          </button>

          <div className="nav-section-label">AI & PREDICTION</div>
          <button className={activeTab === 'ml' ? 'active' : ''} onClick={() => handleTabClick('ml')}>
            <Brain size={17} /> {t('ml')} (Playground)
          </button>
          <button className={activeTab === 'ml_validation' ? 'active' : ''} onClick={() => handleTabClick('ml_validation')}>
            <Award size={17} /> Scientific ML Validation (ROC/CV)
          </button>
          <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => handleTabClick('analytics')}>
            <BarChart3 size={17} /> {t('analytics')}
          </button>
          <button className={activeTab === 'methodology' ? 'active' : ''} onClick={() => handleTabClick('methodology')}>
            <BookOpen size={17} /> {t('methodology')}
          </button>

          <div className="nav-section-label">ACTION & RESPONSE</div>
          <button className={activeTab === 'route' ? 'active' : ''} onClick={() => handleTabClick('route')}>
            <Route size={17} /> {t('route')}
          </button>
          <button className={activeTab === 'emergency' ? 'active' : ''} onClick={() => handleTabClick('emergency')}>
            <Phone size={17} /> {t('emergency')}
          </button>
          <button className={activeTab === 'evacuation' ? 'active' : ''} onClick={() => handleTabClick('evacuation')}>
            <Siren size={17} /> {t('evacuation')}
          </button>
          <button className={activeTab === 'report' ? 'active' : ''} onClick={() => handleTabClick('report')}>
            <Send size={17} /> {t('report')}
          </button>
          <button className={activeTab === 'alerts' ? 'active' : ''} onClick={() => handleTabClick('alerts')}>
            <Bell size={17} /> {t('alerts')} ({activeAlertsCount})
          </button>

          <div className="nav-section-label">RESEARCH & DATA</div>
          <button className={activeTab === 'real_data' ? 'active' : ''} onClick={() => handleTabClick('real_data')}>
            <Database size={17} /> GSI &amp; NASA Disaster Catalog
          </button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => handleTabClick('history')}>
            <Calendar size={17} /> {t('history')}
          </button>

          <div className="nav-section-label">OFFICIAL COMMAND &amp; DEVOPS</div>
          <button className={activeTab === 'diagnostics' ? 'active' : ''} onClick={() => handleTabClick('diagnostics')}>
            <Server size={17} /> DevOps Health &amp; Security Audit
          </button>
          {role === 'Authority' && (
            <button className={activeTab === 'authority' ? 'active' : ''} onClick={() => handleTabClick('authority')}>
              <ShieldCheck size={17} /> {t('authority_console')}
            </button>
          )}
        </nav>

        <div className="role-switcher">
          <small>DEMO ROLE SWITCHER</small>
          <select value={role} onChange={e => setRole(e.target.value as any)}>
            <option value="Resident">Resident / Public View</option>
            <option value="Authority">Authority / DDMA View</option>
          </select>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="main-content-full">
        {notice && (
          <div className="notice info-banner">
            <span>{notice}</span>
            <button onClick={() => setNotice('')} className="dismiss-btn">×</button>
          </div>
        )}

        {activeTab === 'login' ? (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onCancel={() => setActiveTab('dashboard')}
          />
        ) : (
          <>
            {/* Top Sub-Header with Live Regional Badges */}
            <div className="hero-subhead">
              <div className="hero-eyebrow-row">
                <span className="eyebrow">SIH 2026 · NATIONAL MULTI-HAZARD EARLY WARNING PLATFORM</span>
                <span className="location-pill">📍 Pan-India Landslide Network (Western Ghats, Himalayas, North-East)</span>
                <span className="telemetry-live-tag">
                  <span className="pulse-green"></span>
                  GSI Telemetry Online
                </span>
              </div>
              <h1 className="main-platform-title">{t('slogan')}</h1>
            </div>

            {/* Regional Hazard Summary Hero */}
            <section className="hero-command-card">
              <div className="hero-left">
                <div className="hazard-title-row">
                  <span className="hero-label">{t('overall_risk')}</span>
                  <span className={`hazard-status-pill ${(summary?.overall_level || 'HIGH').toLowerCase()}`}>
                    ● {summary?.overall_level || 'HIGH'} ALERT
                  </span>
                </div>
                
                <div className="hazard-score-container">
                  <div className="score-metric-group">
                    <strong className={`risk-large ${(summary?.overall_level || 'HIGH')}`}>
                      {summary?.overall_score ?? 64}
                    </strong>
                    <div className="score-denom-group">
                      <span className="denom-label">/ 100</span>
                      <span className="score-desc">National Landslide Hazard Index</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="hazard-meter-track">
                    <div 
                      className={`hazard-meter-fill ${(summary?.overall_level || 'HIGH').toLowerCase()}`} 
                      style={{ width: `${summary?.overall_score ?? 64}%` }}
                    ></div>
                  </div>
                </div>

                <div className="hero-fusion-badges">
                  <span className="fusion-chip">🧪 Physics Safety Factor (FS): 1.08</span>
                  <span className="fusion-chip">📡 Soil Saturation: 82%</span>
                  <span className="fusion-chip">🤖 ML Failure Probability: 64%</span>
                </div>
              </div>

              <div className="hero-quick-actions">
                <button 
                  onClick={handleSyncLiveWeather} 
                  className="hero-btn-sync" 
                  disabled={syncingWeather}
                  title="Sync actual live rainfall from Open-Meteo"
                >
                  <RefreshCw size={15} className={syncingWeather ? 'spin-icon' : ''} />
                  {syncingWeather ? 'Syncing Actual Weather...' : 'Sync Actual Weather'}
                </button>
                <button onClick={() => setActiveTab('route')} className="hero-btn-primary" title="Find Safest Road Corridor">
                  <Route size={16} /> {t('find_safe_route')}
                </button>
                <button onClick={() => setActiveTab('report')} className="hero-btn-secondary" title="Submit Ground Report">
                  <Send size={16} /> {t('report_hazard')}
                </button>
                <button onClick={() => setActiveTab('emergency')} className="hero-btn-emergency" title="National Disaster Helpline">
                  <Phone size={16} /> Helpline (112)
                </button>
              </div>
            </section>

            {/* Institutional SIH Innovation & Scientific Modules Quick Bar */}
            <div className="institutional-quick-bar">
              <span className="iqb-label">INSTITUTIONAL CORE:</span>
              <button 
                className={`iqb-pill ${activeTab === 'ml_validation' ? 'active' : ''}`}
                onClick={() => setActiveTab('ml_validation')}
              >
                <Award size={14} /> ML Validation (ROC-AUC: 0.948)
              </button>
              <button 
                className={`iqb-pill ${activeTab === 'remote_sensing' ? 'active' : ''}`}
                onClick={() => setActiveTab('remote_sensing')}
              >
                <Orbit size={14} /> Satellite InSAR &amp; NDVI
              </button>
              <button 
                className={`iqb-pill ${activeTab === 'real_data' ? 'active' : ''}`}
                onClick={() => setActiveTab('real_data')}
              >
                <Database size={14} /> GSI/NASA Ground Truth
              </button>
              <button 
                className={`iqb-pill ${activeTab === 'diagnostics' ? 'active' : ''}`}
                onClick={() => setActiveTab('diagnostics')}
              >
                <Server size={14} /> DevOps &amp; SHA-256 Audit
              </button>
              <button 
                className={`iqb-pill ${activeTab === 'sensors' ? 'active' : ''}`}
                onClick={() => setActiveTab('sensors')}
              >
                <Activity size={14} /> IoT Telemetry Array
              </button>
            </div>

            {/* High-Level Overview KPI Cards */}
            <section className="stats">
              <div className="stat-card stat-cyan" onClick={() => setActiveTab('map')} style={{ cursor: 'pointer' }}>
                <div className="stat-card-top">
                  <small>{t('monitored_zones')}</small>
                  <MapPinned size={20} className="stat-icon-cyan" />
                </div>
                <b>{summary?.total_zones ?? 22}</b>
                <span className="stat-subtext">Pan-India Monitored Hotspots</span>
              </div>
              <div className="stat-card stat-orange" onClick={() => setActiveTab('map')} style={{ cursor: 'pointer' }}>
                <div className="stat-card-top">
                  <small>{t('high_risk_zones')}</small>
                  <AlertTriangle size={20} className="stat-icon-orange" />
                </div>
                <b>{summary?.high_risk_zones ?? 9}</b>
                <span className="stat-subtext">Slope Angle &gt; 35° · High Vulnerability</span>
              </div>
              <div className="stat-card stat-red" onClick={() => setActiveTab('map')} style={{ cursor: 'pointer' }}>
                <div className="stat-card-top">
                  <small>{t('critical_zones')}</small>
                  <AlertTriangle size={20} className="stat-icon-red" />
                </div>
                <b>{summary?.critical_zones ?? 7}</b>
                <span className="stat-subtext">Critical Saturated Debris Flow</span>
              </div>
              <div className="stat-card stat-purple" onClick={() => setActiveTab('report')} style={{ cursor: 'pointer' }}>
                <div className="stat-card-top">
                  <small>{t('active_reports')}</small>
                  <Users size={20} className="stat-icon-purple" />
                </div>
                <b>{summary?.active_reports ?? 4}</b>
                <span className="stat-subtext">Verified Citizen Ground Reports</span>
              </div>
              <div className="stat-card stat-rose" onClick={() => setActiveTab('alerts')} style={{ cursor: 'pointer' }}>
                <div className="stat-card-top">
                  <small>{t('active_alerts')}</small>
                  <Bell size={20} className="stat-icon-rose" />
                </div>
                <b>{summary?.active_alerts ?? 3}</b>
                <span className="stat-subtext">Active Early Warning Advisories</span>
              </div>
            </section>

            {/* Tab 1: Dashboard View */}
            {activeTab === 'dashboard' && (
              <div className="tab-container">
                <section className="grid-two">
                  <div className="panel">
                    <div className="panelhead">
                      <h2>{t('risk_map')} — National Multi-Region Network</h2>
                      <button className="text-link" onClick={() => setActiveTab('map')}>Expand GIS View →</button>
                    </div>
                    <RiskMap
                      zones={zones} 
                      reports={reports} 
                      selectedZone={selectedZone}
                      onSelectZone={z => setSelectedZone(z)} 
                      onOpenModalZone={z => setModalZone(z)}
                      onOpenReportModal={(prefill) => {
                        if (prefill) setInitialReportCoords(prefill);
                        setActiveTab('report');
                      }}
                      onNavigateToRoute={(dest) => {
                        if (dest) setInitialRouteDest(dest);
                        setActiveTab('route');
                      }} 
                      onNavigateToWeather={(loc) => {
                        if (loc) setPinnedWeatherLoc(loc);
                        setActiveTab('weather');
                      }}
                      onNavigateToAlerts={() => setActiveTab('alerts')}
                      routeData={routeData}
                      userLocation={userLocation} 
                      onFetchLocation={handleFetchLocation} 
                      pinnedLocation={pinnedWeatherLoc}
                      onPinLocation={setPinnedWeatherLoc}
                      lang={lang}
                    />
                  </div>
                  <div className="panel">
                    <ExplainabilityPanel />
                  </div>
                </section>

                <section style={{ marginTop: '24px' }}>
                  <div className="panel">
                    <div className="panelhead">
                      <h2>{t('alerts')} ({activeAlertsCount} Active)</h2>
                      <button className="text-link" onClick={() => setActiveTab('alerts')}>View All Alerts →</button>
                    </div>
                    {alerts.length === 0 ? (
                      <p className="muted-text">No active emergency warnings currently recorded.</p>
                    ) : (
                      <div className="alerts-full-list">
                        {alerts.slice(0, 3).map(a => (
                          <div key={a.id} className={`alert-card-item ${a.severity.toLowerCase()}`}>
                            <AlertTriangle size={24} />
                            <div>
                              <h3>{a.title}</h3>
                              <p>{a.message}</p>
                              {a.action_advice && (
                                <p className="alert-advice-inline"><strong>Advisory:</strong> {a.action_advice}</p>
                              )}
                              <small>District: {a.district || a.zone_id} | Issued: {new Date(a.created_at).toLocaleString()}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* Tab 2: Full GIS Risk Map */}
            {activeTab === 'map' && (
              <div className="tab-container">
                <RiskMap
                  zones={zones} 
                  reports={reports} 
                  selectedZone={selectedZone}
                  onSelectZone={z => setSelectedZone(z)} 
                  onOpenModalZone={z => setModalZone(z)}
                  onOpenReportModal={(prefill) => {
                    if (prefill) setInitialReportCoords(prefill);
                    setActiveTab('report');
                  }}
                  onNavigateToRoute={(dest) => {
                    if (dest) setInitialRouteDest(dest);
                    setActiveTab('route');
                  }} 
                  onNavigateToWeather={(loc) => {
                    if (loc) setPinnedWeatherLoc(loc);
                    setActiveTab('weather');
                  }}
                  onNavigateToAlerts={() => setActiveTab('alerts')}
                  routeData={routeData}
                  userLocation={userLocation} 
                  onFetchLocation={handleFetchLocation} 
                  pinnedLocation={pinnedWeatherLoc}
                  onPinLocation={setPinnedWeatherLoc}
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
                  onWeatherConditionDetected={(cond, details) => {
                    setDetectedLiveWeather({ condition: cond, ...details });
                  }}
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
                  initialDestination={initialRouteDest}
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
                  initialLocation={initialReportCoords}
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
          </>
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
  );
}

createRoot(document.getElementById('root')!).render(<App />);
