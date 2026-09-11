"""
Institutional Test Suite for SlopeSafe Enterprise Modules:
- Scientific ML Validation & 5-Fold Cross-Validation
- Real GSI & NASA Historical Disaster Catalog & Data Provenance
- Sentinel Satellite InSAR & Remote Sensing Spectral Indices
- Security RBAC, Auth Bearer Token & SHA-256 Audit Trail
- Production Health Probes & Prometheus Metrics
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_health_probes(client):
    res = client.get('/health')
    assert res.status_code == 200
    data = res.json()
    assert data['status'] == 'HEALTHY'
    assert 'subsystems' in data
    assert 'database_sqlite_orm' in data['subsystems']
    assert 'ml_inference_engine' in data['subsystems']

    res_live = client.get('/health/live')
    assert res_live.status_code == 200
    assert res_live.json()['status'] == 'LIVE'

    res_ready = client.get('/health/ready')
    assert res_ready.status_code == 200
    assert res_ready.json()['status'] == 'READY'

def test_prometheus_metrics(client):
    res = client.get('/api/metrics')
    assert res.status_code == 200
    text = res.text
    assert "slopesafe_uptime_seconds" in text
    assert "slopesafe_active_hazard_zones" in text
    assert "slopesafe_active_alerts_total" in text

def test_ml_validation_metrics(client):
    res = client.get('/api/ml/validation-metrics')
    assert res.status_code == 200
    data = res.json()
    assert 'overall_roc_auc' in data
    assert data['overall_roc_auc'] >= 0.90
    assert 'roc_curve' in data
    assert len(data['roc_curve']) > 10
    assert 'confusion_matrix' in data
    assert 'feature_importance' in data
    assert 'physics_calibration' in data

def test_ml_cross_validation_report(client):
    res = client.get('/api/ml/cross-validation-report')
    assert res.status_code == 200
    data = res.json()
    assert 'folds' in data
    assert len(data['folds']) == 5
    assert 'aggregate_metrics' in data
    assert data['aggregate_metrics']['mean_accuracy'] > 0.90

def test_gsi_nasa_disasters_catalog(client):
    res = client.get('/api/data/gsi-nasa-inventory')
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 8
    # Test filtering
    res_filtered = client.get('/api/data/gsi-nasa-inventory?state=Kerala')
    assert res_filtered.status_code == 200
    assert all(r['state'] == 'Kerala' for r in res_filtered.json())

def test_data_sources_provenance_audit(client):
    res = client.get('/api/data/sources-audit')
    assert res.status_code == 200
    data = res.json()
    assert data['status'] == 'OPERATIONAL_CERTIFIED'
    assert len(data['data_streams']) >= 4

def test_remote_sensing_insar(client):
    res = client.get('/api/remote-sensing/sar-insar/1?zone_name=Wayanad')
    assert res.status_code == 200
    data = res.json()
    assert 'satellite_mission' in data
    assert 'monthly_time_series' in data
    assert len(data['monthly_time_series']) == 12

def test_remote_sensing_indices(client):
    res = client.get('/api/remote-sensing/satellite-indices')
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5
    assert all('ndvi' in s and 'ndwi' in s and 'twi' in s for s in data)

def test_security_auth_and_audit_trail(client):
    # Authenticate
    res = client.post('/api/auth/token', json={
        "username": "magistrate_mandi",
        "password": "secure_password_123",
        "role": "DISTRICT_MAGISTRATE_OFFICER"
    })
    assert res.status_code == 200
    token_data = res.json()
    assert 'access_token' in token_data
    assert token_data['role'] == "DISTRICT_MAGISTRATE_OFFICER"

    # Get Audit Trail
    res_audit = client.get('/api/security/audit-trail')
    assert res_audit.status_code == 200
    trail = res_audit.json()
    assert len(trail) >= 1

    # Verify Cryptographic SHA-256 Chain
    res_verify = client.get('/api/security/verify-audit-chain')
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert verify_data['valid'] is True
