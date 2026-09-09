import React, { useState } from 'react';
import { Zone, CommunityReport, Alert, ReportStatus } from '../types';
import { apiService } from '../services/api';
import { 
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, FileText, 
  Bell, RefreshCw, Download, UserCheck, MessageSquare, Clock, ArrowRight, Check 
} from 'lucide-react';

interface AuthorityConsoleProps {
  zones: Zone[];
  reports: CommunityReport[];
  alerts: Alert[];
  onRefresh: () => void;
}

const LIFECYCLE_BADGE_STYLE: Record<string, { bg: string; label: string }> = {
  SUBMITTED: { bg: '#3b82f6', label: '1. SUBMITTED' },
  UNDER_REVIEW: { bg: '#eab308', label: '2. UNDER REVIEW' },
  VERIFIED: { bg: '#9333ea', label: '3. VERIFIED' },
  ACTION_REQUIRED: { bg: '#ef4444', label: '4. ACTION REQUIRED' },
  RESOLVED: { bg: '#22c55e', label: '5. RESOLVED' },
  REJECTED: { bg: '#64748b', label: 'REJECTED' },
};

export const AuthorityConsole: React.FC<AuthorityConsoleProps> = ({
  zones,
  reports,
  alerts,
  onRefresh,
}) => {
  const [actingId, setActingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [notesInput, setNotesInput] = useState<Record<number, string>>({});
  const [teamInput, setTeamInput] = useState<Record<number, string>>({});

  const handleModerate = async (
    id: number, 
    newStatus: ReportStatus,
    notes?: string,
    team?: string
  ) => {
    setActingId(id);
    try {
      await apiService.moderateReport(id, newStatus, notes, team);
      onRefresh();
    } catch {
      alert('Failed to update report status.');
    } finally {
      setActingId(null);
    }
  };

  const handleAlertStatus = async (id: number, status: 'ACKNOWLEDGED' | 'RESOLVED') => {
    try {
      await apiService.updateAlertStatus(id, status);
      onRefresh();
    } catch {
      alert('Failed to update alert status.');
    }
  };

  const handleExportCSV = () => {
    const headers = 'ID,ReportCode,Type,Severity,District,Status,Latitude,Longitude,Created,AuthorityNotes\n';
    const rows = reports.map(r => 
      `"${r.id}","${r.report_code || ''}","${r.report_type}","${r.severity}","${r.district || ''}","${r.status}","${r.latitude}","${r.longitude}","${r.created_at}","${(r.authority_notes || '').replace(/"/g, '""')}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `slopesafe_incidents_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = statusFilter === 'ALL' 
    ? reports 
    : reports.filter(r => r.status === statusFilter);

  const pendingCount = reports.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'PENDING').length;
  const verifiedCount = reports.filter(r => r.status === 'VERIFIED').length;
  const actionCount = reports.filter(r => r.status === 'ACTION_REQUIRED').length;
  const criticalZones = zones.filter(z => z.risk_score >= 75.0);
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');

  return (
    <div className="authority-console-container">
      {/* Console Header */}
      <div className="console-header">
        <div className="console-title-wrap">
          <ShieldCheck size={28} className="header-icon" />
          <div>
            <h2>Disaster Management Authority Command Center</h2>
            <p>National & State Disaster Management Authorities (NDMA / SDMA / DDMA)</p>
          </div>
        </div>
        <div className="console-top-actions">
          <button className="btn-outline-action" onClick={handleExportCSV}>
            <Download size={15} /> Export Incidents (CSV)
          </button>
          <button className="refresh-btn" onClick={onRefresh}>
            <RefreshCw size={15} /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="authority-kpi-grid">
        <div className="kpi-card">
          <small>Critical Hazard Zones</small>
          <b style={{ color: '#ef4444' }}>{criticalZones.length}</b>
          <span className="kpi-sub">Out of {zones.length} monitored</span>
        </div>
        <div className="kpi-card">
          <small>Active Emergency Alerts</small>
          <b style={{ color: '#f97316' }}>{activeAlerts.length}</b>
          <span className="kpi-sub">{alerts.filter(a => a.status === 'ACKNOWLEDGED').length} acknowledged</span>
        </div>
        <div className="kpi-card">
          <small>Pending Citizen Reports</small>
          <b style={{ color: '#eab308' }}>{pendingCount}</b>
          <span className="kpi-sub">Awaiting field moderation</span>
        </div>
        <div className="kpi-card">
          <small>Verified Incidents</small>
          <b style={{ color: '#9333ea' }}>{verifiedCount}</b>
          <span className="kpi-sub">Recalibrating risk models</span>
        </div>
        <div className="kpi-card">
          <small>Action In Progress</small>
          <b style={{ color: '#ef4444' }}>{actionCount}</b>
          <span className="kpi-sub">Response teams deployed</span>
        </div>
      </div>

      {/* Sections Grid: Incident Lifecycle Moderation + Alert Center */}
      <div className="console-sections-grid">
        {/* Left Column: Citizen Incident Moderation Lifecycle */}
        <div className="console-panel full-height">
          <div className="panel-title-bar">
            <div className="title-left">
              <FileText size={20} />
              <h3>Incident Moderation Lifecycle ({filteredReports.length})</h3>
            </div>

            {/* Lifecycle Status Filter */}
            <div className="lifecycle-filter-chips">
              {(['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'ACTION_REQUIRED', 'RESOLVED', 'REJECTED'] as const).map(s => (
                <button
                  key={s}
                  className={`chip-filter ${statusFilter === s ? 'active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <p className="muted-text pad-20">No citizen hazard reports matching the "{statusFilter}" filter.</p>
          ) : (
            <div className="reports-list">
              {filteredReports.map(r => {
                const badge = LIFECYCLE_BADGE_STYLE[r.status] || { bg: '#64748b', label: r.status };
                const currentNotes = notesInput[r.id] !== undefined ? notesInput[r.id] : (r.authority_notes || '');
                const currentTeam = teamInput[r.id] !== undefined ? teamInput[r.id] : (r.assigned_team || '');

                return (
                  <div key={r.id} className="report-item-detailed">
                    <div className="report-item-header">
                      <div>
                        <span className="report-code-badge">{r.report_code || `#IND-2026-${r.id}`}</span>
                        <span className="report-type-badge">{r.report_type.replace('_', ' ')}</span>
                        <span className={`severity-tag ${r.severity}`}>{r.severity}</span>
                        <span className="district-tag">{r.district || 'National'}</span>
                      </div>
                      <span className="lifecycle-pill" style={{ backgroundColor: badge.bg }}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="report-desc-text">{r.description}</p>
                    
                    <div className="report-meta-row">
                      <small><Clock size={12} /> Reported: {new Date(r.created_at).toLocaleString()}</small>
                      <small>Coords: {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</small>
                    </div>

                    {r.photo_url && (
                      <div className="report-photo-thumb">
                        <img src={r.photo_url} alt="Ground Evidence" />
                      </div>
                    )}

                    {/* Authority Action Inputs */}
                    <div className="authority-input-row">
                      <div className="input-with-label">
                        <label><MessageSquare size={12} /> Official Field Notes</label>
                        <input
                          type="text"
                          placeholder="e.g. Geotechnical team inspected slope; tension crack width measured 5cm"
                          value={currentNotes}
                          onChange={e => setNotesInput({ ...notesInput, [r.id]: e.target.value })}
                        />
                      </div>
                      <div className="input-with-label">
                        <label><UserCheck size={12} /> Assigned Team</label>
                        <input
                          type="text"
                          placeholder="e.g. DDMA Mandi Quick Reaction Unit 2"
                          value={currentTeam}
                          onChange={e => setTeamInput({ ...teamInput, [r.id]: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Multi-Stage Lifecycle Transition Buttons */}
                    <div className="moderate-actions-bar">
                      {r.status === 'SUBMITTED' && (
                        <button
                          className="btn-status-stage review"
                          disabled={actingId === r.id}
                          onClick={() => handleModerate(r.id, 'UNDER_REVIEW', currentNotes, currentTeam)}
                        >
                          Mark Under Review →
                        </button>
                      )}

                      {(r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW') && (
                        <button
                          className="btn-status-stage verify"
                          disabled={actingId === r.id}
                          onClick={() => handleModerate(r.id, 'VERIFIED', currentNotes, currentTeam)}
                        >
                          <CheckCircle2 size={14} /> Verify Ground Evidence (+5 Risk Boost)
                        </button>
                      )}

                      {r.status === 'VERIFIED' && (
                        <button
                          className="btn-status-stage action"
                          disabled={actingId === r.id}
                          onClick={() => handleModerate(r.id, 'ACTION_REQUIRED', currentNotes, currentTeam)}
                        >
                          <AlertTriangle size={14} /> Deploy Response Team (Action Required)
                        </button>
                      )}

                      {r.status === 'ACTION_REQUIRED' && (
                        <button
                          className="btn-status-stage resolve"
                          disabled={actingId === r.id}
                          onClick={() => handleModerate(r.id, 'RESOLVED', currentNotes, currentTeam)}
                        >
                          <Check size={14} /> Mark Resolved (Slope Cleared)
                        </button>
                      )}

                      {r.status !== 'REJECTED' && r.status !== 'RESOLVED' && (
                        <button
                          className="btn-status-stage reject"
                          disabled={actingId === r.id}
                          onClick={() => handleModerate(r.id, 'REJECTED', 'Classified as false alarm/unrelated disturbance', currentTeam)}
                        >
                          <XCircle size={14} /> Reject False Alarm
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Emergency Alerts & Warnings */}
        <div className="console-panel">
          <div className="panel-title-bar">
            <div className="title-left">
              <Bell size={20} />
              <h3>Disaster Early Warnings & Alerts ({alerts.length})</h3>
            </div>
          </div>

          {alerts.length === 0 ? (
            <p className="muted-text pad-20">No active emergency alerts in the system.</p>
          ) : (
            <div className="alerts-list">
              {alerts.map(a => (
                <div key={a.id} className={`alert-card-item ${a.severity.toLowerCase()}`}>
                  <div className="alert-body">
                    <div className="alert-top">
                      <span className={`alert-badge ${a.severity.toLowerCase()}`}>{a.severity}</span>
                      <span className="alert-status-pill">{a.status}</span>
                      <span className="alert-district-pill">{a.district || a.zone_id}</span>
                    </div>
                    <strong>{a.title}</strong>
                    <p>{a.message}</p>
                    {a.action_advice && (
                      <p className="alert-advice-note"><strong>Advisory:</strong> {a.action_advice}</p>
                    )}
                    <small>Issued: {new Date(a.created_at).toLocaleString()}</small>
                    {a.acknowledged_at && (
                      <small style={{ display: 'block', color: '#10b981' }}>
                        ✓ Acknowledged by District Officer at {new Date(a.acknowledged_at).toLocaleTimeString()}
                      </small>
                    )}
                  </div>

                  {a.status === 'ACTIVE' && (
                    <div className="alert-actions">
                      <button className="btn-ack" onClick={() => handleAlertStatus(a.id, 'ACKNOWLEDGED')}>
                        Acknowledge Alert
                      </button>
                      <button className="btn-resolve" onClick={() => handleAlertStatus(a.id, 'RESOLVED')}>
                        Resolve Hazard
                      </button>
                    </div>
                  )}

                  {a.status === 'ACKNOWLEDGED' && (
                    <div className="alert-actions">
                      <button className="btn-resolve" onClick={() => handleAlertStatus(a.id, 'RESOLVED')}>
                        Resolve Hazard
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
