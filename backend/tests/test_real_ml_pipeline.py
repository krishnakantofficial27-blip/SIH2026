"""
SlopeSafe Real-World Machine Learning Pipeline & Spatial Validation Test Suite
Tests dataset integrity, feature engineering, probability calibration,
spatial Group-KFold cross-validation, explainability, and API contracts.
"""

import pytest
from fastapi.testclient import TestClient
import numpy as np

from app.main import app
from app.ml import (
    extract_feature_vector, FEATURE_NAMES, compute_7d_api, compute_pore_saturation,
    compute_shear_stress_proxy, validate_environmental_record, clean_and_sanitize_features,
    SlopeSafeLandslideModel, MODEL_VERSION, get_or_load_model, predict_landslide_risk,
    compute_detailed_evaluation, get_spatial_cross_validation_strategy,
    get_multi_model_comparison_benchmark, generate_decision_support_explanation,
    calculate_uncertainty_and_confidence, SPATIAL_BASINS, generate_stratified_dataset
)

client = TestClient(app)

# ── 1. Dataset Integrity & Stratification Tests ──

def test_dataset_generation_and_quality():
    records, quality_report = generate_stratified_dataset()
    assert len(records) >= 1000
    assert quality_report["total_samples"] == len(records)
    assert quality_report["positive_landslide_events"] > 0
    assert quality_report["negative_stable_samples"] > 0
    assert quality_report["missing_value_percentage"] == 0.0
    assert quality_report["geographic_coverage"]["mountain_basins_count"] == 5
    
    # Check that all records have valid labels and fields
    for r in records[:50]:
        assert r["label"] in [0, 1]
        assert r["basin_id"] in [b["basin_id"] for b in SPATIAL_BASINS]
        assert r["slope_deg"] >= 0.0
        assert r["rainfall_24h"] >= 0.0

# ── 2. Feature Engineering & Validation Tests ──

def test_feature_engineering_math():
    # Test 7-Day API
    api = compute_7d_api(rainfall_24h=100.0, rainfall_72h=180.0)
    assert api == 100.0 + 0.85 * 80.0

    # Test Pore Saturation
    pore = compute_pore_saturation(soil_moisture=0.8, rainfall_24h=120.0)
    assert 0.0 <= pore <= 1.0

    # Test Shear Stress Proxy
    shear = compute_shear_stress_proxy(slope_deg=45.0, soil_moisture=0.7)
    assert shear > 0.0

def test_feature_vector_extraction():
    sample = {
        "rainfall_1h": 15.0,
        "rainfall_24h": 90.0,
        "rainfall_72h": 160.0,
        "slope_deg": 38.0,
        "elevation": 1800.0,
        "soil_moisture": 0.75,
        "ndvi": 0.55,
        "land_cover": 3,
        "historical_landslides": 5
    }
    vec, feat_dict = extract_feature_vector(sample)
    assert len(vec) == len(FEATURE_NAMES)
    assert len(feat_dict) == len(FEATURE_NAMES)
    assert feat_dict["rainfall_24h"] == 90.0
    assert feat_dict["slope_deg"] == 38.0
    assert "api_7d_index" in feat_dict
    assert "pore_saturation_ratio" in feat_dict
    assert "shear_stress_proxy" in feat_dict

def test_input_validation_and_sanitization():
    # Out of bounds latitude
    invalid_record = {"lat": 85.0, "lng": 77.0, "rainfall_24h": 50.0}
    is_valid, errors = validate_environmental_record(invalid_record)
    assert not is_valid
    assert any("Latitude" in e for e in errors)

    # Inconsistent rainfall (1h > 24h)
    inconsistent = {"lat": 31.0, "lng": 77.0, "rainfall_1h": 120.0, "rainfall_24h": 50.0}
    is_valid_inc, errors_inc = validate_environmental_record(inconsistent)
    assert not is_valid_inc
    assert any("Inconsistent rainfall" in e for e in errors_inc)

    # Clean & Sanitize clamps
    unclean = {"rainfall_1h": 80.0, "rainfall_24h": 30.0, "slope_deg": 120.0}
    cleaned = clean_and_sanitize_features(unclean)
    assert cleaned["rainfall_24h"] >= cleaned["rainfall_1h"]
    assert cleaned["slope_deg"] <= 89.0

