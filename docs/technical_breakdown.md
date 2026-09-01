# Landslide Early Warning System (SIH26001)
## North Eastern Region | Smart India Hackathon 2026 Project

### Project & Technical Breakdown
**ML risk prediction · Safe route provider · Community verification poll**

This document breaks down the three core modules of the app — ML-based landslide risk prediction, a safe-route provider that avoids high-risk zones, and a community polling layer for ground-truth verification — along with the full technology stack, data sources, team split, build timeline, and repository structure.

---

## 1. App Architecture Overview
The system follows a **Predict → Route → Verify** loop: risk factors feed an ML model that scores landslide risk per zone; that risk map drives both a safe-routing engine and an alert system; and community poll reports feed back in to correct and validate the model's predictions in near real time.

| Layer | Function | Data Ingestion |
| :--- | :--- | :--- |
| **ML Risk Model** | Outputs a risk score (0-100) per grid zone | Rainfall, terrain/slope, soil moisture, land cover, historical incident data |
| **Risk Zone Map** | Central layer consumed by routing, alerts, and the dashboard | - |
| **Safe Route Engine**| Suggests paths avoiding high-risk zones | - |
| **Alert System** | Pushes warnings to authorities / residents for high-risk zones | - |
| **Community Poll** | Crowdsourced ground reports that verify / correct the model | - |

---

## 2. Module 1 — ML Prediction Model
**Goal:** Given input risk factors, output a landslide-risk score per zone/grid cell.

**Input Factors:**
*   **Rainfall** (intensity, cumulative 24h/72h) — IMD API or historical CSV
*   **Slope angle / terrain gradient** — derived from a DEM (Digital Elevation Model)
*   **Soil moisture** — satellite proxy (NASA SMAP) or synthetic fallback
*   **Land cover / NDVI** — reduces false positives on forested slopes
*   **Historical landslide incidents** — used as training labels

**Tasks:**
*   **Data collection & preprocessing:** gather DEM, rainfall, historical incidents; grid the region into cells (e.g. 1km²); compute slope/aspect from DEM using GDAL/rasterio
*   **Feature engineering:** normalize factors, create composite features (e.g. rainfall × slope interaction)
*   **Model selection:** start with Random Forest / XGBoost — interpretable, fast to train, handles tabular data well; feature-importance chart doubles as a strong demo visual
*   **Expose predictions** via a `/predict` API endpoint, refreshed on new rainfall input
*   *Stretch goal:* LSTM/time-series layer for a 6–24h risk trend forecast (optional)

**Tech Stack:**
| Layer | Tech | Why |
| :--- | :--- | :--- |
| **Data processing** | pandas, numpy, geopandas | Standard geospatial tabular pipeline |
| **Raster processing** | rasterio, GDAL | Extract slope/aspect from DEM |
| **Model** | scikit-learn (RandomForest) → XGBoost | Fast to train, interpretable output |
| **Optional time-series** | TensorFlow/Keras or PyTorch (LSTM) | 6-24h risk trend forecast |
| **Model serving** | FastAPI | Async, auto Swagger docs |
| **Model storage** | joblib / pickle | Simple, no MLflow overhead needed |

**Data Sources:**
*   **DEM:** SRTM 30m via Bhuvan (ISRO) or USGS EarthExplorer
*   **Rainfall:** IMD API / OpenWeatherMap (fallback)
*   **Soil moisture:** NASA SMAP via Google Earth Engine (or static/synthetic if GEE setup is too slow for 36h)
*   **Land cover:** Sentinel-2 (Google Earth Engine) or Bhuvan LULC
*   **Historical landslides:** GSI Landslide Inventory, or a documented synthetic dataset if unavailable

---

## 3. Module 2 — Safe Prediction Route Provider
**Goal:** Given a start/destination, suggest a route that avoids high-risk zones. This is the standout differentiator feature.

**Tasks:**
*   Build a road/path graph for the demo region using OpenStreetMap data (`osmnx`)
*   Overlay risk zones from Module 1 onto the graph: road segments through high-risk cells get a heavy edge-weight penalty (or hard exclusion above a threshold)
*   Routing algorithm: Dijkstra/A* via `networkx` for the weighted graph
*   API: `/safe-route?start=lat,lon&end=lat,lon` → returns route avoiding red zones, with a fallback route + risk-exposure summary if no fully safe route exists
*   Frontend: render on Leaflet/Mapbox, colour-coding the route green/yellow/red by risk exposure

