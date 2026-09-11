import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { apiService } from './services/api';
import { Zone, CommunityReport, Alert, RiskSummary, SafeRouteResponse } from './types';
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
import { TRANSLATIONS, Language } from './utils/translations';

import { 
  ShieldCheck, AlertTriangle, MapPinned, Route, Users, CloudRain, 
  Play, Send, Layers, BarChart3, Bell, Menu, X, Globe, LogIn, LogOut, UserCheck,
  Brain, Activity, Siren, Calendar, CloudSun, Phone, BookOpen, Clock, Sparkles, CheckCircle2
} from 'lucide-react';
import './style.css';

type Tab = 
  | 'dashboard' 
  | 'map' 
  | 'sensors' 
  | 'weather' 
  | 'ml' 
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
  const [notice, setNotice] = useState<string>('');

  const t = (key: string): string => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;

  const loadData = useCallback(async () => {
    try {
      const health = await apiService.checkHealth();
      const isDemo = health?.mode?.includes('demo') || health?.mode?.includes('offline');

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
      setStatus(isDemo ? 'demo-fallback' : 'connected');
      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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
      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

        {/* System Telemetry Badges */}
        <div className="header-center-badges">
          <div className="live-status-pill">
            <span className="pulse-green"></span>
            <span>{t('data_live')}</span>
            <small>· {lastUpdatedTime}</small>
          </div>
          <div className="demo-mode-pill">
            <Sparkles size={13} />
            <span>DEMO MODE</span>
          </div>
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

          <div className="nav-section-label">AI & PREDICTION</div>
          <button className={activeTab === 'ml' ? 'active' : ''} onClick={() => handleTabClick('ml')}>
            <Brain size={17} /> {t('ml')}
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

          <div className="nav-section-label">RESEARCH & HISTORY</div>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => handleTabClick('history')}>
            <Calendar size={17} /> {t('history')}
          </button>

          {role === 'Authority' && (
            <>
              <div className="nav-section-label">OFFICIAL COMMAND</div>
              <button className={activeTab === 'authority' ? 'active' : ''} onClick={() => handleTabClick('authority')}>
                <ShieldCheck size={17} /> {t('authority_console')}
              </button>
            </>
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
            {/* Top Sub-Header */}
            <div className="hero-subhead">
              <div className="hero-eyebrow-row">
                <span className="eyebrow">SIH 2026 · NATIONAL MULTI-HAZARD EARLY WARNING PLATFORM</span>
                <span className="location-pill">📍 Pan-India Landslide Network (Western Ghats, Himalayas, North-East)</span>
              </div>
              <h1>{t('slogan')}</h1>
            </div>

            {/* Regional Hazard Summary Hero */}
            <section className="hero">
              <div className="hero-left">
                <p>{t('overall_risk')}</p>
                <strong className={`risk ${summary?.overall_level || 'HIGH'}`}>
                  {summary?.overall_level || 'HIGH'} <small>{summary?.overall_score ?? 64}/100</small>
                </strong>
                <span className="hero-fusion-caption">
                  Multi-Sensor Physical Geotechnical Modeling + Verified Citizen Ground Truth
                </span>
              </div>

              <div className="hero-quick-actions">
                <button onClick={() => setActiveTab('route')} className="hero-btn-primary">
                  <Route size={16} /> {t('find_safe_route')}
                </button>
                <button onClick={() => setActiveTab('report')} className="hero-btn-secondary">
                  <Send size={16} /> {t('report_hazard')}
                </button>
                <button onClick={() => setActiveTab('emergency')} className="hero-btn-emergency">
                  <Phone size={16} /> Emergency Helpline (112)
                </button>
              </div>
            </section>

            {/* High-Level Overview KPI Cards */}
            <section className="stats">
              <div className="stat-card" onClick={() => setActiveTab('map')} style={{ cursor: 'pointer' }}>
                <MapPinned size={22} style={{ color: '#38bdf8' }} />
                <small>{t('monitored_zones')}</small>
                <b>{summary?.total_zones ?? 22}</b>
              </div>
              <div className="stat-card" onClick={() => setActiveTab('map')} style={{ cursor: 'pointer' }}>
                <AlertTriangle size={22} style={{ color: '#f97316' }} />
                <small>{t('high_risk_zones')}</small>
                <b>{summary?.high_risk_zones ?? 9}</b>
              </div>
              <div className="stat-card" onClick={() => setActiveTab('map')} style={{ cursor: 'pointer' }}>
                <AlertTriangle size={22} style={{ color: '#ef4444' }} />
                <small>{t('critical_zones')}</small>
                <b>{summary?.critical_zones ?? 7}</b>
              </div>
              <div className="stat-card" onClick={() => setActiveTab('report')} style={{ cursor: 'pointer' }}>
                <Users size={22} style={{ color: '#9333ea' }} />
                <small>{t('active_reports')}</small>
                <b>{summary?.active_reports ?? 4}</b>
              </div>
              <div className="stat-card" onClick={() => setActiveTab('alerts')} style={{ cursor: 'pointer' }}>
                <Bell size={22} style={{ color: '#ef4444' }} />
                <small>{t('active_alerts')}</small>
                <b>{summary?.active_alerts ?? 3}</b>
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
                      onOpenReportModal={() => setActiveTab('report')}
                      onNavigateToRoute={() => setActiveTab('route')} 
                      routeData={routeData}
                      userLocation={userLocation} 
                      onFetchLocation={handleFetchLocation} 
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
                  onOpenReportModal={() => setActiveTab('report')}
                  onNavigateToRoute={() => setActiveTab('route')} 
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
                <WeatherForecast userLocation={userLocation} />
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
          />
        )}

        {showSimModal && (
          <DemoSimulationModal
            onClose={() => setShowSimModal(false)}
            onSimulationComplete={loadData}
            onNavigateTab={tab => setActiveTab(tab as Tab)}
          />
        )}

        {/* Global Transparent Footer */}
        <footer>
          <div className="footer-content">
            <p>
              <strong>SlopeSafe</strong> — AI Landslide Early Warning & Decision Support System.
            </p>
            <small>
              {t('disclaimer')} Data sources: Open-Meteo ECMWF, NASA SRTM 30m DEM, Geological Survey of India (GSI).
            </small>
          </div>
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
