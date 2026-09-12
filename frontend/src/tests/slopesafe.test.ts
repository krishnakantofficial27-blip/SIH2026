import { describe, it, expect } from 'vitest';
import { TRANSLATIONS } from '../utils/translations';
import { apiService } from '../services/api';

describe('SlopeSafe Translation & Localization Suite', () => {
  it('should have English and Hindi translations for core UI tokens', () => {
    expect(TRANSLATIONS.en).toBeDefined();
    expect(TRANSLATIONS.hi).toBeDefined();
    expect(TRANSLATIONS.en.brand_sub).toBe('PAN-INDIA LANDSLIDE EARLY WARNING PLATFORM');
    expect(TRANSLATIONS.hi.brand_sub).toBe('अखिल भारतीय भूस्खलन पूर्व चेतावनी प्रणाली');
  });

  it('should include translations for critical disaster warning levels and navigation', () => {
    expect(TRANSLATIONS.en.critical_zones).toBeDefined();
    expect(TRANSLATIONS.hi.critical_zones).toBeDefined();
    expect(TRANSLATIONS.en.route).toBeDefined();
    expect(TRANSLATIONS.hi.route).toBeDefined();
  });
});

describe('SlopeSafe API Client & Data Adapters', () => {
  it('should provide fallback data for spatial validation', async () => {
    const spatial = await apiService.getSpatialValidation();
    expect(spatial).toBeDefined();
    expect(spatial.total_spatial_basins).toBe(5);
    expect(spatial.evaluation_folds.length).toBe(5);
    expect(spatial.aggregate_spatial_performance.mean_roc_auc).toBeGreaterThan(0.9);
  });

  it('should provide fallback data for multi-model benchmark comparison', async () => {
    const comparison = await apiService.getModelsComparison();
    expect(comparison).toBeDefined();
    expect(comparison.models_evaluated.length).toBeGreaterThanOrEqual(3);
    const primaryModel = comparison.models_evaluated.find(m => m.selected_status === 'DEPLOYED_PRIMARY');
    expect(primaryModel).toBeDefined();
    expect(primaryModel?.roc_auc).toBeGreaterThan(0.9);
  });

  it('should provide data mode status metadata', async () => {
    const modeStatus = await apiService.getDataModeStatus();
    expect(modeStatus).toBeDefined();
    expect(['real', 'demo']).toContain(modeStatus.configured_mode);
  });

  it('should fetch system health and telemetry', async () => {
    const health = await apiService.getSystemHealth();
    expect(health).toBeDefined();
    expect(health.status).toBe('HEALTHY');
    expect(health.subsystems).toBeDefined();
  });
});

describe('Geotechnical Physics Factor of Safety Formulation', () => {
  it('should compute physical factor of safety for steep saturated slope', () => {
    const cohesion = 10.0;
    const gamma = 19.0;
    const z = 2.0;
    const theta_rad = (35.0 * Math.PI) / 180.0;
    const phi_rad = (30.0 * Math.PI) / 180.0;
    const gamma_w = 9.81;
    const hw = 1.8;

    const effective_normal = (gamma * z - gamma_w * hw) * Math.pow(Math.cos(theta_rad), 2);
    const resisting_stress = cohesion + effective_normal * Math.tan(phi_rad);
    const driving_stress = gamma * z * Math.sin(theta_rad) * Math.cos(theta_rad);
    const fs = resisting_stress / driving_stress;

    expect(fs).toBeLessThan(1.5);
    expect(fs).toBeGreaterThan(0.5);
  });
});

describe('Rainfall Anomaly & Risk Tier Classification', () => {
  it('should accurately compute rainfall anomaly percentage when historical baseline is present', () => {
    const current24h = 184.0;
    const historicalBaseline = 72.0;
    const anomalyPct = Math.round(((current24h - historicalBaseline) / historicalBaseline) * 100);
    expect(anomalyPct).toBe(156);
  });

  it('should map risk score to 4-tier disaster warning thresholds', () => {
    const classifyRisk = (score: number) => {
      if (score >= 75) return 'CRITICAL';
      if (score >= 50) return 'HIGH';
      if (score >= 25) return 'MODERATE';
      return 'LOW';
    };

    expect(classifyRisk(15)).toBe('LOW');
    expect(classifyRisk(35)).toBe('MODERATE');
    expect(classifyRisk(64)).toBe('HIGH');
    expect(classifyRisk(88)).toBe('CRITICAL');
  });

  it('should format data freshness status badges properly', () => {
    const formatDataBadge = (status: 'LIVE' | 'CACHED' | 'DEMO' | 'UNAVAILABLE') => {
      const map = {
        LIVE: '🟢 LIVE',
        CACHED: '🟡 CACHED',
        DEMO: '🔵 DEMO',
        UNAVAILABLE: '🔴 UNAVAILABLE'
      };
      return map[status];
    };

    expect(formatDataBadge('LIVE')).toBe('🟢 LIVE');
    expect(formatDataBadge('CACHED')).toBe('🟡 CACHED');
    expect(formatDataBadge('DEMO')).toBe('🔵 DEMO');
    expect(formatDataBadge('UNAVAILABLE')).toBe('🔴 UNAVAILABLE');
  });

  it('should generate distinctly different ML predictions for Normal Day, Monsoon Season, and Extreme Event', async () => {
    const normalPayload = {
      zone_id: 'HP-001',
      rainfall_1h: 2.0,
      rainfall_24h: 12.0,
      rainfall_72h: 28.0,
      slope_deg: 18.0,
      elevation: 850.0,
      soil_moisture: 0.25,
      ndvi: 0.75,
      land_cover: 1,
      historical_landslides: 0,
      community_report_count: 0,
    };

    const monsoonPayload = {
      zone_id: 'HP-001',
      rainfall_1h: 14.0,
      rainfall_24h: 78.0,
      rainfall_72h: 155.0,
      slope_deg: 34.0,
      elevation: 1350.0,
      soil_moisture: 0.62,
      ndvi: 0.46,
      land_cover: 2,
      historical_landslides: 4,
      community_report_count: 2,
    };

    const extremePayload = {
      zone_id: 'HP-001',
      rainfall_1h: 38.0,
      rainfall_24h: 175.0,
      rainfall_72h: 340.0,
      slope_deg: 44.0,
      elevation: 1950.0,
      soil_moisture: 0.85,
      ndvi: 0.28,
      land_cover: 3,
      historical_landslides: 8,
      community_report_count: 5,
    };

    const normalRes = await apiService.predictRisk(normalPayload);
    const monsoonRes = await apiService.predictRisk(monsoonPayload);
    const extremeRes = await apiService.predictRisk(extremePayload);

    // Normal day must be LOW risk
    expect(normalRes.risk_score).toBeLessThan(30);
    expect(normalRes.risk_level).toBe('LOW');

    // Monsoon season must be significantly higher (MODERATE or HIGH)
    expect(monsoonRes.risk_score).toBeGreaterThan(normalRes.risk_score + 25);
    expect(['MODERATE', 'HIGH', 'CRITICAL']).toContain(monsoonRes.risk_level);

    // Extreme event must be CRITICAL
    expect(extremeRes.risk_score).toBeGreaterThan(monsoonRes.risk_score + 15);
    expect(extremeRes.risk_score).toBeGreaterThanOrEqual(75);
    expect(extremeRes.risk_level).toBe('CRITICAL');

    // Contributing factors and recommendations should be tailored
    expect(normalRes.recommendation).toContain('LOW RISK');
    expect(extremeRes.recommendation).toContain('CRITICAL');
  });
});
