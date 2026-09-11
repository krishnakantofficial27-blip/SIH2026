"""
Comprehensive SIH 2026 Technical & Scientific Architecture Test Suite
Covers:
- ML Pipeline: Data Quality Validator, Spatial Cross-Validation, Feature Engineering, Explainability
- Risk Engine: Infinite Slope Geotechnical Stability, Multi-Criteria Convex Fusion
- Community Intelligence: Deduplication Clustering, Rate Limiting, Reputation Scoring
- 5-Tier Alert Engine: NDMA/IMD Tiering, Deduplication Hashes
- Multi-Source Data Adapters: Real vs Demo Provenance Tracking
- Emergency Scenario: End-to-End Simulation Workflow
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

# Import modular components directly for unit testing
from app.ml import (
    validate_environmental_record, clean_and_sanitize_features,
    get_spatial_cross_validation_strategy, engineer_features,
    generate_decision_support_explanation, calculate_uncertainty_and_confidence,
    get_multi_model_comparison_benchmark
)
from app.risk_engine import (
    compute_fused_risk_score, calculate_physics_factor_of_safety,
    FUSION_WEIGHTS, FUSION_METADATA_SCHEMA
)
from app.community import (
    check_report_rate_limit, detect_duplicate_report,
    calculate_trust_weighted_evidence, VERIFICATION_LEVELS
)
from app.alerts import (
    create_geofenced_alert, evaluate_alert_tier, generate_alert_dedup_hash, ALERT_TIERS
)
from app.adapters import get_current_data_mode_status, DataProviderStatus

@pytest.fixture
def client():
    return TestClient(app)

# ── 1. ML Pipeline & Data Quality Tests ──

def test_environmental_validator_rejects_impossible_values():
    # Invalid latitude out of India bounds
    valid, errors = validate_environmental_record({"lat": 48.5, "lng": 77.0})
    assert valid is False
    assert any("Latitude" in e for e in errors)

    # Inconsistent rainfall (1h > 24h)
    valid, errors = validate_environmental_record({"lat": 31.0, "lng": 77.0, "rainfall_1h": 80.0, "rainfall_24h": 40.0})
    assert valid is False
    assert any("Inconsistent rainfall" in e for e in errors)

    # Valid observation
    valid, errors = validate_environmental_record({
        "lat": 31.67, "lng": 77.05,
        "rainfall_1h": 12.0, "rainfall_24h": 45.0, "rainfall_72h": 90.0,
        "slope_deg": 38.0, "soil_moisture": 0.65
    })
    assert valid is True
    assert len(errors) == 0

def test_feature_engineering_pipeline():
    record = {
        "rainfall_1h": 15.0, "rainfall_24h": 60.0, "rainfall_72h": 120.0,
        "slope_deg": 35.0, "elevation": 1200.0, "soil_moisture": 0.70,
        "ndvi": 0.45, "land_cover": 3, "historical_landslides": 5
    }
    vec, feat_dict = engineer_features(record)
    assert len(vec) == 12
    assert feat_dict["api_7d_index"] > 60.0
    assert 0.0 <= feat_dict["pore_saturation_ratio"] <= 1.0
    assert feat_dict["shear_stress_proxy"] > 0.0

def test_spatial_cross_validation_leakage_prevention():
    strat = get_spatial_cross_validation_strategy()
    assert strat["total_spatial_basins"] == 5
    assert len(strat["evaluation_folds"]) == 5
    for f in strat["evaluation_folds"]:
        assert f["leakage_risk"] == "ZERO_SPATIAL_LEAKAGE"
        assert f["critical_class_recall"] >= 0.90

def test_explainability_uncertainty_quantification():
    exp = generate_decision_support_explanation(
        probability=0.82,
        features={"rainfall_24h": 95.0, "rainfall_72h": 180.0, "slope_deg": 40.0, "soil_moisture": 0.75, "historical_landslides": 6},
        verified_reports_count=2
    )
    assert exp["risk_classification"] == "CRITICAL"
    assert exp["probability_percentage"] == 82.0
    assert "confidence_interval_95" in exp
    assert len(exp["primary_risk_drivers"]) >= 3
    assert "scientific_disclaimer" in exp

# ── 2. Risk Engine & Physics Stability Tests ──

def test_physics_factor_of_safety():
    # Stable gentle slope with low moisture -> Fs > 1.5
    fs_stable, risk_stable = calculate_physics_factor_of_safety(slope_deg=15.0, soil_moisture=0.20)
    assert fs_stable > 1.5
    assert risk_stable < 35.0

    # Critical steep saturated slope -> Fs < 1.1
    fs_crit, risk_crit = calculate_physics_factor_of_safety(slope_deg=45.0, soil_moisture=0.90)
    assert fs_crit <= 1.1
    assert risk_crit >= 55.0

def test_multi_criteria_risk_score_fusion():
    fusion = compute_fused_risk_score(
        ml_probability=0.75,
        slope_deg=38.0,
        soil_moisture=0.70,
        verified_reports_count=2
    )
    assert "fused_risk_score" in fusion
    assert 0.0 <= fusion["fused_risk_score"] <= 100.0
    assert fusion["fused_risk_level"] in ["MODERATE", "HIGH", "CRITICAL"]
    assert sum(FUSION_WEIGHTS.values()) == pytest.approx(1.0)

# ── 3. Community Moderation & Rate Limiting Tests ──

def test_community_rate_limiting():
    ip = "192.168.10.99"
    assert check_report_rate_limit(ip) is True
    assert check_report_rate_limit(ip) is True
    assert check_report_rate_limit(ip) is True
    # 4th report within same hour must be rejected
    assert check_report_rate_limit(ip) is False

def test_community_duplicate_detection():
    existing = [
        {"id": 1, "latitude": 31.670, "longitude": 77.050, "report_type": "CRACK", "status": "VERIFIED"}
    ]
    # Within 100m and same report type -> Duplicate detected
    is_dup, parent_id = detect_duplicate_report(lat=31.671, lng=77.051, report_type="CRACK", existing_reports=existing)
    assert is_dup is True
    assert parent_id == "1"

    # Far away -> Not duplicate
    is_dup2, _ = detect_duplicate_report(lat=32.500, lng=76.500, report_type="CRACK", existing_reports=existing)
    assert is_dup2 is False

def test_trust_weighted_evidence():
    reports = [
        {"id": 1, "status": "VERIFIED"},
        {"id": 2, "status": "SUBMITTED"}
    ]
    cnt, avg_trust = calculate_trust_weighted_evidence(reports)
    assert cnt == 1
    assert avg_trust > 0.0

# ── 4. 5-Tier Alert Engine Tests ──

def test_5_tier_alert_hierarchy():
    assert evaluate_alert_tier(15.0) == "NORMAL"
    assert evaluate_alert_tier(35.0) == "WATCH"
    assert evaluate_alert_tier(55.0) == "ADVISORY"
    assert evaluate_alert_tier(70.0) == "WARNING"
    assert evaluate_alert_tier(85.0) == "CRITICAL"

def test_alert_deduplication_hash():
    h1 = generate_alert_dedup_hash("HP-001", "CRITICAL", "2026-09-11T12:15:00Z")
    h2 = generate_alert_dedup_hash("HP-001", "CRITICAL", "2026-09-11T12:45:00Z")
    h3 = generate_alert_dedup_hash("HP-001", "WATCH", "2026-09-11T12:15:00Z")
    # Same zone + severity in same 4h block has identical hash
    assert h1 == h2
    # Different severity produces different hash
    assert h1 != h3

# ── 5. Full End-to-End Emergency Simulation API Test ──

def test_emergency_simulation_flow(client):
    # Trigger emergency cloudburst simulation
    res = client.post('/api/demo/emergency')
    assert res.status_code == 200
    data = res.json()
    assert data['risk_level'] in ['HIGH', 'CRITICAL']
    assert data['new_score'] >= 70.0

    # Verify active alerts were updated
    res_alerts = client.get('/api/alerts')
    assert res_alerts.status_code == 200
    alerts = res_alerts.json()
    assert len(alerts) > 0
    assert any(a['severity'] in ['HIGH', 'CRITICAL'] for a in alerts)

    # Verify risk summary reflects updated risk
    res_summary = client.get('/api/risk-summary')
    assert res_summary.status_code == 200
    sum_data = res_summary.json()
    assert sum_data['total_zones'] == 22

    # Verify advanced SIH endpoints
    res_spatial = client.get('/api/ml/spatial-validation')
    assert res_spatial.status_code == 200
    assert 'basins' in res_spatial.json()

    res_models = client.get('/api/ml/models-comparison')
    assert res_models.status_code == 200
    assert len(res_models.json()['models_evaluated']) >= 3

    res_meta = client.get('/api/risk-engine/metadata')
    assert res_meta.status_code == 200

    res_mode = client.get('/api/data-mode')
    assert res_mode.status_code == 200
