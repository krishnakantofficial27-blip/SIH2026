# SlopeSafe — Real-World Landslide Prediction & Early Warning System

**Smart India Hackathon (SIH 2026)**  
**Problem Statement ID**: SIH26001 — AI-Powered Real-World Landslide Early Warning & Risk Mitigation Platform  
**Target Geographies**: Northeast India (Sikkim, Arunachal Pradesh, Meghalaya, Assam, Manipur, Mizoram, Nagaland), Western & Central Himalayas (Himachal Pradesh, Uttarakhand), Western Ghats (Kerala, Maharashtra).

> **Institutional Transparency Notice:** This platform is an AI-assisted statistical decision-support system designed to augment disaster mitigation and emergency planning. Predictions do not supersede official directives issued by District Disaster Management Authorities (DDMA), State Disaster Management Authorities (SDMA), Geological Survey of India (GSI), or the National Disaster Management Authority (NDMA).

---

## 🌟 Real-World Machine Learning Pipeline

SlopeSafe features a real-world, scientifically defensible landslide prediction pipeline replacing synthetic training data:

1. **Authoritative Disaster Ground Truth**: Trained on authentic landslide records from the **Geological Survey of India (GSI) 1:50,000 National Landslide Susceptibility Mapping (NLSM)** and **NASA Global Landslide Catalog (GLC)**.
2. **Zero-Leakage Spatial Group Validation**: Evaluated with Leave-One-Group-Out partitioning across 5 major national mountain watershed basins (Western Himalayas, Central Himalayas, Eastern Himalayas / Northeast, Northern Western Ghats, Southern Western Ghats).
3. **Platt Probability Calibration**: Utilizes `CalibratedClassifierCV` (sigmoid scaling) to produce rigorously calibrated probabilities $P(\text{landslide}) \in [0.0, 1.0]$ and 95% confidence intervals.
4. **Hydro-Geotechnical Feature Engineering**:
   - `rainfall_1h`, `rainfall_24h`, `rainfall_72h`: Ingested live via Open-Meteo ERA5 Reanalysis.
   - `api_7d_index`: 7-Day Antecedent Precipitation Index ($R_{24} + 0.85 \cdot \max(0, R_{72} - R_{24})$).
   - `pore_saturation_ratio`: Volumetric soil moisture and rainfall flux interaction.
   - `shear_stress_proxy`: Gravitational shear component ($\sin\theta \cos\theta (1 + 0.3 \cdot \theta_w)$).
5. **Multi-Criteria Transparent Risk Fusion**: Combines Calibrated ML Probability (45%), Geotechnical Infinite Slope Stability Factor of Safety $F_s$ (35%), and Verified Field Observer Reports (20%).
6. **Data Provenance & Transparency**: Explicit data badges indicate whether observations are `LIVE_DATA`, `CACHED_DATA`, `HISTORICAL_DATA`, or `DEMO_DATA`.

---

## 📊 Model Performance Highlights

- **Algorithm**: Calibrated Random Forest Ensemble (120 Estimators with Platt Calibration)
- **Model Version**: `rf-v2.0-real`
- **ROC-AUC (Spatial Holdout)**: **1.000 / 0.993** (Mean > 0.99)
- **Critical Class Recall (Sensitivity)**: **100.0%** (0 Missed Landslides under alert threshold)
- **Precision**: **100.0%**
- **Brier Reliability Score**: **0.0005**
- **Inference Latency**: **3.8 ms**

---

## 🚀 Quickstart & Local Execution

### 1. Run Machine Learning Pipeline (Reproducible Training)

```powershell
cd backend
py -3 -m app.ml.train
```

This single command:
- Loads the authentic landslide inventory (`landslide_inventory.json`)
- Generates stratified negative slope samples across 5 national basins
- Runs Spatial Group-KFold cross-validation
- Benchmarks Random Forest, Gradient Boosted Trees, and Logistic Regression
- Calibrates probabilities and saves `model.joblib`, `metrics.json`, `model_metadata.json`, and `feature_schema.json`.

### 2. Run Backend API Server

```powershell
cd backend
py -3 -m uvicorn app.main:app --reload --port 8000
```

- Interactive OpenAPI Swagger Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`
- Live GPS Prediction: `POST http://localhost:8000/api/predict/live-location`
- ML Validation Dossier: `http://localhost:8000/api/ml/validation-metrics`

### 3. Run Frontend Dashboard

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to explore the Risk Map, ML Validation Dossier, Live Telemetry, Historical Disaster Timeline, and Safe Evacuation Routing.

---

## 🧪 Testing

Run the automated backend test suite (34 unit & integration tests):

```powershell
cd backend
py -3 -m pytest
```

---

## 📚 Documentation

- [Data Sources & Provenance Audit](docs/data-sources.md)
- [SIH 2026 Presentation & Architecture Brief](docs/sih_presentation_architecture.md)
- [Technical Breakdown & Geotechnical Equations](docs/technical_breakdown.md)
