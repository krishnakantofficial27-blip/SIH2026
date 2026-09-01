import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Droplets, Wind, Mountain, Radio, Gauge, RefreshCw } from 'lucide-react';

interface SensorReading {
  id: string;
  label: string;
  icon: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  min: number;
  max: number;
  threshold_warn: number;
  threshold_crit: number;
  history: number[];
}

const generateSensorData = (): SensorReading[] => {
  const jitter = (base: number, range: number) => +(base + (Math.random() - 0.5) * range).toFixed(1);
  const histGen = (base: number, range: number, count: number) =>
    Array.from({ length: count }, () => jitter(base, range));

  const sensors: SensorReading[] = [
    {
      id: 'rain-gauge', label: 'Rain Gauge (Tipping Bucket)', icon: '🌧️',
      value: jitter(14.2, 8), unit: 'mm/h', status: 'normal', trend: 'up',
      min: 0, max: 60, threshold_warn: 20, threshold_crit: 40,
      history: histGen(14.2, 10, 12),
    },
    {
      id: 'soil-moisture', label: 'Soil Moisture Sensor (TDR)', icon: '💧',
      value: jitter(0.54, 0.2), unit: '%vol', status: 'warning', trend: 'up',
      min: 0, max: 1.0, threshold_warn: 0.50, threshold_crit: 0.75,
      history: histGen(0.54, 0.15, 12),
    },
    {
      id: 'inclinometer', label: 'Inclinometer (Slope Tilt)', icon: '📐',
      value: jitter(2.4, 1.5), unit: '°/day', status: 'normal', trend: 'stable',
      min: 0, max: 10, threshold_warn: 3.0, threshold_crit: 6.0,
      history: histGen(2.4, 1, 12),
    },
    {
      id: 'piezometer', label: 'Piezometer (Pore Pressure)', icon: '⬆️',
      value: jitter(148, 40), unit: 'kPa', status: 'normal', trend: 'up',
      min: 50, max: 350, threshold_warn: 180, threshold_crit: 280,
      history: histGen(148, 30, 12),
    },
    {
      id: 'extensometer', label: 'Extensometer (Crack Width)', icon: '↔️',
      value: jitter(3.8, 2), unit: 'mm', status: 'normal', trend: 'stable',
      min: 0, max: 20, threshold_warn: 6.0, threshold_crit: 12.0,
      history: histGen(3.8, 2, 12),
    },
    {
      id: 'seismic', label: 'Seismic Geophone', icon: '〰️',
      value: jitter(0.12, 0.1), unit: 'mm/s', status: 'normal', trend: 'stable',
      min: 0, max: 2.0, threshold_warn: 0.5, threshold_crit: 1.2,
      history: histGen(0.12, 0.08, 12),
    },
    {
      id: 'temperature', label: 'Ambient Temperature', icon: '🌡️',
      value: jitter(22.5, 4), unit: '°C', status: 'normal', trend: 'down',
      min: 5, max: 45, threshold_warn: 35, threshold_crit: 42,
      history: histGen(22.5, 3, 12),
    },
    {
      id: 'wind-speed', label: 'Anemometer (Wind)', icon: '💨',
      value: jitter(18, 12), unit: 'km/h', status: 'normal', trend: 'up',
      min: 0, max: 120, threshold_warn: 50, threshold_crit: 90,
      history: histGen(18, 10, 12),
    },
  ];

  // Update status based on thresholds
  return sensors.map(s => ({
    ...s,
    status: s.value >= s.threshold_crit ? 'critical' : s.value >= s.threshold_warn ? 'warning' : 'normal',
  }));
};

export const SensorDashboard: React.FC = () => {
  const [sensors, setSensors] = useState<SensorReading[]>(generateSensorData());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setSensors(generateSensorData());
      setLastUpdate(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

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
        <button className="refresh-btn-mini" onClick={() => { setSensors(generateSensorData()); setLastUpdate(new Date()); }}>
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
