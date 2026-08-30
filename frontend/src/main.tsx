import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import axios, { AxiosError } from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, MapPinned, Route, ShieldCheck, Users, CloudRain, Play, Send, Loader2, WifiOff, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './style.css';

/* ── API client with retry for Render cold-starts ── */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_BASE, timeout: 60_000 });

async function apiGet(url: string, retries = 3, delay = 5000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await api.get(url);
      return res.data;
    } catch (err) {
      const isLastAttempt = i === retries - 1;
      if (isLastAttempt) throw err;
      // On network errors / 5xx, wait and retry (Render cold-start)
      const status = (err as AxiosError)?.response?.status;
      if (status && status < 500) throw err; // 4xx errors are not retryable
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

/* ── Types ── */
type Zone = {
  id: string; name: string; lat: number; lng: number;
  risk_score: number; risk_level: string;
  rainfall_24h: number; slope_deg: number; soil_moisture: number;
};

const colors: Record<string, string> = {
  LOW: '#22c55e', MODERATE: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444',
};

type ConnectionStatus = 'connecting' | 'connected' | 'error' | 'cold-start';

/* ── App ── */
function App() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [summary, setSummary] = useState<any>();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [route, setRoute] = useState<any>();
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('Resident');
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // First, check health endpoint to verify backend is reachable
      await api.get('/api/health');

      const [z, s, a, r, t] = await Promise.all([
        apiGet('/api/zones'),
        apiGet('/api/risk-summary'),
        apiGet('/api/alerts'),
        apiGet('/api/reports'),
        apiGet('/api/risk-trends'),
      ]);
      setZones(z); setSummary(s); setAlerts(a); setReports(r); setTrends(t);
      setStatus('connected');
      setMessage('');
    } catch (err) {
      const axErr = err as AxiosError;
      if (!axErr.response) {
        // Network error — either CORS blocked, backend down, or cold-starting
        if (status === 'connecting') {
          setStatus('cold-start');
          setMessage('⏳ Backend is waking up (Render free tier cold-start). This may take 30–50 seconds. Retrying automatically…');
          // Auto-retry after delay
          setTimeout(() => load(), 8000);
          return;
        }
        setStatus('error');
        setMessage('Unable to reach the API server. Please check that the backend is deployed and running.');
      } else {
        setStatus('error');
        setMessage(`API error: ${axErr.response.status} — ${axErr.response.statusText}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async () => {
    try {
      await api.post('/api/demo/emergency');
      setMessage('✅ Emergency scenario complete: rainfall, risk, alert and verified reports updated.');
      load();
    } catch {
      setMessage('Failed to run emergency scenario. Check backend connection.');
    }
  };

  const find = async () => {
    try {
      const r = await api.get('/api/safe-route', {
        params: { start_lat: 25.58, start_lng: 91.89, end_lat: 25.67, end_lng: 94.11 },
      });
      setRoute(r.data);
      setMessage(r.data.recommendation);
    } catch {
      setMessage('Failed to find safe route. Check backend connection.');
    }
  };

  const submit = async (e: any) => {
    e.preventDefault();
    try {
      const f = new FormData(e.currentTarget);
      await api.post('/api/reports', {
        report_type: f.get('type'),
        description: f.get('description'),
        severity: f.get('severity'),
        latitude: 25.58, longitude: 91.89,
      });
      setMessage('✅ Report submitted for moderation.');
      e.currentTarget.reset();
      load();
    } catch {
      setMessage('Failed to submit report. Check backend connection.');
    }
  };

  /* ── Connection Banner ── */
  const ConnectionBanner = () => {
    if (status === 'connected') return null;
    if (status === 'cold-start') return (
      <div className="notice cold-start">
        <Loader2 size={18} className="spin" />
        <span>Backend is waking up — free-tier services sleep after 15 min of inactivity. Retrying automatically…</span>
      </div>
    );
    if (status === 'error') return (
      <div className="notice error-banner">
        <WifiOff size={18} />
        <span>Unable to reach API at <code>{API_BASE}</code></span>
        <button onClick={load} className="retry-btn"><RefreshCw size={14} /> Retry</button>
      </div>
    );
    return (
      <div className="notice connecting">
        <Loader2 size={18} className="spin" />
        <span>Connecting to backend…</span>
      </div>
    );
  };

  return (
    <div className="shell">
      <aside>
        <div className="brand"><ShieldCheck /> SLOPE<span>SAFE</span></div>
        <p className="tag">LANDSLIDE EARLY WARNING</p>
        {['Dashboard', 'Risk Map', 'Safe Route', 'Community Reports', 'Alerts', 'Analytics'].map(x => (
          <a key={x} href={'#' + x}>{x}</a>
        ))}
        <div className="role">
          <small>DEMO ROLE</small>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option>Resident</option><option>Authority</option>
          </select>
        </div>
      </aside>

      <main>
        <header>
          <div>
            <p className="eyebrow">NORTH EASTERN REGION · SYNTHETIC DEMO DATA</p>
            <h1>Situational awareness, before the slope moves.</h1>
          </div>
          <button className="scenario" onClick={run} disabled={status !== 'connected'}>
            <Play size={16} /> Run Emergency Scenario
          </button>
        </header>

        <ConnectionBanner />

        {message && status === 'connected' && (
          <div className="notice">
            {message}
            <button onClick={() => setMessage('')}>×</button>
          </div>
        )}

        <section className="hero">
          <div>
            <p>OVERALL RISK</p>
            <strong className={'risk ' + (summary?.overall_level || 'LOW')}>
              {loading && !summary ? 'Loading' : summary?.overall_level || '—'}{' '}
              <small>{summary?.overall_score ?? '—'}/100</small>
            </strong>
            <span>Updated from environment + verified community signals</span>
          </div>
          <div className="quick">
            <button onClick={find} disabled={status !== 'connected'}><Route /> Find safest route</button>
            <button onClick={() => document.getElementById('report')?.scrollIntoView()}><Send /> Report a hazard</button>
          </div>
        </section>

        <section className="stats">
          {([
            [MapPinned, 'Monitored zones', summary?.total_zones],
            [AlertTriangle, 'High-risk zones', summary?.high_risk_zones],
            [Users, 'Active reports', summary?.active_reports],
            [CloudRain, 'Active alerts', summary?.active_alerts],
          ] as [any, string, any][]).map(([I, l, v]) => (
            <div className="card" key={l}><I /><small>{l}</small><b>{v ?? '—'}</b></div>
          ))}
        </section>

        <section className="grid">
          <div className="panel map">
            <div className="panelhead">
              <h2>Live risk map</h2>
              <span>● Demo data</span>
            </div>
            <MapContainer center={[25.6, 92.7]} zoom={6} scrollWheelZoom className="leaf">
              <TileLayer
                attribution="© OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {zones.map(z => (
                <CircleMarker key={z.id} center={[z.lat, z.lng]} radius={14}
                  pathOptions={{ color: colors[z.risk_level], fillOpacity: .65 }}>
                  <Popup>
                    <b>{z.name}</b><br />
                    {z.risk_level} · {z.risk_score}/100<br />
                    Rainfall: {z.rainfall_24h} mm / 24h
                  </Popup>
                </CircleMarker>
              ))}
              {reports.map((r: any) => (
                <CircleMarker key={r.id} center={[r.latitude, r.longitude]} radius={7}
                  pathOptions={{ color: r.status === 'VERIFIED' ? '#7c3aed' : '#64748b' }}>
                  <Popup>{r.report_type}: {r.status}</Popup>
                </CircleMarker>
              ))}
              {route && <Polyline positions={route.route} pathOptions={{ color: '#14b8a6', weight: 5 }} />}
            </MapContainer>
            <div className="legend">
              {Object.entries(colors).map(([x, c]) => (
                <span key={x} style={{ borderColor: c }}>{x}</span>
              ))}
            </div>
          </div>

          <div className="panel trend">
            <h2>Risk trend · 72h</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trends}>
                <XAxis dataKey="hour" /><YAxis /><Tooltip />
                <Line type="monotone" dataKey="risk" stroke="#f97316" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
            <p>Model estimates, not an official government warning.</p>
          </div>
        </section>

        {route && (
          <section className="route">
            <Route />
            <div>
              <b>Safest route found</b>
              <p>{route.distance_km} km · ~{route.duration_minutes} min · exposure {route.risk_exposure}/100 · {route.high_risk_zones} high-risk zones crossed</p>
            </div>
            <span>{route.source}</span>
          </section>
        )}

        <section className="bottom">
          <div className="panel">
            <h2>Active alerts</h2>
            {alerts.length ? alerts.map((a: any) => (
              <div className="alert" key={a.id}>
                <AlertTriangle />
                <div><b>{a.title}</b><p>{a.message}</p></div>
                <em>{a.severity}</em>
              </div>
            )) : <p className="muted">No active alerts. Conditions are being monitored.</p>}
          </div>

          <form id="report" className="panel" onSubmit={submit}>
            <h2>Report ground conditions</h2>
            <p>Do you see signs of possible landslide activity near you?</p>
            <label>Warning sign
              <select name="type">
                <option>CRACK</option><option>WATER_SEEPAGE</option>
                <option>SLOPE_MOVEMENT</option><option>FALLING_DEBRIS</option><option>OTHER</option>
              </select>
            </label>
            <label>Severity
              <select name="severity">
                <option>MODERATE</option><option>HIGH</option><option>CRITICAL</option>
              </select>
            </label>
            <label>Description
              <textarea name="description" minLength={3} required placeholder="Describe what you see…" />
            </label>
            <button className="submit" type="submit" disabled={status !== 'connected'}>
              <Send size={16} /> Submit report
            </button>
          </form>
        </section>

        <footer>
          This system is a prototype decision-support tool. Risk predictions are estimates and should not
          replace official government warnings, geological assessments, or emergency instructions.
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
