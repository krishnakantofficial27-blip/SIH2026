import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { HistoricalDisasterRecord, DataSourcesAudit } from '../types';
import { 
  Database, ShieldCheck, MapPin, Calendar, 
  AlertTriangle, Filter, RefreshCw, CheckCircle2, 
  ExternalLink, Layers, Waves 
} from 'lucide-react';

export const RealDataCatalogComponent: React.FC = () => {
  const [disasters, setDisasters] = useState<HistoricalDisasterRecord[]>([]);
  const [audit, setAudit] = useState<DataSourcesAudit | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<HistoricalDisasterRecord | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cat, aud] = await Promise.all([
        apiService.getGSINASACatalog(stateFilter),
        apiService.getDataSourcesAudit()
      ]);
      setDisasters(cat);
      setAudit(aud);
      if (cat.length > 0 && !selectedRecord) {
        setSelectedRecord(cat[0]);
      }
    } catch (err) {
      console.error('Failed to load real data catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [stateFilter]);

  return (
    <div className="real-data-catalog-container">
      {/* Header */}
      <div className="validation-header">
        <div className="header-left">
          <div className="badge-official">
            <Database size={15} /> CANONICAL DISASTER INVENTORY
          </div>
          <h2>Geological Survey of India (GSI) &amp; NASA Historical Disaster Catalog</h2>
          <p>Authentic multi-decadal landslide database tracking ground truth coordinates, 24h peak rainfall triggers, soil lithology, and post-disaster audits.</p>
        </div>
        <button className="btn-refresh-telemetry" onClick={fetchData}>
          <RefreshCw size={15} /> Sync Real Catalog
        </button>
      </div>

      {/* Data Provenance & Ingestion Live Audit */}
      {audit && (
        <div className="data-provenance-section">
          <h3>📡 Multi-Stream Telemetry Provenance &amp; Freshness Audit</h3>
          <div className="provenance-grid">
            {audit.data_streams.map(ds => (
              <div key={ds.stream_id} className="stream-audit-card">
                <div className="stream-top">
                  <span className="stream-badge live">● {ds.status}</span>
                  <span className="reliability-tag">{(ds.reliability_index * 100).toFixed(1)}% SLA</span>
                </div>
                <h4>{ds.source}</h4>
                <p className="stream-type"><strong>Telemetry:</strong> {ds.telemetry_type}</p>
                <div className="stream-meta">
                  <span><strong>Grid:</strong> {ds.resolution}</span>
                  <span><strong>Update:</strong> {ds.update_frequency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Content Split View */}
      <div className="catalog-toolbar">
        <div className="filter-group">
          <Filter size={16} />
          <label>Filter by State / Region:</label>
          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
            <option value="ALL">All National Mountain Belts</option>
            <option value="Kerala">Kerala (Western Ghats)</option>
            <option value="Maharashtra">Maharashtra (Konkan Ghats)</option>
            <option value="Uttarakhand">Uttarakhand (Garhwal/Kumaon)</option>
            <option value="Himachal Pradesh">Himachal Pradesh (Mandi/Kangra)</option>
            <option value="Manipur">Manipur (North-East Ranges)</option>
            <option value="Sikkim">Sikkim (Eastern Himalayas)</option>
          </select>
        </div>
        <span className="catalog-count-badge">
          Showing <strong>{disasters.length}</strong> Verified Historical Ground Truth Disasters
        </span>
      </div>

      <div className="catalog-split-view">
        {/* Left Side: Table of Historical Disasters */}
        <div className="disaster-table-wrapper">
          <table className="institutional-table interactive">
            <thead>
              <tr>
                <th>ID</th>
                <th>Disaster Event</th>
                <th>State &amp; District</th>
                <th>Date / Year</th>
                <th>24h Peak Rain</th>
                <th>Fatalities</th>
              </tr>
            </thead>
            <tbody>
              {disasters.map(d => (
                <tr 
                  key={d.id} 
                  className={selectedRecord?.id === d.id ? 'active-row' : ''}
                  onClick={() => setSelectedRecord(d)}
                >
                  <td><code>{d.id}</code></td>
                  <td>
                    <strong>{d.name}</strong>
                    <div className="text-xs text-slate-400">{d.type}</div>
                  </td>
                  <td>{d.district} ({d.state})</td>
                  <td>{d.date || d.year}</td>
                  <td><span className="rain-tag">{d.peak_rainfall_24h_mm} mm</span></td>
                  <td><strong className="text-red-400">{d.fatalities > 0 ? `${d.fatalities} victims` : '0 (Evacuated)'}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Side: Selected Record Geological Dossier */}
        {selectedRecord && (
          <div className="record-inspector-card">
            <div className="inspector-badge">
              <CheckCircle2 size={15} /> GSI GROUND-TRUTH VERIFIED
            </div>
            <h3>{selectedRecord.name}</h3>
            <p className="record-location">
              <MapPin size={15} /> {selectedRecord.location} — {selectedRecord.district}, {selectedRecord.state}
            </p>
            <p className="record-coords">
              GPS: <strong>{selectedRecord.lat.toFixed(4)}°N, {selectedRecord.lng.toFixed(4)}°E</strong>
            </p>

            <div className="record-metrics-grid">
              <div className="rec-metric">
                <span className="rm-label">24h Peak Precipitation</span>
                <span className="rm-val text-blue-400">{selectedRecord.peak_rainfall_24h_mm} mm</span>
              </div>
              <div className="rec-metric">
                <span className="rm-label">7-Day Antecedent Rain</span>
                <span className="rm-val text-indigo-400">{selectedRecord.antecedent_7d_rainfall_mm} mm</span>
              </div>
              <div className="rec-metric">
                <span className="rm-label">Terrain Slope Incline</span>
                <span className="rm-val text-orange-400">{selectedRecord.slope_deg}° Gradient</span>
              </div>
              <div className="rec-metric">
                <span className="rm-label">Reported Fatalities</span>
                <span className="rm-val text-red-400">{selectedRecord.fatalities} Recorded</span>
              </div>
            </div>

            <div className="geological-field">
              <strong>Geotechnical Soil &amp; Bedrock Lithology:</strong>
              <p>{selectedRecord.soil_type}</p>
            </div>

            <div className="geological-field">
              <strong>Primary Physical Trigger:</strong>
              <p>{selectedRecord.trigger}</p>
            </div>

            <div className="geological-field">
              <strong>Impact &amp; Inundation Scope:</strong>
              <p>{selectedRecord.damage_scope}</p>
            </div>

            <div className="source-citation">
              <strong>Source Authority:</strong> {selectedRecord.source_agency}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
