export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface Zone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  risk_score: number;
  risk_level: RiskLevel;
  rainfall_1h: number;
  rainfall_24h: number;
  rainfall_72h: number;
  slope_deg: number;
  soil_moisture: number;
  elevation: number;
  ndvi: number;
  land_cover: number;
  historical_landslides: number;
  community_reports_count: number;
  ml_score: number;
  community_adjustment: number;
  recommendation: string;
  data_source: string;
  updated_at: string;
}

export type ReportType = 'CRACK' | 'WATER_SEEPAGE' | 'SLOPE_MOVEMENT' | 'FALLING_DEBRIS' | 'OTHER';
export type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type ReportStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface CommunityReport {
  id: number;
  report_type: ReportType;
  description: string;
  severity: Severity;
  latitude: number;
  longitude: number;
  photo_url?: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: number;
  zone_id: string;
  title: string;
  message: string;
  severity: Severity;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  created_at: string;
}

export interface RouteDetail {
  route: [number, number][];
  distance_km: number;
  duration_minutes: number;
  risk_exposure: number;
  risk_level: RiskLevel;
  high_risk_zones_crossed: number;
}

export interface SafeRouteResponse {
  fastest_route: RouteDetail;
  safe_route: RouteDetail;
  recommendation: string;
  fallback_active: boolean;
  source: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface RiskSummary {
  overall_score: number;
  overall_level: RiskLevel;
  total_zones: number;
  high_risk_zones: number;
  critical_zones: number;
  active_reports: number;
  verified_reports: number;
  active_alerts: number;
  demo_mode: boolean;
}

export interface RiskTrend {
  hour: string;
  risk: number;
  rainfall: number;
}

export interface AnalyticsData {
  feature_importance: FeatureImportance[];
  zone_scores: { name: string; score: number; level: RiskLevel }[];
  reports_by_type: { type: string; count: number }[];
  disclaimer: string;
}

export interface MapLayerState {
  riskZones: boolean;
  communityReports: boolean;
  historicalLandslides: boolean;
  safeRoute: boolean;
}
