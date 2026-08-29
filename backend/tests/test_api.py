from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)
def test_health(): assert client.get('/api/health').status_code==200
def test_zones(): assert client.get('/api/zones').status_code==200
def test_route(): assert client.get('/api/safe-route?start_lat=25.58&start_lng=91.89&end_lat=25.67&end_lng=94.11').status_code==200
