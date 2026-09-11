import React from 'react';
import { 
  ShieldCheck, Bell, Globe, LogIn, UserCheck, LogOut, 
  Menu, X, CheckCircle2, Play 
} from 'lucide-react';
import { Language } from '../utils/translations';

interface CommandTopHeaderProps {
  activeTab: string;
  onTabClick: (tab: any) => void;
  lastUpdatedTime: string;
  lang: Language;
  onLangChange: (lang: Language) => void;
  activeAlertsCount: number;
  currentUser: { name: string; role: string; email: string } | null;
  onLoginClick: () => void;
  onLogout: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onRunSimulation?: () => void;
}

export const CommandTopHeader: React.FC<CommandTopHeaderProps> = ({
  activeTab,
  onTabClick,
  lastUpdatedTime,
  lang,
  onLangChange,
  activeAlertsCount,
  currentUser,
  onLoginClick,
  onLogout,
  sidebarOpen,
  onToggleSidebar,
  onRunSimulation
}) => {
  return (
    <header className="cmd-top-header">
      {/* LEFT: Logo & Subtitle */}
      <div className="cmd-header-left">
        <button 
          className="cmd-mobile-sidebar-toggle" 
          onClick={onToggleSidebar}
          title="Toggle Navigation Menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="cmd-brand-identity" onClick={() => onTabClick('dashboard')}>
          <div className="cmd-brand-icon">
            <ShieldCheck size={24} />
          </div>
          <div className="cmd-brand-titles">
            <span className="cmd-brand-name">SLOPE<strong>SAFE</strong></span>
            <span className="cmd-brand-sub">PAN-INDIA EARLY WARNING SYSTEM</span>
          </div>
        </div>

        {/* CENTER / LEFT: Quick Navigation Links */}
        <nav className="cmd-top-nav-links">
          <button 
            className={`cmd-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onTabClick('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`cmd-nav-link ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => onTabClick('map')}
          >
            Risk Map
          </button>
          <button 
            className={`cmd-nav-link ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => onTabClick('report')}
          >
            Reports
          </button>
          <button 
            className={`cmd-nav-link ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => onTabClick('alerts')}
          >
            Alerts
          </button>
          <button 
            className={`cmd-nav-link ${activeTab === 'emergency' ? 'active' : ''}`}
            onClick={() => onTabClick('emergency')}
          >
            Resources
          </button>
        </nav>
      </div>

      {/* RIGHT: Operational Telemetry, Language, Alerts, Authority Login */}
      <div className="cmd-header-right">
        {/* System Operational Status */}
        <div className="cmd-system-status-indicator">
          <span className="status-live-dot"></span>
          <span className="status-live-text">All systems operational</span>
        </div>

        {/* Telemetry Timestamp */}
        <div className="cmd-timestamp-badge">
          <span>Updated {lastUpdatedTime}</span>
        </div>

        {/* Language Selector */}
        <div className="cmd-lang-dropdown">
          <Globe size={14} className="cmd-meta-icon" />
          <select value={lang} onChange={e => onLangChange(e.target.value as Language)}>
            <option value="en">English (EN)</option>
            <option value="hi">हिंदी (HI)</option>
          </select>
        </div>

        {/* Notifications / Alerts Bell */}
        <button 
          className={`cmd-bell-btn ${activeAlertsCount > 0 ? 'has-active-alerts' : ''}`}
          onClick={() => onTabClick('alerts')}
          title={`${activeAlertsCount} Active Multi-Agency Warnings`}
        >
          <Bell size={16} />
          {activeAlertsCount > 0 && (
            <span className="cmd-bell-count">{activeAlertsCount}</span>
          )}
        </button>

        {/* Authority Login / Session Profile */}
        {currentUser ? (
          <div className="cmd-user-session-chip">
            <UserCheck size={14} className="text-cyan" />
            <span className="user-name-label">{currentUser.name.split(' ')[0]}</span>
            <span className="user-role-label">({currentUser.role})</span>
            <button className="cmd-logout-btn" onClick={onLogout} title="Sign Out">
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button className="cmd-auth-btn" onClick={onLoginClick}>
            <LogIn size={14} />
            <span>Authority Login</span>
          </button>
        )}

        {/* Simulation Flow Trigger */}
        {onRunSimulation && (
          <button 
            className="cmd-simulation-btn" 
            onClick={onRunSimulation}
            title="Launch live multi-agency scenario simulation"
          >
            <Play size={13} />
            <span className="sim-btn-text">Scenario Run</span>
          </button>
        )}
      </div>
    </header>
  );
};
