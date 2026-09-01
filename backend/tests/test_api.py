from fastapi.testclient import TestClient
from app.main import app

def test_all_endpoints():
    with TestClient(app) as client:
        # Health check
        r_health = client.get('/api/health')
        assert r_health.status_code == 200
        assert r_health.json()['status'] == 'healthy'
        
        # Get zones
        r_zones = client.get('/api/zones')
        assert r_zones.status_code == 200
        zones = r_zones.json()
        assert len(zones) >= 5
        
        # Get single zone
        r_zone = client.get('/api/zones/NER-001')
        assert r_zone.status_code == 200
        assert r_zone.json()['id'] == 'NER-001'
        
        # Predict risk
        r_pred = client.post('/api/predict', json={
            'zone_id': 'NER-001',
            'rainfall_1h': 12.0,
            'rainfall_24h': 85.0,
            'rainfall_72h': 140.0,
            'slope_deg': 36.5,
            'elevation': 1132.0,
            'soil_moisture': 0.65,
            'ndvi': 0.52,
            'land_cover': 2,
            'historical_landslides': 4,
            'community_report_count': 2
        })
        assert r_pred.status_code == 200
        assert 'risk_score' in r_pred.json()
        
        # Safe route
        r_route = client.get('/api/safe-route?start_lat=25.58&start_lng=91.89&end_lat=25.67&end_lng=94.11')
        assert r_route.status_code == 200
        assert 'safe_route' in r_route.json()
        
        # Create hazard report
        r_rep = client.post('/api/reports', json={
            'report_type': 'CRACK',
            'description': 'Ground cracks noticed along highway hillside.',
            'severity': 'HIGH',
            'latitude': 25.58,
            'longitude': 91.89
        })
        assert r_rep.status_code in (200, 429)
        
        # Feature importance
        r_fi = client.get('/api/model/feature-importance')
        assert r_fi.status_code == 200
        assert len(r_fi.json()) == 10