**Tech Stack:**
| Layer | Tech | Why |
| :--- | :--- | :--- |
| **Graph construction** | osmnx + networkx | Pulls real road graph from OSM; native pathfinding |
| **Routing algorithm** | networkx.shortest_path (Dijkstra) | Custom weight fn: Weight = distance × risk penalty multiplier |
| **Risk-zone lookup** | geopandas / shapely (point-in-polygon) | Maps graph edges to risk grid cells |
| **API** | FastAPI `/safe-route` endpoint | Consistent with prediction API |
| **Map rendering** | Leaflet.js (fast) or Mapbox GL JS | Leaflet = faster setup; Mapbox = nicer visuals |

---

## 4. Module 3 — Community Poll / Crowdsource Verification
**Goal:** Let local residents report ground conditions to validate/correct the model in near real time — closes the reactive, manual-reporting gap the problem statement calls out.

**Tasks:**
*   Simple poll/report form (mobile-first): 'Do you see cracks / water seepage / slope movement near you?' — Yes/No + optional photo + auto geo-tag
*   Aggregation logic: cluster reports by zone; rule-based risk boost (e.g. if reports_in_zone >= 3: risk_score += 15)
*   *Stretch goal:* Optional CNN classifier on uploaded photos (crack/slope-movement detection)
*   Store reports with a moderation flag to prevent spam skewing risk scores
*   Display community reports as distinct map pins alongside ML-predicted risk zones — visualises the human+AI fusion

**Tech Stack:**
| Layer | Tech | Why |
| :--- | :--- | :--- |
| **Frontend form** | React (or plain HTML/JS if time-tight) | Mobile-responsive; geolocation via `navigator.geolocation` |
| **Backend** | FastAPI or Firebase Functions | Firebase is faster to wire up under time pressure |
| **Database** | Firebase Firestore or PostgreSQL + PostGIS | Firestore = speed; PostGIS = geospatial correctness |
| **Photo storage** | Firebase Storage / S3-compatible bucket | Crack/slope photo uploads |
| **Optional CV classifier**| TensorFlow MobileNetV2 | Transfer learning for binary crack/slope-movement detection |
| **Report aggregation** | Rule-based scoring in FastAPI | Explainable, no over-engineering needed |

---

## 5. Frontend / Unified Dashboard
| Layer | Tech | Why |
| :--- | :--- | :--- |
| **Framework** | React (Vite) | Fast setup, team-familiar |
| **Map library** | Leaflet + react-leaflet | Free, no API key required, fast |
| **Styling** | Tailwind CSS | Fast, clean UI without custom CSS overhead |
| **Data fetching** | axios / fetch + React state | Simple polling of `/predict`, `/safe-route`, `/reports` |
| **Alerts UI** | Toast/banner component | Visual highlight for high-risk zone warnings |

---

## 6. Alerts (Bonus, If Time Permits)
| Layer | Tech | Why |
| :--- | :--- | :--- |
| **SMS / notification** | Twilio free trial, or in-app banner | + email via smtplib/SendGrid |
| **Multilingual support**| Static i18n JSON dictionary | Assamese/Hindi/English — no LLM needed, keeps it reliable |

---

## 7. Deployment (Demo Day)
| Component | Where |
| :--- | :--- |
| **Backend (FastAPI)** | Render or Railway (free tier, fast deploy) |
| **Frontend (React)** | Vercel or Netlify (free, instant) |
| **Database** | Firebase (hosted) or Supabase (Postgres + free tier, has PostGIS) |
| **Model** | Bundled with backend, loaded at startup via `joblib.load` |

---

## 8. Suggested Team Split (6 People)
| Role | People | Owns |
| :--- | :--- | :--- |
| **Data + ML** | 2 | Data pipeline, model training, `/predict` API |
| **Backend / Routing** | 1 | Graph construction, `/safe-route` API |
| **Full-stack / Frontend**| 2 | Map UI, poll form, API integration, dashboard |
| **Presentation / QA** | 1 | Demo script, PPT, video, end-to-end testing |

---

## 9. Suggested Build Timeline (36 Hours)
| Hours | Focus |
| :--- | :--- |
| **0-6** | Data collection + DEM/road graph setup (ML team on data, backend on OSM graph, in parallel) |
| **6-16** | Train baseline model; build routing algorithm on dummy risk data |
| **16-24** | Connect real model output to route engine; build poll form + map UI |
| **24-30** | Integrate all three modules into one dashboard; add alert/SMS mock |
| **30-36** | Polish UI, prep demo narrative, test edge cases (no safe route found, missing zone data, etc.) |

---

## 10. Suggested Repository Structure
```
/data           → DEM, rainfall CSVs, preprocessing scripts
/ml-model       → training notebook, model.pkl, FastAPI predict service
/routing        → graph builder, safe-route FastAPI service
/backend        → poll/report API, DB models
/frontend       → React app (map, poll form, dashboard)
/docs           → PPT, architecture diagram, demo script
```

**Prepared for SIH 2026 · Problem Statement SIH26001 · Disaster Management Theme**
