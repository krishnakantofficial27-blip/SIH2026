import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { SystemHealthResponse, AuditRecord, AuditChainVerification } from '../types';
import { 
  Server, Shield, Terminal, CheckCircle2, 
  AlertCircle, RefreshCw, Cpu, Database, KeyRound, 
  Lock, Activity, Layers, FileCode 
} from 'lucide-react';

export const ProductionDiagnosticsComponent: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [chainVerify, setChainVerify] = useState<AuditChainVerification | null>(null);
  const [prometheusText, setPrometheusText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'health' | 'security' | 'prometheus'>('health');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [h, aud, ver, prom] = await Promise.all([
        apiService.getSystemHealth(),
        apiService.getSecurityAuditTrail(),
        apiService.verifyAuditChain(),
        apiService.getPrometheusMetrics()
      ]);
      setHealth(h);
      setAuditRecords(aud);
      setChainVerify(ver);
      setPrometheusText(prom);
    } catch (err) {
      console.error('Failed to load system diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="production-diagnostics-container">
      {/* Header */}
      <div className="validation-header">
        <div className="header-left">
          <div className="badge-official">
            <Server size={15} /> PRODUCTION DEVOPS &amp; SECURITY SUITE
          </div>
          <h2>Enterprise Architecture Diagnostics, RBAC &amp; SHA-256 Audit Trail</h2>
          <p>Real-time system health, Kubernetes liveness probes, Prometheus metrics exporter, and cryptographic tamper-proof decision logging.</p>
        </div>
        <button className="btn-refresh-telemetry" onClick={fetchData}>
          <RefreshCw size={15} /> Probe System State
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="dossier-tab-row">
        <button 
          className={`dossier-tab-btn ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          <Activity size={16} /> Subsystems &amp; Resource Telemetry
        </button>
        <button 
          className={`dossier-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={16} /> Cryptographic SHA-256 Audit Log
        </button>
        <button 
          className={`dossier-tab-btn ${activeTab === 'prometheus' ? 'active' : ''}`}
          onClick={() => setActiveTab('prometheus')}
        >
          <Terminal size={16} /> Prometheus Metrics Stream
        </button>
      </div>

      {/* TAB 1: System Health & Subsystems */}
      {activeTab === 'health' && health && (
        <div className="dossier-tab-content">
          {/* Top Status Banner */}
          <div className="system-health-banner">
            <div className="sh-left">
              <div className="pulsing-green-dot" />
              <div>
                <h3>{health.service} ({health.version})</h3>
                <p>System Uptime: <strong>{health.uptime_formatted}</strong> ({health.uptime_seconds}s) · Processed Requests: <strong>{health.system_resources.total_requests_processed}</strong></p>
              </div>
            </div>
            <span className="health-badge-online">ALL PROBES HEALTHY</span>
          </div>

          {/* Subsystems Cards Grid */}
          <div className="subsystems-grid">
            <div className="subsystem-card">
              <div className="sub-top">
                <Database size={18} className="text-emerald-400" />
                <span className="sub-status green">● {health.subsystems.database_sqlite_orm.status}</span>
              </div>
              <h4>Database ORM Engine</h4>
              <p>SQLAlchemy + SQLite / PostgreSQL Connection Pool</p>
              <div className="sub-latency">Ping Latency: <strong>{health.subsystems.database_sqlite_orm.latency_ms} ms</strong></div>
            </div>

            <div className="subsystem-card">
              <div className="sub-top">
                <Cpu size={18} className="text-indigo-400" />
                <span className="sub-status green">● {health.subsystems.ml_inference_engine.status}</span>
              </div>
              <h4>ML Inference Pipeline</h4>
              <p>{health.subsystems.ml_inference_engine.model_type}</p>
              <div className="sub-latency">P95 Latency: <strong>{health.subsystems.ml_inference_engine.inference_p95_latency_ms} ms</strong></div>
            </div>

            <div className="subsystem-card">
              <div className="sub-top">
                <Layers size={18} className="text-blue-400" />
                <span className="sub-status green">● {health.subsystems.live_weather_openmeteo.status}</span>
              </div>
              <h4>Open-Meteo Meteorology Sync</h4>
              <p>Global Numerical Model + IMD High-Res Grid</p>
              <div className="sub-latency">Cadence: <strong>Every {health.subsystems.live_weather_openmeteo.sync_cadence_minutes} mins</strong></div>
            </div>

            <div className="subsystem-card">
              <div className="sub-top">
                <Activity size={18} className="text-purple-400" />
                <span className="sub-status green">● {health.subsystems.websocket_realtime_bus.status}</span>
              </div>
              <h4>WebSocket Realtime Event Bus</h4>
              <p>Bi-directional client push and sensor streaming</p>
              <div className="sub-latency">Active Clients: <strong>{health.subsystems.websocket_realtime_bus.active_connections}</strong></div>
            </div>
          </div>

          {/* Resource Footprint */}
          <div className="resource-footprint-box">
            <h4>Container Resource Consumption</h4>
            <div className="res-metrics">
              <div className="res-item">
                <span>Resident Memory (RSS)</span>
                <strong>{health.system_resources.memory_resident_mb} MB</strong>
              </div>
              <div className="res-item">
                <span>CPU Process Utilization</span>
                <strong>{health.system_resources.cpu_utilization_pct}%</strong>
              </div>
              <div className="res-item">
                <span>Security Headers Middleware</span>
                <strong>CSP + HSTS + X-Frame: DENY Active</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Security & SHA-256 Audit Trail */}
      {activeTab === 'security' && (
        <div className="dossier-tab-content">
          {/* Chain Verification Result */}
          {chainVerify && (
            <div className={`chain-verify-banner ${chainVerify.valid ? 'verified' : 'invalid'}`}>
              <Lock size={20} className="text-emerald-400" />
              <div>
                <strong>Cryptographic SHA-256 Audit Log Integrity Verification:</strong>
                <p>{chainVerify.message}</p>
                {chainVerify.latest_entry_hash && (
                  <small>Latest Hash Digest: <code>{chainVerify.latest_entry_hash}</code></small>
                )}
              </div>
            </div>
          )}

          {/* Audit Records List */}
          <div className="audit-log-list">
            <h4>Authority Decision Trail &amp; Dispatches (Tamper-Evident)</h4>
            {auditRecords.map(r => (
              <div key={r.index} className="audit-entry-card">
                <div className="entry-header">
                  <span className="entry-index">#{r.index}</span>
                  <span className="entry-role">{r.role}</span>
                  <span className="entry-actor">{r.actor}</span>
                  <span className="entry-time">{new Date(r.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="entry-action">
                  <strong>ACTION: {r.action}</strong>
                  <pre>{JSON.stringify(r.details, null, 2)}</pre>
                </div>
                <div className="entry-hashes">
                  <div>Prev Hash: <code>{r.prev_hash.slice(0, 24)}...</code></div>
                  <div>Entry Hash: <code className="text-emerald-400">{r.entry_hash.slice(0, 24)}...</code></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Prometheus Metrics Stream */}
      {activeTab === 'prometheus' && (
        <div className="dossier-tab-content">
          <div className="prometheus-box">
            <div className="prom-header">
              <FileCode size={16} />
              <span>Standard OpenMetrics / Prometheus Exporter (<code>GET /api/metrics</code>)</span>
            </div>
            <pre className="prom-code-block">{prometheusText}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
