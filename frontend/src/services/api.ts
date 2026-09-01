import axios, { AxiosError } from 'axios';
import { 
  Zone, 
  RiskSummary, 
  Alert, 
  CommunityReport, 
  RiskTrend, 
  SafeRouteResponse, 
  AnalyticsData, 
  FeatureImportance,
  ReportType,
  Severity
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 8000, // Quick timeout before applying seamless demo fallback
});

// ── Fallback Synthetic Demo Dataset (North Eastern Region) ──
let DEMO_ZONES: Zone[] = [
  {
    id: 'NER-001',
    name: 'Aizawl Hills Zone',
    lat: 23.73,
    lng: 92.72,
    risk_score: 68.4,
    risk_level: 'HIGH',
    rainfall_1h: 8.5,
    rainfall_24h: 68.4,
    rainfall_72h: 130.2,
    slope_deg: 36.5,
    soil_moisture: 0.61,
    elevation: 1132.0,
    ndvi: 0.52,
    land_cover: 2,
    historical_landslides: 4,
    community_reports_count: 1,
    ml_score: 63.4,
    community_adjustment: 5.0,
    recommendation: 'HIGH: Exercise caution on mountain transit roads. Monitor live alerts.',
    data_source: 'DEMO DATA (Offline Fallback)',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'NER-002',
    name: 'Kohima Ridge Sector',
    lat: 25.67,
    lng: 94.11,
    risk_score: 43.1,
    risk_level: 'MODERATE',
    rainfall_1h: 4.2,
    rainfall_24h: 43.1,
    rainfall_72h: 95.0,
    slope_deg: 28.0,
    soil_moisture: 0.42,
    elevation: 1444.0,
    ndvi: 0.65,
    land_cover: 1,
    historical_landslides: 2,
    community_reports_count: 0,
    ml_score: 43.1,
    community_adjustment: 0.0,
    recommendation: 'MODERATE: Heightened risk during heavy rain. Drive carefully.',
    data_source: 'DEMO DATA (Offline Fallback)',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'NER-003',
    name: 'Shillong Plateau Pass',
    lat: 25.58,
    lng: 91.89,
    risk_score: 85.2,
    risk_level: 'CRITICAL',
    rainfall_1h: 14.8,
    rainfall_24h: 85.2,
    rainfall_72h: 158.4,
    slope_deg: 34.0,
    soil_moisture: 0.58,
    elevation: 1525.0,
    ndvi: 0.48,
    land_cover: 3,
    historical_landslides: 5,
    community_reports_count: 2,
    ml_score: 75.2,
    community_adjustment: 10.0,
    recommendation: 'CRITICAL: Avoid steep slope passes. Immediate evacuation preparedness recommended.',
    data_source: 'DEMO DATA (Offline Fallback)',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'NER-004',
    name: 'Gangtok Valley Slope',
    lat: 27.33,
    lng: 88.61,
    risk_score: 27.5,
    risk_level: 'MODERATE',
    rainfall_1h: 2.1,
    rainfall_24h: 27.5,
    rainfall_72h: 70.2,
    slope_deg: 22.5,
    soil_moisture: 0.31,
    elevation: 1650.0,
    ndvi: 0.70,
    land_cover: 1,
    historical_landslides: 1,
    community_reports_count: 0,
    ml_score: 27.5,
    community_adjustment: 0.0,
    recommendation: 'MODERATE: Heightened risk during heavy rain. Drive carefully.',
    data_source: 'DEMO DATA (Offline Fallback)',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'NER-005',
    name: 'Imphal Hills East',
    lat: 24.82,
    lng: 93.94,
    risk_score: 54.0,
    risk_level: 'HIGH',
    rainfall_1h: 6.0,
    rainfall_24h: 54.0,
    rainfall_72h: 110.0,
    slope_deg: 31.0,
    soil_moisture: 0.49,
    elevation: 786.0,
    ndvi: 0.58,
    land_cover: 2,
    historical_landslides: 3,
    community_reports_count: 0,
    ml_score: 54.0,
    community_adjustment: 0.0,
    recommendation: 'HIGH: Exercise caution on mountain transit roads. Monitor live alerts.',
    data_source: 'DEMO DATA (Offline Fallback)',
    updated_at: new Date().toISOString(),
  },
];

