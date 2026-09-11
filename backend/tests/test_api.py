from fastapi.testclient import TestClient
from app.main import app

def test_all_endpoints():
    with TestClient(app) as client:
        # 1. Health check
        r_health = client.get('/api/health')
        assert r_health.status_code == 200
        assert r_health.json()['status'] == 'healthy'
        assert 'Himachal Pradesh' in r_health.json()['region']
        
        # 2. Get zones
        r_zones = client.get('/api/zones')
        assert r_zones.status_code == 200
        zones = r_zones.json()
        assert len(zones) >= 8
        
        # 3. Get single zone (Mandi)
        r_zone = client.get('/api/zones/HP-001')
        assert r_zone.status_code == 200
        assert r_zone.json()['id'] == 'HP-001'
        assert r_zone.json()['district'] == 'Mandi'
        assert 'factors_breakdown' in r_zone.json()
        
        # 4. Predict risk
        r_pred = client.post('/api/predict', json={
            'zone_id': 'HP-001',
            'rainfall_1h': 15.0,
            'rainfall_24h': 92.0,
            'rainfall_72h': 170.0,
            'slope_deg': 38.5,
            'elevation': 910.0,
            'soil_moisture': 0.70,
            'ndvi': 0.44,
            'land_cover': 3,
            'historical_landslides': 7,
            'community_report_count': 2
        })
        assert r_pred.status_code == 200
        assert 'risk_score' in r_pred.json()
        assert 'factors_breakdown' in r_pred.json()
        
        # 5. Safe route (Solan to Shimla - GET)
        r_route = client.get('/api/safe-route?start_lat=30.91&start_lng=76.97&end_lat=31.11&end_lng=77.14')
        assert r_route.status_code == 200
        assert 'safe_route' in r_route.json()
        assert 'fastest_route' in r_route.json()

        # 5b. Safe route (Kozhikode to Wayanad - POST)
        r_route_post = client.post('/api/safe-route', json={
            'origin': [11.25, 75.78],
            'destination': [11.53, 76.13]
        })
        assert r_route_post.status_code == 200
        assert 'safe_route' in r_route_post.json()
        
        # 6. Create hazard report in Wayanad (Pan-India)
        r_rep = client.post('/api/reports', json={
            'report_type': 'CRACK',
            'description': 'Fresh tension cracks noticed along the road cutting slope in Wayanad.',
            'severity': 'HIGH',
            'latitude': 11.53,
            'longitude': 76.13,
            'district': 'Wayanad'
        })
        assert r_rep.status_code in (200, 429)
        
        # 7. Feature importance
        r_fi = client.get('/api/model/feature-importance')
        assert r_fi.status_code == 200
        assert len(r_fi.json()) == 10

        # 8. Emergency Contacts
        r_em = client.get('/api/emergency-contacts')
        assert r_em.status_code == 200
        assert 'national_helplines' in r_em.json() or len(r_em.json()) >= 4

        # 9. IoT Sensors
        r_sens = client.get('/api/sensors')
        assert r_sens.status_code == 200
        assert len(r_sens.json()['sensors']) >= 6

        # 10. Sync Live Weather
        r_sync = client.get('/api/sync-live-weather')
        assert r_sync.status_code == 200
        assert r_sync.json()['status'] == 'success'