# ── 3. Model Pipeline & Calibration Tests ──

def test_model_loading_and_inference():
    model = get_or_load_model()
    assert model is not None
    assert model.version == MODEL_VERSION
    assert model.calibrated_model is not None

    sample = {
        "rainfall_1h": 25.0,
        "rainfall_24h": 140.0,
        "rainfall_72h": 260.0,
        "slope_deg": 42.0,
        "elevation": 1600.0,
        "soil_moisture": 0.88,
        "ndvi": 0.40,
        "land_cover": 3,
        "historical_landslides": 6
    }
    pred = predict_landslide_risk(sample, verified_reports_count=2)
    assert "probability" in pred
    assert 0.0 <= pred["probability"] <= 1.0
    assert "risk_score" in pred
    assert 0.0 <= pred["risk_score"] <= 100.0
    assert pred["risk_level"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert "top_factors" in pred
    assert len(pred["top_factors"]) > 0
    assert pred["model_version"] == MODEL_VERSION

def test_detailed_evaluation_metrics():
    y_true = [1, 1, 1, 1, 0, 0, 0, 0, 1, 0]
    y_prob = [0.92, 0.88, 0.74, 0.65, 0.12, 0.08, 0.15, 0.22, 0.80, 0.10]
    
    eval_res = compute_detailed_evaluation(y_true, y_prob)
    assert eval_res["accuracy"] == 1.0
    assert eval_res["precision"] == 1.0
    assert eval_res["recall_critical"] == 1.0
    assert eval_res["f1_score"] == 1.0
    assert eval_res["roc_auc"] == 1.0
    assert eval_res["confusion_matrix"]["true_positives"] == 5
    assert eval_res["confusion_matrix"]["true_negatives"] == 5
    assert eval_res["confusion_matrix"]["false_negatives"] == 0
    assert eval_res["confusion_matrix"]["false_positives"] == 0
    assert "safety_audit_summary" in eval_res

# ── 4. Spatial Validation & Explainability Tests ──

def test_spatial_cross_validation_strategy():
    strategy = get_spatial_cross_validation_strategy()
    assert strategy["total_spatial_basins"] == 5
    assert len(strategy["basins"]) == 5
    assert "aggregate_spatial_performance" in strategy
    assert strategy["aggregate_spatial_performance"]["mean_roc_auc"] >= 0.90

def test_multi_model_benchmark():
    benchmark = get_multi_model_comparison_benchmark()
    assert "models_evaluated" in benchmark
    assert len(benchmark["models_evaluated"]) >= 3
    primary = benchmark["models_evaluated"][0]
    assert "Calibrated Random Forest" in primary["model_name"]
    assert primary["selected_status"] == "DEPLOYED_PRIMARY"

def test_explainability_and_confidence():
    conf_level, lower, upper, margin = calculate_uncertainty_and_confidence(0.85)
    assert conf_level in ["HIGH", "MODERATE", "LOW"]
    assert 0.0 <= lower <= upper <= 1.0

    features = {
        "rainfall_24h": 180.0,
        "rainfall_72h": 320.0,
        "slope_deg": 44.0,
        "soil_moisture": 0.85,
        "historical_landslides": 7
    }
    explanation = generate_decision_support_explanation(0.88, features, verified_reports_count=3)
    assert explanation["risk_classification"] == "CRITICAL"
    assert len(explanation["primary_risk_drivers"]) >= 3
    assert "scientific_disclaimer" in explanation

# ── 5. API Endpoints with Real ML Model ──

def test_api_predict_endpoint():
    payload = {
        "zone_id": "HP-001",
        "rainfall_1h": 18.0,
        "rainfall_24h": 95.0,
        "rainfall_72h": 175.0,
        "slope_deg": 38.5,
        "elevation": 1100.0,
        "soil_moisture": 0.72,
        "ndvi": 0.48,
        "land_cover": 3,
        "historical_landslides": 6,
        "community_report_count": 1
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["zone_id"] == "HP-001"
    assert "probability" in data
    assert "risk_score" in data
    assert "risk_level" in data
    assert "model_version" in data
    assert "top_factors" in data
    assert "factors_breakdown" in data
    assert "recommendation" in data

def test_api_predict_live_location():
    # Shillong / East Khasi Hills coordinates (Northeast India)
    payload = {
        "latitude": 25.5788,
        "longitude": 91.8933,
        "location_name": "Shillong Peak Corridor, Meghalaya",
        "slope_deg": 36.0,
        "rainfall_24h": 85.0
    }
    res = client.post("/api/predict/live-location", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["location_name"] == "Shillong Peak Corridor, Meghalaya"
    assert "risk_score" in data
    assert "risk_level" in data
    assert "factor_of_safety" in data
    assert "weather_telemetry" in data

def test_api_ml_validation_endpoints():
    r1 = client.get("/api/ml/validation-metrics")
    assert r1.status_code == 200
    m_data = r1.json()
    assert "overall_roc_auc" in m_data
    assert "overall_precision" in m_data
    assert "confusion_matrix" in m_data

    r2 = client.get("/api/ml/cross-validation-report")
    assert r2.status_code == 200
    cv_data = r2.json()
    assert len(cv_data["folds"]) == 5

    r3 = client.get("/api/ml/spatial-validation")
    assert r3.status_code == 200
    sp_data = r3.json()
    assert sp_data["total_spatial_basins"] == 5

    r4 = client.get("/api/ml/models-comparison")
    assert r4.status_code == 200
    mc_data = r4.json()
    assert len(mc_data["models_evaluated"]) >= 3

# ── 6. Phase 1 Multi-Domain Feature Groups & Provider Tests ──

@pytest.mark.anyio
async def test_weather_providers():
    from app.adapters.weather import LiveOpenMeteoProvider, IMDCompatibleProvider, DemoFallbackProvider, get_weather_provider
    
    # Demo Provider
    demo = DemoFallbackProvider()
    obs_demo = await demo.get_weather(31.67, 77.05)
    assert obs_demo.data_status == "DEMO_DATA"
    assert obs_demo.rainfall_24h > 0.0
    assert obs_demo.rainfall_72h >= obs_demo.rainfall_24h
    assert obs_demo.rainfall_7d >= obs_demo.rainfall_72h

    # IMD Provider
    imd = IMDCompatibleProvider()
    obs_imd = await imd.get_weather(25.57, 91.89)
    assert "IMD" in obs_imd.source_provider
    assert obs_imd.rainfall_24h > 0.0

    # Factory dispatch
    prov = get_weather_provider("demo")
    assert isinstance(prov, DemoFallbackProvider)

def test_terrain_dem_features():
    from app.ml.terrain import compute_dem_terrain_features
    terrain = compute_dem_terrain_features(elevation=2150.0, slope_deg=42.0, aspect_deg=225.0)
    assert terrain.elevation_m == 2150.0
    assert terrain.slope_deg == 42.0
    assert terrain.aspect_deg == 225.0
    assert terrain.shear_stress_proxy > 0.0
    assert terrain.topographic_wetness_index > 0.0
    assert terrain.terrain_ruggedness_index > 0.0

def test_land_cover_vegetation_features():
    from app.ml.landcover import compute_land_cover_features, LULC_CLASSES
    # Test Forest
    forest = compute_land_cover_features(land_cover_code=2, ndvi_value=0.68)
    assert forest.land_cover_class == 2
    assert "Forest" in forest.land_cover_name
    assert forest.root_cohesion_kpa > 3.0
    assert forest.canopy_interception_ratio > 0.10

    # Test Barren
    barren = compute_land_cover_features(land_cover_code=5, ndvi_value=0.10)
    assert barren.root_cohesion_kpa == 0.0

def test_geological_lithology_features():
    from app.ml.geology import compute_geological_features, LITHOLOGY_CATALOG
    geo = compute_geological_features(state="Himachal Pradesh", soil_moisture=0.75, rainfall_24h=88.0)
    assert geo.effective_cohesion_kpa > 0.0
    assert geo.effective_friction_deg > 20.0
    assert geo.geological_susceptibility_index > 0.0
    assert 0.0 <= geo.pore_saturation_ratio <= 1.0

def test_historical_inventory_ingestion_and_spatial_query():
    from app.ml.inventory_ingestion import get_inventory_ingestion
    ingestion = get_inventory_ingestion()
    assert len(ingestion.events) >= 20
    
    # Query near Mandi / Kotropi (31.956, 76.920)
    count, nearest_dist = ingestion.calculate_historical_hotspot_density(31.9560, 76.9200, radius_km=50.0)
    assert count > 0
    assert nearest_dist <= 50.0

def test_phase1_api_endpoints():
    # 1. Weather Current
    rw = client.get("/api/weather/current?lat=31.67&lng=77.05")
    assert rw.status_code == 200
    w_data = rw.json()
    assert "rainfall_24h" in w_data
    assert "rainfall_7d" in w_data
    assert "data_status" in w_data

    # 2. Weather Providers
    rwp = client.get("/api/weather/providers")
    assert rwp.status_code == 200
    wp_data = rwp.json()
    assert len(wp_data["available_providers"]) >= 3

    # 3. Terrain Morphometry
    rt = client.get("/api/terrain/morphometry?elevation=1800&slope=38")
    assert rt.status_code == 200
    t_data = rt.json()
    assert "terrain_ruggedness_index" in t_data
    assert "shear_stress_proxy" in t_data

    # 4. Geology Catalog
    rg = client.get("/api/geology/catalog")
    assert rg.status_code == 200
    assert "lithology_groups" in rg.json()

    # 5. Land Cover Classes
    rl = client.get("/api/landcover/classes")
    assert rl.status_code == 200
    assert "classes" in rl.json()

    # 6. Comprehensive Domain Analysis
    sample_record = {
        "latitude": 31.67,
        "longitude": 77.05,
        "state": "Himachal Pradesh",
        "rainfall_1h": 14.5,
        "rainfall_24h": 88.4,
        "rainfall_72h": 165.2,
        "slope_deg": 38.5,
        "elevation": 910.0,
        "soil_moisture": 0.68,
        "ndvi": 0.44,
        "land_cover": 3
    }
    rc = client.post("/api/features/comprehensive-analysis", json=sample_record)
    assert rc.status_code == 200
    c_data = rc.json()
    assert "terrain_morphometry" in c_data
    assert "land_cover_vegetation" in c_data
    assert "geological_lithology" in c_data
    assert "historical_inventory" in c_data

def test_data_provenance_endpoints():
    rp = client.get("/api/data-provenance")
    assert rp.status_code == 200
    p_data = rp.json()
    assert "provenance_registry" in p_data
    assert len(p_data["provenance_registry"]) >= 5
    assert "standards_compliance" in p_data

    # Test single dataset provenance
    r_single = client.get("/api/data-provenance/gsi_nlsm_historical")
    assert r_single.status_code == 200
    s_data = r_single.json()
    assert s_data["dataset_id"] == "gsi_nlsm_historical"
    assert "Geological Survey of India" in s_data["source"]
    assert "geographic_coverage" in s_data
    assert "preprocessing_version" in s_data

