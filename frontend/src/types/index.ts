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

// ── ML Scientific Validation Types ──
export interface CrossValidationFold {
  fold: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  brier_score: number;
  val_samples: number;
}

export interface CrossValidationReport {
  dataset_name: string;
  total_samples: number;
  features_count: number;
  validation_strategy: string;
  folds: CrossValidationFold[];
  aggregate_metrics: {
    mean_accuracy: number;
    std_accuracy: number;
    mean_precision: number;
    mean_recall: number;
    mean_f1_score: number;
    std_f1_score: number;
    mean_roc_auc: number;
    std_roc_auc: number;
    mean_brier_score: number;
    specificity: number;
  };
  scientific_benchmark: string;
}

export interface RocPoint {
  fpr: number;
  tpr: number;
  threshold: number;
}

export interface PrPoint {
  recall: number;
  precision: number;
  threshold: number;
}

export interface ConfusionMatrixData {
  true_positives: number;
  true_negatives: number;
  false_positives: number;
  false_negatives: number;
  total_evaluated: number;
  positive_class: string;
  negative_class: string;
}

export interface ScientificFeatureImportance {
  feature: string;
  gini_mdi: number;
  permutation_importance: number;
  shap_mean: number;
  unit: string;
}

export interface CalibrationBin {
  bin: string;
  mean_predicted: number;
  fraction_positives: number;
  samples: number;
}

export interface PhysicsCalibrationPoint {
  factor_of_safety_fs: number;
  physics_state: string;
  ml_risk_probability: number;
  agreement: string;
}

export interface MLValidationDossier {
  model_architecture: string;
  overall_roc_auc: number;
  overall_precision: number;
  overall_recall: number;
  overall_f1_score: number;
  brier_reliability_score: number;
  roc_curve: RocPoint[];
  pr_curve: PrPoint[];
  confusion_matrix: ConfusionMatrixData;
  feature_importance: ScientificFeatureImportance[];
  calibration_bins: CalibrationBin[];
  physics_calibration: PhysicsCalibrationPoint[];
  training_metadata: {
    training_samples: number;
    testing_samples: number;
    random_seed: number;
    optimization_method: string;
    last_calibrated_at: string;
  };
}

// ── Real Data & GSI/NASA Catalog Types ──
export interface HistoricalDisasterRecord {
  id: string;
  name: string;
  state: string;
  district: string;
  location: string;
  lat: number;
  lng: number;
  date: string;
  year: number;
  type: string;
  fatalities: number;
  peak_rainfall_24h_mm: number;
  antecedent_7d_rainfall_mm: number;
  slope_deg: number;
  soil_type: string;
  trigger: string;
  source_agency: string;
  ground_truth_verified: boolean;
  damage_scope: string;
}

export interface DataStreamAudit {
  stream_id: string;
  source: string;
  telemetry_type: string;
  resolution: string;
  update_frequency: string;
  status: string;
  reliability_index: number;
}

export interface DataSourcesAudit {
  status: string;
  last_sync_utc: string;
  data_streams: DataStreamAudit[];
  total_historical_disaster_records: number;
  total_national_hazard_zones_monitored: number;
  compliance_standards: string[];
}

// ── Satellite Remote Sensing Types ──
export interface InSARMonthlyPoint {
  month: string;
  monthly_velocity_mm: number;
  cumulative_displacement_mm: number;
  coherence_index: number;
}

export interface InSARDisplacementResponse {
  zone_id: number;
  zone_name: string;
  satellite_mission: string;
  orbital_geometry: {
    track_type: string;
    incidence_angle_deg: number;
    look_direction: string;
    spatial_resolution: string;
    polarization: string;
  };
  insar_metrics: {
    mean_annual_velocity_mm_yr: number;
    cumulative_12m_displacement_mm: number;
    interferometric_coherence: number;
    deformation_status: string;
    phase_unwrapping_error_rate: number;
  };
  monthly_time_series: InSARMonthlyPoint[];
}

export interface SpectralIndexSector {
  id: number;
  name: string;
  lat: number;
  lng: number;
  ndvi: number;
  ndvi_baseline: number;
  ndwi: number;
  twi: number;
  dem_elevation_m: number;
  slope_deg: number;
  aspect: string;
  vegetation_loss_anomaly_pct: number;
  surface_saturation_status: string;
  topographic_wetness_risk: string;
  insar_los_velocity_mm_yr: number;
}

export interface SentinelSummaryResponse {
  constellations: {
    name: string;
    agency: string;
    sensor: string;
    wavelength?: string;
    resolution?: string;
    revisit_time: string;
    purpose: string;
    status: string;
  }[];
  total_monitored_sectors: number;
  pipeline_version: string;
}

// ── Security & Audit Trail Types ──
export interface AuditRecord {
  index: number;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  details: Record<string, any>;
  prev_hash: string;
  entry_hash: string;
}

export interface AuditChainVerification {
  valid: boolean;
  total_records: number;
  latest_entry_hash?: string;
  tampered_index?: number;
  message: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  username: string;
  expires_in_seconds: number;
}

// ── System Health Diagnostics Types ──
export interface SystemHealthResponse {
  status: string;
  service: string;
  version: string;
  uptime_seconds: number;
  uptime_formatted: string;
  subsystems: {
    database_sqlite_orm: { status: string; latency_ms: number };
    ml_inference_engine: { status: string; model_type: string; inference_p95_latency_ms: number };
    live_weather_openmeteo: { status: string; sync_cadence_minutes: number; endpoint: string };
    websocket_realtime_bus: { status: string; active_connections: number };
    satellite_radar_insar: { status: string; constellation: string };
  };
  system_resources: {
    memory_resident_mb: number;
    cpu_utilization_pct: number;
    total_requests_processed: number;
  };
}

// ── SIH 2026 Advanced Architecture Types ──
export interface SpatialBasin {
  basin_id: string;
  name: string;
  region: string;
  zones_count: number;
  geological_context: string;
}

export interface SpatialHoldoutFold {
  fold: number;
  holdout_basin: string;
  train_samples: number;
  test_samples: number;
  test_accuracy: number;
  test_precision: number;
  critical_class_recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  leakage_risk: string;
}

export interface SpatialValidationStrategy {
  validation_method: string;
  rationale: string;
  total_spatial_basins: number;
  basins: SpatialBasin[];
  evaluation_folds: SpatialHoldoutFold[];
  aggregate_spatial_performance: {
    mean_accuracy: number;
    mean_precision: number;
    mean_critical_recall: number;
    mean_f1: number;
    mean_roc_auc: number;
    mean_pr_auc: number;
    scientific_conclusion: string;
  };
}

export interface ModelBenchmarkItem {
  model_name: string;
  architecture_type: string;
  accuracy: number;
  precision: number;
  critical_class_recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  brier_score: number;
  inference_latency_ms: number;
  selected_status: string;
}

export interface MultiModelComparison {
  dataset: string;
  validation_strategy: string;
  models_evaluated: ModelBenchmarkItem[];
  benchmark_conclusion: string;
}

export interface DataModeStatus {
  configured_mode: 'real' | 'demo';
  status_badge: string;
  is_real_data: boolean;
  cache_entries_active: number;
  disclaimer: string;
}



