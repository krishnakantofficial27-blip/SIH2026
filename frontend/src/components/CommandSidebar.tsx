import React from 'react';
import { 
  LayoutDashboard, Layers, Send, Bell, BarChart3, 
  BookOpen, Activity, Route, Phone, Siren, ShieldCheck, X
} from 'lucide-react';

interface CommandSidebarProps {
  activeTab: string;
  onTabClick: (tab: any) => void;
  role: 'Resident' | 'Authority';
  onRoleChange: (role: 'Resident' | 'Authority') => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CommandSidebar: React.FC<CommandSidebarProps> = ({
  activeTab,
  onTabClick,
  role,
  onRoleChange,
  isOpen,
  onClose,
}) => {
  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Risk Map', icon: Layers },
    { id: 'report', label: 'Citizen Reports', icon: Send },
    { id: 'alerts', label: 'Early Warnings', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'methodology', label: 'About & Transparency', icon: BookOpen },
  ];

  const operationsNavItems = [
    { id: 'sensors', label: 'IoT Sensors', icon: Activity },
    { id: 'route', label: 'Safe Route Corridor', icon: Route },
    { id: 'emergency', label: 'Emergency Helplines (112)', icon: Phone },
    { id: 'evacuation', label: 'Evacuation Shelters', icon: Siren },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="cmd-sidebar-backdrop" onClick={onClose}></div>
      )}

      <aside className={`cmd-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cmd-sidebar-inner">
          {/* Mobile close button */}
          <div className="cmd-sidebar-mobile-header">
            <span className="mobile-drawer-title">COMMAND MENU</span>
            <button className="cmd-close-sidebar-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* Primary Navigation Section */}
          <div className="sidebar-section-heading">OPERATIONAL NAVIGATION</div>
          <nav className="cmd-sidebar-nav">
            {primaryNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`cmd-sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onTabClick(item.id);
                    onClose();
                  }}
                >
                  <span className="sidebar-indicator"></span>
                  <Icon size={17} className="sidebar-item-icon" />
                  <span className="sidebar-item-label">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Extended Disaster Response Section */}
          <div className="sidebar-section-heading">EMERGENCY OPERATIONS</div>
          <nav className="cmd-sidebar-nav">
            {operationsNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`cmd-sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onTabClick(item.id);
                    onClose();
                  }}
                >
                  <span className="sidebar-indicator"></span>
                  <Icon size={17} className="sidebar-item-icon" />
                  <span className="sidebar-item-label">{item.label}</span>
                </button>
              );
            })}

            {role === 'Authority' && (
              <button
                className={`cmd-sidebar-item authority-item ${activeTab === 'authority' ? 'active' : ''}`}
                onClick={() => {
                  onTabClick('authority');
                  onClose();
                }}
              >
                <span className="sidebar-indicator"></span>
                <ShieldCheck size={17} className="sidebar-item-icon text-orange" />
                <span className="sidebar-item-label">Authority Command</span>
              </button>
            )}
          </nav>

          {/* Role Mode Switcher */}
          <div className="cmd-sidebar-role-box">
            <span className="role-box-label">PORTAL VIEW MODE</span>
            <select 
              value={role} 
              onChange={e => onRoleChange(e.target.value as any)}
              className="cmd-role-select"
            >
              <option value="Resident">Public / Resident View</option>
              <option value="Authority">Official / DDMA Command</option>
            </select>
          </div>

          {/* Bottom Institutional Seal & Attribution */}
          <div className="cmd-sidebar-footer">
            <p className="footer-tagline">"A Safer Tomorrow for a Resilient India"</p>
            <div className="footer-supporting-orgs">
              <span className="supported-label">Supported by:</span>
              <p className="supported-list">NDMA | ISRO | MoHA</p>
              <span className="gov-label">Government of India</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
