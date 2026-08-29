# SlopeSafe — Landslide Early Warning System

An SIH 2026 prototype for the North Eastern Region of India. It demonstrates **predict → alert → verify → route** with a real local Random Forest model, database-backed reports, explainable score fusion, and a risk-aware demo routing graph.

> **Safety disclaimer:** This is a prototype decision-support tool. Its estimates must not replace official government warnings, geological assessments, or emergency instructions.

## What works locally

- FastAPI + SQLite database fallback, automatic schema and NER demo-zone seeding
- Deterministic synthetic training data with documented causal relationships; the model is trained once and cached as `backend/model.joblib`
- Risk score API, community-fusion boost (up to 15 points for 3+ verified reports), alert generation, report moderation and duplicate-rate protection
- Interactive OpenStreetMap/Leaflet map, dashboard chart, report form and one-click emergency scenario
- Safe-route API with a resilient demo road-graph calculation if OSM services are unavailable
- Interactive Swagger API at `http://localhost:8000/docs`

## Run without Docker

Terminal 1:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Terminal 2:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Use **Run Emergency Scenario** to raise Shillong Plateau's rainfall/risk and create verified reports; then choose **Find safest route**.

## Data, limitations, and real integrations

All displayed environmental and zone data is clearly marked **SYNTHETIC DEMO DATA**. The app deliberately makes no claim of scientific validation. Use `.env` for optional IMD/OpenWeather, terrain, or land-cover adapters; the local fallback remains operational without any key. The routing engine currently uses a documented NER demo graph rather than downloading a live OSM network, allowing offline presentations. A production deployment should add PostGIS migrations, authoritative datasets, validation, audit logging, authentication and emergency-agency review.

## API

Implemented endpoints: `/api/health`, `/api/zones`, `/api/zones/{id}`, `/api/predict`, `/api/risk-summary`, `/api/risk-trends`, `/api/safe-route`, report CRUD/moderation, alert status, analytics and model feature importance. See Swagger for schemas and test calls.

## Testing

```powershell
cd backend
pytest
```

## Deployment

Deploy `frontend` to Vercel/Netlify with `VITE_API_URL` set to the API URL. Deploy `backend` to Render/Railway, set `DATABASE_URL` to a managed PostgreSQL/PostGIS instance, and retain SQLite only for local demos.
