import React, { useState } from 'react';
import { Zone, CommunityReport, Alert } from '../types';
import { apiService } from '../services/api';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, FileText, Bell, RefreshCw } from 'lucide-react';

interface AuthorityConsoleProps {
  zones: Zone[];
  reports: CommunityReport[];
  alerts: Alert[];
  onRefresh: () => void;
}

export const AuthorityConsole: React.FC<AuthorityConsoleProps> = ({
  zones,
  reports,
  alerts,
  onRefresh,
}) => {
  const [actingId, setActingId] = useState<number | null>(null);

  const handleModerate = async (id: number, status: 'VERIFIED' | 'REJECTED') => {
    setActingId(id);
    try {
      await apiService.moderateReport(id, status);
      onRefresh();
    } catch (err) {
      alert('Failed to update report status.');
    } finally {
      setActingId(null);
    }
  };

  const handleAlertStatus = async (id: number, status: 'ACKNOWLEDGED' | 'RESOLVED') => {
    try {
      await apiService.updateAlertStatus(id, status);
      onRefresh();
    } catch (err) {
      alert('Failed to update alert status.');
    }
  };

  const pendingReports = reports.filter(r => r.status === 'PENDING');
  const verifiedReports = reports.filter(r => r.status === 'VERIFIED');
  const criticalZones = zones.filter(z => z.risk_score >= 75.0);

  return (
    <div className="authority-console-container">
      <div className="console-header">
        <ShieldCheck size={26} className="header-icon" />
        <div>
          <h2>Disaster Management Authority Console</h2>
          <p>Ground report moderation, alert dispatching, and slope stability control</p>
        </div>
        <button className="refresh-btn" onClick={onRefresh}>
          <RefreshCw size={15} /> Refresh Data
        </button>
      </div>

      <div className="authority-kpi-grid">
        <div className="kpi-card">
          <small>Critical Zones</small>
          <b style={{ color: '#ef4444' }}>{criticalZones.length}</b>
        </div>
        <div className="kpi-card">
          <small>Pending Reports</small>
          <b style={{ color: '#eab308' }}>{pendingReports.length}</b>
        </div>
        <div className="kpi-card">
          <small>Verified Reports</small>
          <b style={{ color: '#9333ea' }}>{verifiedReports.length}</b>
        </div>
        <div className="kpi-card">
          <small>Active Alerts</small>
          <b style={{ color: '#f97316' }}>{alerts.filter(a => a.status === 'ACTIVE').length}</b>
        </div>
      </div>

      <div className="console-sections-grid">
        {/* Pending Reports Moderation Table */}
        <div className="console-panel">
          <div className="panel-title">
            <FileText size={18} />
            <h3>Pending Ground Hazard Reports ({pendingReports.length})</h3>
          </div>

          {pendingReports.length === 0 ? (
            <p className="muted-text">No pending community reports requiring moderation.</p>
          ) : (
            <div className="reports-list">
              {pendingReports.map(r => (
                <div key={r.id} className="report-item">
                  <div className="report-main">
                    <span className="report-type-badge">{r.report_type.replace('_', ' ')}</span>
                    <span className={`severity-tag ${r.severity}`}>{r.severity}</span>
                    <p>{r.description}</p>
                    <small>
                      Lat: {r.latitude.toFixed(4)}, Lng: {r.longitude.toFixed(4)} | {new Date(r.created_at).toLocaleString()}
                    </small>
                    {r.photo_url && (
                      <div className="report-photo-thumb">
                        <img src={r.photo_url} alt="Field Evidence" />
                      </div>
                    )}
                  </div>
                  <div className="moderate-actions">
                    <button
                      className="btn-verify"
                      disabled={actingId === r.id}
                      onClick={() => handleModerate(r.id, 'VERIFIED')}
                    >
                      <CheckCircle2 size={15} /> Verify Report (+5 Risk Boost)
                    </button>
                    <button
                      className="btn-reject"
                      disabled={actingId === r.id}
                      onClick={() => handleModerate(r.id, 'REJECTED')}
                    >
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Emergency Alerts Management */}
        <div className="console-panel">
          <div className="panel-title">
            <Bell size={18} />
            <h3>Active Emergency Alerts ({alerts.length})</h3>
          </div>

          {alerts.length === 0 ? (
            <p className="muted-text">No active emergency alerts in system.</p>
          ) : (
            <div className="alerts-list">
              {alerts.map(a => (
                <div key={a.id} className={`alert-card-item ${a.severity.toLowerCase()}`}>
                  <div className="alert-body">
                    <strong>{a.title}</strong>
                    <p>{a.message}</p>
                    <small>Zone: {a.zone_id} | Status: {a.status}</small>
                  </div>
                  {a.status === 'ACTIVE' && (
                    <div className="alert-actions">
                      <button className="btn-ack" onClick={() => handleAlertStatus(a.id, 'ACKNOWLEDGED')}>
                        Acknowledge
                      </button>
                      <button className="btn-resolve" onClick={() => handleAlertStatus(a.id, 'RESOLVED')}>
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