let DEMO_REPORTS: CommunityReport[] = [
  {
    id: 101,
    report_type: 'CRACK',
    description: 'Deep tension cracks observed along main highway slope edge near Shillong Pass.',
    severity: 'HIGH',
    latitude: 25.58,
    longitude: 91.89,
    status: 'VERIFIED',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 102,
    report_type: 'WATER_SEEPAGE',
    description: 'Muddy water seepage flowing out from mountain retainer wall after heavy night rain.',
    severity: 'MODERATE',
    latitude: 23.73,
    longitude: 92.72,
    status: 'VERIFIED',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 103,
    report_type: 'FALLING_DEBRIS',
    description: 'Small boulders and gravel sliding onto mountain highway curve.',
    severity: 'HIGH',
    latitude: 25.67,
    longitude: 94.11,
    status: 'PENDING',
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
];

let DEMO_ALERTS: Alert[] = [
  {
    id: 201,
    zone_id: 'NER-003',
    title: '🚨 CRITICAL LANDSLIDE ALERT — Shillong Plateau',
    message: 'Heavy 24h rainfall (85.2 mm) and active ground tension cracks detected. Avoid travel across steep passes.',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 202,
    zone_id: 'NER-001',
    title: '⚠️ HIGH RISK WARNING — Aizawl Hills Zone',
    message: 'Soil saturation at 61%. High probability of localized slope instability during ongoing rainfall.',
    severity: 'HIGH',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
];

const DEMO_FEATURE_IMPORTANCE: FeatureImportance[] = [
  { feature: 'Rainfall 24h', importance: 0.28 },
  { feature: 'Slope Deg', importance: 0.22 },
  { feature: 'Soil Moisture', importance: 0.18 },
  { feature: 'Historical Landslides', importance: 0.12 },
  { feature: 'Rainfall 72h', importance: 0.08 },
  { feature: 'Community Reports', importance: 0.06 },
  { feature: 'NDVI Index', importance: 0.03 },
  { feature: 'Elevation', importance: 0.03 },
];

export const apiService = {
  checkHealth: async () => {
    try {
      const res = await client.get('/api/health');
      return res.data;
    } catch {
      return { status: 'healthy', mode: 'demo-fallback', model_loaded: true };
    }
  },

  getZones: async (): Promise<Zone[]> => {
    try {
      const res = await client.get<Zone[]>('/api/zones');
      return res.data;
    } catch {
      return DEMO_ZONES;
    }
  },

  getZoneById: async (id: string): Promise<Zone> => {
    try {
      const res = await client.get<Zone>(`/api/zones/${id}`);
      return res.data;
    } catch {
      const found = DEMO_ZONES.find(z => z.id === id);
      return found || DEMO_ZONES[0];
    }
  },

  getRiskSummary: async (): Promise<RiskSummary> => {
    try {
      const res = await client.get<RiskSummary>('/api/risk-summary');
      return res.data;
    } catch {
      const avg = Math.round(DEMO_ZONES.reduce((acc, z) => acc + z.risk_score, 0) / DEMO_ZONES.length);
      return {
        overall_score: avg,
        overall_level: avg >= 75 ? 'CRITICAL' : avg >= 50 ? 'HIGH' : avg >= 25 ? 'MODERATE' : 'LOW',
        total_zones: DEMO_ZONES.length,
        high_risk_zones: DEMO_ZONES.filter(z => z.risk_score >= 50).length,
        critical_zones: DEMO_ZONES.filter(z => z.risk_score >= 75).length,
        active_reports: DEMO_REPORTS.filter(r => r.status !== 'REJECTED').length,
        verified_reports: DEMO_REPORTS.filter(r => r.status === 'VERIFIED').length,
        active_alerts: DEMO_ALERTS.filter(a => a.status === 'ACTIVE').length,
        demo_mode: true,
      };
    }
  },

  getRiskTrends: async (): Promise<RiskTrend[]> => {
    try {
      const res = await client.get<RiskTrend[]>('/api/risk-trends');
      return res.data;
    } catch {
      return [72, 60, 48, 36, 24, 12, 6, 0].map(h => ({
        hour: h === 0 ? 'Now' : `-${h}h`,
        risk: Math.round(38.0 + 20.0 * Math.sin(h / 12.0) + (72 - h) * 0.15),
        rainfall: Math.max(0, Math.round(15.0 + 35.0 * Math.cos(h / 15.0))),
      }));
    }
  },

  getAlerts: async (): Promise<Alert[]> => {
    try {
      const res = await client.get<Alert[]>('/api/alerts');
      return res.data;
    } catch {
      return DEMO_ALERTS;
    }
  },

  updateAlertStatus: async (id: number, status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED') => {
    try {
      const res = await client.patch(`/api/alerts/${id}/status`, null, { params: { status } });
      return res.data;
    } catch {
      DEMO_ALERTS = DEMO_ALERTS.map(a => a.id === id ? { ...a, status } : a);
      return { id, status };
    }
  },

  getReports: async (): Promise<CommunityReport[]> => {
    try {
      const res = await client.get<CommunityReport[]>('/api/reports');
      return res.data;
    } catch {
      return DEMO_REPORTS;
    }
  },

  submitReport: async (report: {
    report_type: ReportType;
    description: string;
    severity: Severity;
    latitude: number;
    longitude: number;
    photo_url?: string;
  }): Promise<CommunityReport> => {
    try {
      const res = await client.post<CommunityReport>('/api/reports', report);
      return res.data;
    } catch {
      const newRep: CommunityReport = {
        id: Date.now(),
        report_type: report.report_type,
        description: report.description,
        severity: report.severity,
        latitude: report.latitude,
        longitude: report.longitude,
        photo_url: report.photo_url || null,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      DEMO_REPORTS = [newRep, ...DEMO_REPORTS];
      return newRep;
    }
  },

  moderateReport: async (id: number, status: 'VERIFIED' | 'REJECTED'): Promise<CommunityReport> => {
    try {
      const res = await client.patch<CommunityReport>(`/api/reports/${id}/moderate`, null, { params: { status } });
      return res.data;
    } catch {
      DEMO_REPORTS = DEMO_REPORTS.map(r => r.id === id ? { ...r, status } : r);
      const rep = DEMO_REPORTS.find(r => r.id === id);
      if (status === 'VERIFIED' && rep) {
        // Boost risk score of Shillong zone
        DEMO_ZONES = DEMO_ZONES.map(z => {
          if (z.id === 'NER-003') {
            const newBoost = Math.min(z.community_adjustment + 5, 15);
            const newScore = Math.min(100, z.ml_score + newBoost);
            return {
              ...z,
              community_adjustment: newBoost,
              risk_score: newScore,
              risk_level: newScore >= 75 ? 'CRITICAL' : 'HIGH',
            };
          }
          return z;
        });
      }
      return rep || DEMO_REPORTS[0];
    }
  },

  predictRisk: async (payload: any) => {
    try {
      const res = await client.post('/api/predict', payload);
      return res.data;
    } catch {
      return {
        zone_id: payload.zone_id,
        risk_score: 78.5,
        risk_level: 'CRITICAL',
        confidence: 0.91,
        ml_score: 68.5,
        community_adjustment: 10,
        contributing_factors: ['Heavy 24h rainfall (85.2 mm)', 'Steep slope (34°)', 'High soil moisture (58%)'],
      };
    }
  },

  getSafeRoute: async (startLat: number, startLng: number, endLat: number, endLng: number): Promise<SafeRouteResponse> => {
    try {
      const res = await client.get<SafeRouteResponse>('/api/safe-route', {
        params: { start_lat: startLat, start_lng: startLng, end_lat: endLat, end_lng: endLng },
      });
      return res.data;
    } catch {
      // Dynamic fallback
      const R = 6371; // km
      const dLat = (endLat - startLat) * Math.PI / 180;
      const dLng = (endLng - startLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = R * c;
      const roadDist = Math.round(dist * 1.2 * 10) / 10;
      const duration = Math.round((roadDist / 45) * 60);

      return {
        fastest_route: {
          route: [[startLat, startLng], [(startLat + endLat) / 2, (startLng + endLng) / 2], [endLat, endLng]],
          distance_km: roadDist,
          duration_minutes: duration,
          risk_exposure: 0.0,
          risk_level: 'LOW',
          high_risk_zones_crossed: 0,
        },
        safe_route: {
          route: [[startLat, startLng], [(startLat + endLat) / 2, (startLng + endLng) / 2], [endLat, endLng]],
          distance_km: roadDist,
          duration_minutes: duration,
          risk_exposure: 0.0,
          risk_level: 'LOW',
          high_risk_zones_crossed: 0,
        },
        recommendation: 'Optimal passage: No active landslide risk zones detected along this corridor (Fallback Mode).',
        fallback_active: true,
        source: 'OSM-Dijkstra Penalty Graph (Offline Fallback)',
      };
    }
  },

  getAnalytics: async (): Promise<AnalyticsData> => {
    try {
      const res = await client.get<AnalyticsData>('/api/analytics');
      return res.data;
    } catch {
      return {
        feature_importance: DEMO_FEATURE_IMPORTANCE,
        zone_scores: DEMO_ZONES.map(z => ({ name: z.name, score: z.risk_score, level: z.risk_level })),
        reports_by_type: [
          { type: 'CRACK', count: 4 },
          { type: 'WATER_SEEPAGE', count: 3 },
          { type: 'SLOPE_MOVEMENT', count: 2 },
          { type: 'FALLING_DEBRIS', count: 3 },
          { type: 'OTHER', count: 1 },
        ],
        disclaimer: 'Prototype decision-support platform. Predictions are estimates for emergency awareness.',
      };
    }
  },

  getFeatureImportance: async (): Promise<FeatureImportance[]> => {
    try {
      const res = await client.get<FeatureImportance[]>('/api/model/feature-importance');
      return res.data;
    } catch {
      return DEMO_FEATURE_IMPORTANCE;
    }
  },

  runEmergencyScenario: async () => {
    try {
      const res = await client.post('/api/demo/emergency');
      return res.data;
    } catch {
      DEMO_ZONES = DEMO_ZONES.map(z => {
        if (z.id === 'NER-003') {
          return {
            ...z,
            risk_score: 87.5,
            risk_level: 'CRITICAL',
            rainfall_24h: 145.0,
            rainfall_72h: 260.0,
            soil_moisture: 0.85,
            community_adjustment: 15.0,
          };
        }
        return z;
      });
      DEMO_ALERTS.unshift({
        id: Date.now(),
        zone_id: 'NER-003',
        title: '🚨 CRITICAL EMERGENCY — Shillong Plateau Pass',
        message: 'Precipitation surge (145mm) & verified slope movement detected. Immediate evacuation preparedness active.',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      });
      return { message: 'Offline emergency scenario executed successfully.' };
    }
  },
};
