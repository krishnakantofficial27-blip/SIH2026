# SlopeSafe Data Provenance & Authoritative Sources Audit

This document details the authoritative geospatial, meteorological, and geotechnical data sources integrated into the **SlopeSafe Real-World Landslide Early Warning System (SIH2026)**.

---

## 1. Landslide Inventory & Event Catalogs

### A. Geological Survey of India (GSI) — National Landslide Susceptibility Mapping (NLSM)
* **Agency**: Geological Survey of India (Ministry of Mines, Govt. of India)
* **Dataset**: National Landslide Inventory & 1:50,000 Susceptibility Geodatabase
* **Geographic Coverage**: 
  - Eastern Himalayas & Northeast India (Sikkim, Arunachal Pradesh, Meghalaya, Assam, Manipur, Mizoram, Nagaland, Tripura)
  - Western Himalayas (Himachal Pradesh, Uttarakhand, Jammu & Kashmir)
  - Western Ghats (Kerala, Maharashtra, Karnataka, Tamil Nadu)
* **Access URL**: [https://bhukosh.gsi.gov.in/Bhukosh/Public](https://bhukosh.gsi.gov.in/Bhukosh/Public)
* **Access Date**: September 2026 (Annual update cycle)
* **License / Usage**: Government of India National Data Sharing and Accessibility Policy (NDSAP) / Open Government Data (OGD)
* **Features Extracted**: Landslide incident coordinates, date/time, trigger category (monsoon cloudburst, seismic, toe cut), failure type (rotational slump, planar rockslide, debris avalanche), historical hotspot density.

### B. NASA Global Landslide Catalog (GLC) & Cooperative Open Online Landslide Repository (COOLR)
* **Agency**: NASA Goddard Space Flight Center (GSFC)
* **Dataset**: Global Landslide Catalog (GLC) Point Inventory (2007–Present)
* **Geographic Coverage**: Pan-India mountain corridors (focus on Himalayan and Western Ghats disaster footprints)
* **Access URL**: [https://maps.nccs.nasa.gov/apps/glc/](https://maps.nccs.nasa.gov/apps/glc/)
* **Access Date**: September 2026
* **License / Usage**: NASA Open Data Policy (Public Domain)
* **Features Extracted**: Rainfall-triggered landslide occurrences, event timestamps, fatalities, severity classification.

---

## 2. Hydro-Meteorological Telemetry & Reanalysis

### A. India Meteorological Department (IMD) / Open-Meteo ERA5 Reanalysis
* **Agency**: India Meteorological Department (Ministry of Earth Sciences) & ECMWF Copernicus Climate Change Service
* **Dataset**: High-Resolution ERA5 Land Reanalysis & Numerical Weather Forecast Telemetry Grid
* **Resolution**: 1.0 km² to 9.0 km² spatial grid; hourly temporal resolution
* **Access URL**: [https://open-meteo.com/](https://open-meteo.com/) / [https://mausam.imd.gov.in/](https://mausam.imd.gov.in/)
* **Access Date**: Real-time telemetry API with 30-minute caching
* **License / Usage**: Open Data Commons Attribution License (ODC-By) / Copernicus Open Access
* **Features Derived**:
  - `rainfall_1h`: Immediate rainfall intensity (mm/h)
  - `rainfall_24h`: 24-hour cumulative precipitation (mm)
  - `rainfall_72h`: 72-hour sustained storm accumulation (mm)
  - `api_7d_index`: 7-day Antecedent Precipitation Index ($API = R_{24} + 0.85 \times \max(0, R_{72} - R_{24})$)
  - `soil_moisture`: 0–7 cm root-zone volumetric water content ($m^3/m^3$)

---

## 3. Topographical & Digital Elevation Models (DEM)

### A. ISRO CartoDEM & USGS/NASA SRTM (Shuttle Radar Topography Mission)
* **Agency**: Indian Space Research Organisation (ISRO) National Remote Sensing Centre (NRSC) / USGS
* **Dataset**: CartoDEM v3 (30m) & SRTM 1-Arc-Second Global DEM
* **Resolution**: 30-meter ground spatial resolution
* **Access URL**: [https://bhuvan.nrsc.gov.in/](https://bhuvan.nrsc.gov.in/) / [https://earthexplorer.usgs.gov/](https://earthexplorer.usgs.gov/)
* **License / Usage**: Public scientific research access
* **Features Derived**:
  - `elevation`: Altitude above mean sea level (meters)
  - `slope_deg`: Terrain incline angle (degrees, $0^\circ - 89^\circ$)
  - `shear_stress_proxy`: Gravitational shear component ($\sin\theta \cos\theta (1 + 0.3 \cdot \theta_w)$)
  - `pore_saturation_ratio`: Subsoil pore-water pressure ratio

---

## 4. Earth Observation & Satellite Remote Sensing

### A. ESA Copernicus Sentinel-1 C-Band Synthetic Aperture Radar (SAR / InSAR)
* **Agency**: European Space Agency (ESA) Copernicus Programme
* **Sensor**: Sentinel-1 C-SAR (Interferometric Wide Swath mode)
* **Repeat Interval**: 6–12 days
* **Access URL**: [https://browser.dataspace.copernicus.eu/](https://browser.dataspace.copernicus.eu/)
* **License / Usage**: Creative Commons CC BY-SA 3.0 IGO
* **Features Derived**: Line-of-Sight (LOS) millimeter-scale ground displacement velocity (mm/year) and coherence maps.

### B. ESA Copernicus Sentinel-2 Multi-Spectral Imagery
* **Agency**: European Space Agency (ESA) Copernicus Programme
* **Resolution**: 10m visible / NIR bands
* **Features Derived**: Normalized Difference Vegetation Index ($NDVI = \frac{NIR - RED}{NIR + RED}$) tracking vegetation cover depletion and slope destabilization.

---

## 5. Summary Matrix of Data Streams & Status

| Stream Identifier | Primary Source | Geographic Scope | Telemetry Type | Operational Status |
| :--- | :--- | :--- | :--- | :--- |
| **GSI_NLSM_SUSCEPTIBILITY** | Geological Survey of India | Pan-India Mountains (5 Basins) | Historical Incidents, Lithology, Slope | `VERIFIED_CANONICAL` |
| **NASA_GLC_INVENTORY** | NASA GSFC | Pan-India | Disaster Events & Triggers | `VERIFIED_CANONICAL` |
| **IMD_OPEN_METEO_ERA5** | IMD / Open-Meteo | India Subcontinent | 1h/24h/72h Rain, Soil Saturation | `LIVE_DATA` / `CACHED_DATA` |
| **ISRO_CARTO_DEM** | ISRO NRSC Bhuvan | Himalayan Belts | Elevation, Slope Angle, Curvature | `VERIFIED_CANONICAL` |
| **SENTINEL_SAR_INSAR** | ESA Copernicus Sentinel-1 | National Corridors | LOS Surface Creep Velocity | `LIVE_INTEGRATED` |
| **IOT_FIELD_SENSORS** | SlopeSafe LoRa Nodes | Pilot Slopes (HP & Kerala) | Piezometer & Tilt Telemetry | `LIVE_TELEMETRY` |
