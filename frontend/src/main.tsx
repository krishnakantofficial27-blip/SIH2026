import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { apiService } from './services/api';
import { Zone, CommunityReport, Alert, RiskSummary, SafeRouteResponse } from './types';
import { CommandTopHeader } from './components/CommandTopHeader';
import { CommandSidebar } from './components/CommandSidebar';
import { NationalRiskOverview } from './components/NationalRiskOverview';
import { RecentAlertsCard } from './components/RecentAlertsCard';
import { EmergencyActionsBar } from './components/EmergencyActionsBar';
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
import { AlertTriangle } from 'lucide-react';

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
    <div className="cmd-app-shell">
      {/* Sticky Global Command Top Header */}
      <CommandTopHeader
        activeTab={activeTab}
        onTabClick={handleTabClick}
        lastUpdatedTime={lastUpdatedTime}
        lang={lang}
        onLangChange={setLang}
        activeAlertsCount={activeAlertsCount}
        currentUser={currentUser}
        onLoginClick={() => handleTabClick('login')}
        onLogout={() => setCurrentUser(null)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onRunSimulation={() => setShowSimModal(true)}
      />

      {/* Main Layout: Fixed Command Sidebar + Content Viewport */}
      <div className="cmd-app-body">
        <CommandSidebar
          activeTab={activeTab}
          onTabClick={handleTabClick}
          role={role}
          onRoleChange={setRole}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="cmd-main-content">
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
              {/* Command Center Title Header */}
              <div className="cmd-page-header">
                <div className="cmd-page-title-row">
                  <span className="cmd-eyebrow">NATIONAL DISASTER MANAGEMENT COMMAND CENTER</span>
                  <span className="cmd-region-badge">PAN-INDIA MULTI-HAZARD SENSOR NETWORK</span>
                </div>
                <h1 className="cmd-main-title">SLOPESAFE COMMAND CENTER</h1>
                <p className="cmd-main-subtitle">
                  Real-time geotechnical landslide risk monitoring, early warning dissemination, and AI predictive analytics
                </p>
              </div>

              {/* National Risk Overview Panel (Always visible across dashboard & key views) */}
              <NationalRiskOverview 
                summary={summary} 
                onNavigateTab={tab => handleTabClick(tab as Tab)} 
              />

              {/* Tab 1: Operational Command Dashboard */}
              {activeTab === 'dashboard' && (
                <>
                  {/* Main 70% / 30% Command Grid */}
                  <div className="cmd-dashboard-grid">
                    {/* Left 70%: Interactive Live GIS Risk Map */}
                    <div className="cmd-grid-left">
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

                    {/* Right 30%: Risk Intelligence + Recent Alerts */}
                    <div className="cmd-grid-right">
                      <ExplainabilityPanel />
                      <RecentAlertsCard 
                        alerts={alerts} 
                        onViewAllAlerts={() => setActiveTab('alerts')} 
                      />
                    </div>
                  </div>

                  {/* Integrated Emergency Actions Bar */}
                  <EmergencyActionsBar
                    onFindRoute={() => setActiveTab('route')}
                    onReportHazard={() => setActiveTab('report')}
                    onEmergencyHelp={() => setActiveTab('emergency')}
                  />
                </>
              )}

              {/* Tab 2: Dedicated Full GIS Risk Map */}
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

          {/* Global Institutional Footer */}
          <footer>
            <div className="footer-content">
              <p>
                <strong>SlopeSafe</strong> — National Landslide Early Warning & Decision Support System.
              </p>
              <small>
                {t('disclaimer')} Integrated with NDMA, ISRO NRSC, MoHA, and Geological Survey of India (GSI) spatial feeds.
              </small>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

