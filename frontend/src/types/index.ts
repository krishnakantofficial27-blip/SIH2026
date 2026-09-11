export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface FactorContribution {
  factor: string;
  weight_percent: number;
  level: RiskLevel;
  value_display: string;
  explanation: string;
}

export interface Zone {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  risk_score: number;
  risk_level: RiskLevel;
  rainfall_1h: number;
  rainfall_24h: number;
  rainfall_72h: number;
  rainfall_7d?: number;
  slope_deg: number;
  soil_moisture: number;
  elevation: number;
  ndvi: number;
  land_cover: number;
  historical_landslides: number;
  community_reports_count: number;
  ml_score: number;
  community_adjustment: number;
  confidence?: number;
  recommendation: string;
  action_advice?: string;
  factors_breakdown?: FactorContribution[];
  data_source: string;
  data_status?: 'LIVE' | 'ESTIMATED' | 'SIMULATION';
  updated_at: string;
}

export type ReportType = 
  | 'CRACK' 
  | 'WATER_SEEPAGE' 
  | 'SLOPE_MOVEMENT' 
  | 'FALLING_DEBRIS' 
  | 'ROAD_BLOCKAGE' 
  | 'OTHER';

export type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type ReportStatus = 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'VERIFIED' 
  | 'ACTION_REQUIRED' 
  | 'RESOLVED' 
  | 'REJECTED'
  | 'PENDING'; // Backwards-compatible alias

export interface CommunityReport {
  id: number;
  report_code?: string;
  report_type: ReportType;
  description: string;
  severity: Severity;
  latitude: number;
  longitude: number;
  district?: string;
  photo_url?: string | null;
  status: ReportStatus;
  authority_notes?: string;
  assigned_team?: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: number;
  zone_id: string;
  district?: string;
  title: string;
  message: string;
  severity: Severity;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  action_advice?: string;
  source?: string;
  acknowledged_at?: string;
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
  monitored_region: string;
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
  rainfallRadar?: boolean;
}

export interface EmergencyResource {
  id: string;
  name: string;
  category: 'hospital' | 'sdrf' | 'police' | 'fire' | 'helpline' | 'shelter';
  district: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  is24x7: boolean;
  capacity?: number;
  current_occupancy?: number;
}

export interface SensorReading {
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

export interface LiveSensorsResponse {
  sensors: SensorReading[];
  timestamp: string;
  network_status: string;
  active_nodes: number;
  source: string;
}

export interface LiveEvent {
  type: string;
  timestamp: string;
  data?: any;
}

