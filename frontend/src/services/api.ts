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
  timeout: 45000,
});

async function apiGet<T>(url: string, retries = 3, delay = 4000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await client.get<T>(url);
      return res.data;
    } catch (err) {
      const isLast = i === retries - 1;
      const axErr = err as AxiosError;
      if (isLast || (axErr.response?.status && axErr.response.status < 500)) {
        throw err;
      }
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('API request failed after retries');
}

export const apiService = {
  checkHealth: async () => {
    return (await client.get('/api/health')).data;
  },

  getZones: async (): Promise<Zone[]> => {
    return apiGet<Zone[]>('/api/zones');
  },

  getZoneById: async (id: string): Promise<Zone> => {
    return apiGet<Zone>(`/api/zones/${id}`);
  },

  getRiskSummary: async (): Promise<RiskSummary> => {
    return apiGet<RiskSummary>('/api/risk-summary');
  },

  getRiskTrends: async (): Promise<RiskTrend[]> => {
    return apiGet<RiskTrend[]>('/api/risk-trends');
  },

  getAlerts: async (): Promise<Alert[]> => {
    return apiGet<Alert[]>('/api/alerts');
  },

  updateAlertStatus: async (id: number, status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED') => {
    const res = await client.patch(`/api/alerts/${id}/status`, null, { params: { status } });
    return res.data;
  },

  getReports: async (): Promise<CommunityReport[]> => {
    return apiGet<CommunityReport[]>('/api/reports');
  },

  submitReport: async (report: {
    report_type: ReportType;
    description: string;
    severity: Severity;
    latitude: number;
    longitude: number;
    photo_url?: string;
  }): Promise<CommunityReport> => {
    const res = await client.post<CommunityReport>('/api/reports', report);
    return res.data;
  },

  moderateReport: async (id: number, status: 'VERIFIED' | 'REJECTED'): Promise<CommunityReport> => {
    const res = await client.patch<CommunityReport>(`/api/reports/${id}/moderate`, null, { params: { status } });
    return res.data;
  },

  predictRisk: async (payload: {
    zone_id: string;
    rainfall_1h: number;
    rainfall_24h: number;
    rainfall_72h: number;
    slope_deg: number;
    elevation: number;
    soil_moisture: number;
    ndvi: number;
    land_cover: number;
    historical_landslides: number;
    community_report_count: number;
  }) => {
    const res = await client.post('/api/predict', payload);
    return res.data;
  },

  getSafeRoute: async (startLat: number, startLng: number, endLat: number, endLng: number): Promise<SafeRouteResponse> => {
    const res = await client.get<SafeRouteResponse>('/api/safe-route', {
      params: {
        start_lat: startLat,
        start_lng: startLng,
        end_lat: endLat,
        end_lng: endLng,
      },
    });
    return res.data;
  },

  getAnalytics: async (): Promise<AnalyticsData> => {
    return apiGet<AnalyticsData>('/api/analytics');
  },

  getFeatureImportance: async (): Promise<FeatureImportance[]> => {
    return apiGet<FeatureImportance[]>('/api/model/feature-importance');
  },

  runEmergencyScenario: async () => {
    const res = await client.post('/api/demo/emergency');
    return res.data;
  },
};
