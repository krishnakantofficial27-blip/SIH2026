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
import { LoginModal } from './components/LoginModal';
import { TRANSLATIONS, Language } from './utils/translations';

import { 
  ShieldCheck, AlertTriangle, MapPinned, Route, Users, CloudRain, 
  Play, Send, Loader2, WifiOff, RefreshCw, Layers, BarChart3, Bell, Eye, Menu, X, Globe, LogIn, LogOut, UserCheck
} from 'lucide-react';
import './style.css';

type Tab = 'dashboard' | 'map' | 'route' | 'report' | 'alerts' | 'analytics' | 'authority';
type ConnectionStatus = 'connecting' | 'connected' | 'demo-fallback';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [role, setRole] = useState<'Resident' | 'Authority'>('Resident');
  const [lang, setLang] = useState<Language>('en');
  const [currentUser, setCurrentUser] = useState<{ name: string; role: 'Resident' | 'Authority'; email: string } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [routeData, setRouteData] = useState<SafeRouteResponse | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showSimModal, setShowSimModal] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [notice, setNotice] = useState<string>('');

  const t = (key: string): string => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;

  const loadData = useCallback(async () => {
    try {
      const health = await apiService.checkHealth();
      const isDemo = health?.mode?.includes('demo');

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
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const handleLoginSuccess = (user: { name: string; role: 'Resident' | 'Authority'; email: string }) => {
    setCurrentUser(user);
    setRole(user.role);
    if (user.role === 'Authority') {
      setActiveTab('authority');
    }
  };

  const handleFetchLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setNotice('📍 GPS location acquired successfully.');
        },
        () => {
          setNotice('⚠️ GPS permission denied. Manual location selection active.');
        }
      );
    }
  };

  const ConnectionBanner = () => {
    if (status === 'connected') return null;
    return (
      <div className="notice info-banner">
        <span>⚡ DEMO MODE ACTIVE — Displaying verified North Eastern Region synthetic dataset.</span>
      </div>
    );
  };

  return (
    <div className="shell">
      {/* Top Mobile Bar with Hamburger ☰ */}
      <div className="mobile-header-bar">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="mobile-brand">
          <ShieldCheck size={22} /> SLOPE<span>SAFE</span>
        </div>
        <button className="mobile-scenario-btn" onClick={() => setShowSimModal(true)}>
          <Play size={14} /> Simulation
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <ShieldCheck size={26} /> SLOPE<span>SAFE</span>
          </div>
          <button className="close-sidebar-btn" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <p className="tag">{t('brand_sub')}</p>

        {/* Language Switcher Dropdown */}
        <div className="lang-switcher">
          <Globe size={14} />
          <select value={lang} onChange={e => setLang(e.target.value as Language)}>
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="as">অসমীয়া (Assamese)</option>
          </select>
        </div>

        {/* User Login Profile Box */}
        {currentUser ? (
          <div className="logged-user-card">
            <div className="user-info">
              <UserCheck size={16} className="user-icon" />
              <div>
                <strong>{currentUser.name}</strong>
                <small>{currentUser.email}</small>
              </div>
            </div>
            <button className="logout-btn" onClick={() => setCurrentUser(null)}>
              <LogOut size={13} /> {t('logout')}
            </button>
          </div>
        ) : (
          <button className="portal-login-btn" onClick={() => setShowLoginModal(true)}>
            <LogIn size={16} /> {t('login_portal')}
          </button>
        )}

        <nav className="nav-menu">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => handleTabClick('dashboard')}>
            <MapPinned size={18} /> {t('dashboard')}
          </button>
          <button className={activeTab === 'map' ? 'active' : ''} onClick={() => handleTabClick('map')}>
            <Layers size={18} /> {t('risk_map')}
          </button>
          <button className={activeTab === 'route' ? 'active' : ''} onClick={() => handleTabClick('route')}>
            <Route size={18} /> {t('safe_route')}
          </button>
          <button className={activeTab === 'report' ? 'active' : ''} onClick={() => handleTabClick('report')}>
            <Send size={18} /> {t('report_hazard')}
          </button>
          <button className={activeTab === 'alerts' ? 'active' : ''} onClick={() => handleTabClick('alerts')}>
            <Bell size={18} /> {t('alerts')} ({alerts.filter(a => a.status === 'ACTIVE').length})
          </button>
          <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => handleTabClick('analytics')}>
            <BarChart3 size={18} /> {t('analytics')}
          </button>
          {role === 'Authority' && (
            <button className={activeTab === 'authority' ? 'active' : ''} onClick={() => handleTabClick('authority')}>
              <ShieldCheck size={18} /> {t('authority_console')}
            </button>
          )}
        </nav>

        <div className="role-switcher">
          <small>DEMO ROLE</small>
          <select value={role} onChange={e => setRole(e.target.value as any)}>
            <option value="Resident">Resident View</option>
            <option value="Authority">Authority View</option>
          </select>
        </div>
      </aside>

      {/* Main Content Area */}
      <main>
        <header className="main-header">
          <div>
            <p className="eyebrow">SIH 2026 PROBLEM SIH26001 · NORTH EASTERN REGION</p>
            <h1>{t('slogan')}</h1>
          </div>
          <div className="header-actions">
            <button className="login-header-btn" onClick={() => setShowLoginModal(true)}>
              <LogIn size={15} /> {currentUser ? currentUser.name.split(' ')[0] : t('login_portal')}
            </button>
            <button className="scenario-btn" onClick={() => setShowSimModal(true)}>
              <Play size={16} /> {t('run_simulation')}
            </button>
          </div>
        </header>

        <ConnectionBanner />

        {notice && (
          <div className="notice info-banner">
            <span>{notice}</span>
            <button onClick={() => setNotice('')} className="dismiss-btn">×</button>
          </div>
        )}

        {/* Hero Card */}
        <section className="hero">
          <div>
            <p>{t('overall_risk')}</p>
            <strong className={`risk ${summary?.overall_level || 'LOW'}`}>
              {summary?.overall_level || 'LOW'} <small>{summary?.overall_score ?? 58}/100</small>
            </strong>
            <span>AI ML Prediction + Verified Ground Evidence Fusion</span>
          </div>

          <div className="quick-actions">
            <button onClick={() => setActiveTab('route')}><Route size={16} /> {t('find_safe_route')}</button>
            <button onClick={() => setActiveTab('report')}><Send size={16} /> {t('report_hazard')}</button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="stats">
          <div className="stat-card">
            <MapPinned size={22} />
            <small>{t('monitored_zones')}</small>
            <b>{summary?.total_zones ?? 5}</b>
          </div>
          <div className="stat-card">
            <AlertTriangle size={22} style={{ color: '#ef4444' }} />
            <small>{t('high_risk_zones')}</small>
            <b>{summary?.high_risk_zones ?? 2}</b>
          </div>
          <div className="stat-card">
            <Users size={22} style={{ color: '#9333ea' }} />
            <small>{t('active_reports')}</small>
            <b>{summary?.active_reports ?? 3}</b>
          </div>
          <div className="stat-card">
            <CloudRain size={22} style={{ color: '#3b82f6' }} />
            <small>{t('active_alerts')}</small>
            <b>{summary?.active_alerts ?? 2}</b>
          </div>
        </section>

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <div className="tab-container">
            <section className="grid-two">
              <div className="panel">
                <div className="panelhead">
                  <h2>{t('risk_map')}</h2>
                  <button className="text-link" onClick={() => setActiveTab('map')}>Expand Full Map →</button>
                </div>
                <RiskMap
                  zones={zones}
                  reports={reports}
                  selectedZone={selectedZone}
                  onSelectZone={z => setSelectedZone(z)}
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

            <section className="bottom-dashboard-grid" style={{ marginTop: '20px' }}>
              <div className="panel">
                <h2>{t('alerts')} ({alerts.filter(a => a.status === 'ACTIVE').length})</h2>
                {alerts.length === 0 ? (
                  <p className="muted-text">No active alerts recorded.</p>
                ) : (
                  <div className="alerts-full-list">
                    {alerts.map(a => (
                      <div key={a.id} className={`alert-card-item ${a.severity.toLowerCase()}`}>
                        <AlertTriangle size={20} />
                        <div>
                          <h3>{a.title}</h3>
                          <p>{a.message}</p>
                          <small>Zone: {a.zone_id} | Issued: {new Date(a.created_at).toLocaleString()}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="tab-container">
            <RiskMap
              zones={zones}
              reports={reports}
              selectedZone={selectedZone}
              onSelectZone={z => setSelectedZone(z)}
              onOpenReportModal={() => setActiveTab('report')}
              onNavigateToRoute={() => setActiveTab('route')}
              routeData={routeData}
              userLocation={userLocation}
              onFetchLocation={handleFetchLocation}
              lang={lang}
            />
          </div>
        )}

        {activeTab === 'route' && (
          <div className="tab-container">
            <SafeRoutePlanner
              onRouteCalculated={r => setRouteData(r)}
              userLocation={userLocation}
              onFetchLocation={handleFetchLocation}
            />
          </div>
        )}

        {activeTab === 'report' && (
          <div className="tab-container">
            <HazardReporter
              onReportSubmitted={loadData}
              userLocation={userLocation}
              onFetchLocation={handleFetchLocation}
            />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="tab-container">
            <div className="panel">
              <h2>{t('alerts')}</h2>
              {alerts.length === 0 ? (
                <p className="muted-text">No active alerts recorded.</p>
              ) : (
                <div className="alerts-full-list">
                  {alerts.map(a => (
                    <div key={a.id} className={`alert-card-item ${a.severity.toLowerCase()}`}>
                      <AlertTriangle size={24} />
                      <div>
                        <h3>{a.title}</h3>
                        <p>{a.message}</p>
                        <small>Zone: {a.zone_id} | Issued: {new Date(a.created_at).toLocaleString()}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="tab-container">
            <AnalyticsDashboard />
          </div>
        )}

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

        {/* Zone Inspection Modal */}
        {selectedZone && (
          <ZoneDetailModal
            zone={selectedZone}
            onClose={() => setSelectedZone(null)}
            onNavigateToRoute={() => {
              setSelectedZone(null);
              setActiveTab('route');
            }}
            onNavigateToReport={() => {
              setSelectedZone(null);
              setActiveTab('report');
            }}
          />
        )}

        {/* Demo Emergency Simulation Modal */}
        {showSimModal && (
          <DemoSimulationModal
            onClose={() => setShowSimModal(false)}
            onSimulationComplete={loadData}
          />
        )}

        {/* Login Modal */}
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {/* Footer Disclaimer */}
        <footer>
          This system is a prototype decision-support tool. Predictions are estimates and should not replace official government warnings, geological assessments, or emergency instructions.
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
