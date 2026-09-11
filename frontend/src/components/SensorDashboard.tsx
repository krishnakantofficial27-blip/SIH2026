import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Thermometer, Droplets, Wind, Mountain, Radio, Gauge, RefreshCw, Zap } from 'lucide-react';
import { apiService } from '../services/api';
import { SensorReading } from '../types';

export const SensorDashboard: React.FC = () => {
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<string>('CONNECTING');
  const [loading, setLoading] = useState(false);

  const fetchTelemetry = useCallback(async () => {
    try {
      const data = await apiService.getSensors();
      if (data && data.sensors) {
        setSensors(data.sensors);
        setNetworkStatus(data.network_status || 'ONLINE');
        setLastUpdate(new Date());
      }
    } catch {
      setNetworkStatus('OFFLINE_FALLBACK');
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchTelemetry]);


  const statusColor = (s: string) => s === 'critical' ? '#ef4444' : s === 'warning' ? '#eab308' : '#22c55e';
  const trendArrow = (t: string) => t === 'up' ? '↑' : t === 'down' ? '↓' : '→';

  const criticalCount = sensors.filter(s => s.status === 'critical').length;
  const warningCount = sensors.filter(s => s.status === 'warning').length;

  return (
    <div className="sensor-dashboard">
      <div className="sensor-header">
        <Activity size={24} className="brand-icon" />
        <div>
          <h2>IoT Sensor Network Dashboard</h2>
          <p>Real-time instrumentation data from distributed field sensors across monitored zones</p>
        </div>
      </div>

      <div className="sensor-status-bar">
        <div className="sensor-status-item">
          <Radio size={14} /> <strong>{sensors.length}</strong> Active Sensors
        </div>
        {criticalCount > 0 && (
          <div className="sensor-status-item critical">
            <span className="pulse-dot critical"></span>
            <strong>{criticalCount}</strong> Critical
          </div>
        )}
        {warningCount > 0 && (
          <div className="sensor-status-item warning">
            <span className="pulse-dot warning"></span>
            <strong>{warningCount}</strong> Warning
          </div>
        )}
        <div className="sensor-status-item" style={{ marginLeft: 'auto', fontSize: 11 }}>
          Last Update: {lastUpdate.toLocaleTimeString()}
        </div>
        <label className="auto-refresh-toggle">
          <input type="checkbox" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} />
          Auto-refresh (5s)
        </label>
        <button className="refresh-btn-mini" onClick={() => fetchTelemetry()} title="Fetch Live Telemetry">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="sensor-grid">
        {sensors.map(s => {
          const pct = Math.min(100, ((s.value - s.min) / (s.max - s.min)) * 100);
          const warnPct = ((s.threshold_warn - s.min) / (s.max - s.min)) * 100;
          const critPct = ((s.threshold_crit - s.min) / (s.max - s.min)) * 100;

          return (
            <div key={s.id} className={`sensor-card ${s.status}`}>
              <div className="sensor-card-header">
                <span className="sensor-icon">{s.icon}</span>
                <div>
                  <strong>{s.label}</strong>
                  <span className="sensor-id">ID: {s.id.toUpperCase()}</span>
                </div>
                <span className="status-badge" style={{ background: statusColor(s.status) }}>
                  {s.status.toUpperCase()}
                </span>
              </div>

              <div className="sensor-value-row">
                <span className="sensor-big-value" style={{ color: statusColor(s.status) }}>
                  {typeof s.value === 'number' && s.value < 10 ? s.value.toFixed(2) : s.value.toFixed(1)}
                </span>
                <span className="sensor-unit">{s.unit}</span>
                <span className={`trend-indicator ${s.trend}`}>{trendArrow(s.trend)}</span>
              </div>

              <div className="sensor-gauge-bar">
                <div className="gauge-track">
                  <div className="gauge-fill" style={{ width: `${pct}%`, background: statusColor(s.status) }}></div>
                  <div className="threshold-mark warn" style={{ left: `${warnPct}%` }} title="Warning threshold"></div>
                  <div className="threshold-mark crit" style={{ left: `${critPct}%` }} title="Critical threshold"></div>
                </div>
                <div className="gauge-labels">
                  <span>{s.min}</span>
                  <span>{s.max} {s.unit}</span>
                </div>
              </div>

              <div className="sensor-sparkline">
                {s.history.map((v, i) => {
                  const h = Math.max(4, ((v - s.min) / (s.max - s.min)) * 28);
                  return <div key={i} className="spark-bar" style={{ height: h, background: statusColor(v >= s.threshold_crit ? 'critical' : v >= s.threshold_warn ? 'warning' : 'normal') }}></div>;
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sensor-footer-note">
        <Radio size={14} />
        <span>Simulated IoT telemetry for prototype demonstration. In production, integrates with LoRaWAN/NB-IoT edge gateways deployed at each monitored zone.</span>
      </div>
    </div>
  );
};
