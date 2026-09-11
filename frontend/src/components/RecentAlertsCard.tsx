import React from 'react';
import { Alert } from '../types';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';

interface RecentAlertsCardProps {
  alerts: Alert[];
  onViewAllAlerts?: () => void;
}

export const RecentAlertsCard: React.FC<RecentAlertsCardProps> = ({ alerts, onViewAllAlerts }) => {
  // Use actual application alerts or standard regional fallback alerts
  const displayAlerts = alerts && alerts.length > 0 
    ? alerts.slice(0, 3) 
    : [
        {
          id: 'ALT-UK-01',
          title: 'High probability of landslide in next 24 hours',
          district: 'Chamoli, Uttarakhand',
          severity: 'CRITICAL' as const,
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          status: 'ACTIVE' as const,
          zone_id: 'UK-002',
          message: 'Continuous rainfall on saturated slopes triggering debris alerts.'
        },
        {
          id: 'ALT-HP-01',
          title: 'Increased slope movement detected',
          district: 'Kullu, Himachal Pradesh',
          severity: 'HIGH' as const,
          created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          status: 'ACTIVE' as const,
          zone_id: 'HP-003',
          message: 'Tilt sensors show anomalous 1.8° displacement over 3 hours.'
        },
        {
          id: 'ALT-WB-01',
          title: 'Elevated rainfall levels',
          district: 'Darjeeling, West Bengal',
          severity: 'MODERATE' as const,
          created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
          status: 'ACTIVE' as const,
          zone_id: 'WB-001',
          message: 'Antecedent precipitation exceeding critical soil threshold.'
        }
      ];

  const getTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours === 1) return '1h ago';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="command-card recent-alerts-card">
      <div className="command-card-header">
        <div className="card-title-group">
          <div className="card-title-icon"><AlertTriangle size={16} /></div>
          <div>
            <h3>RECENT ALERTS</h3>
            <p className="card-subtitle">Active multi-agency early warnings</p>
          </div>
        </div>
        {onViewAllAlerts && (
          <button onClick={onViewAllAlerts} className="card-header-action-btn">
            View All <ArrowRight size={13} />
          </button>
        )}
      </div>

      <div className="alerts-feed-list">
        {displayAlerts.map(alert => {
          const sev = alert.severity.toUpperCase();
          const timeAgo = getTimeAgo(alert.created_at);
          const location = alert.district || alert.zone_id || 'Monitored Sector';

          return (
            <div key={alert.id} className={`alert-feed-item severity-${sev.toLowerCase()}`}>
              <div className="alert-item-header">
                <span className={`status-badge badge-${sev.toLowerCase()}`}>{sev}</span>
                <span className="alert-item-time">
                  <Clock size={11} /> {timeAgo}
                </span>
              </div>
              <h4 className="alert-item-location">{location}</h4>
              <p className="alert-item-title">{alert.title}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
