"""
SlopeSafe Data Provenance & Dataset Registry Module
Provides detailed provenance metadata for all ingested datasets:
- GSI National Landslide Susceptibility Mapping (NLSM)
- NASA Global Landslide Catalog (GLC)
- Open-Meteo & IMD Numerical Weather Prediction Telemetry
- NASA SRTM / ALOS AW3D30 Digital Elevation Model
- Copernicus Sentinel-2 MSI & Sentinel-1 SAR Constellations
"""

from typing import Dict, Any, List
from datetime import datetime

DATASET_PROVENANCE_REGISTRY: Dict[str, Dict[str, Any]] = {
    "gsi_nlsm_historical": {
        "dataset_name": "GSI National Landslide Susceptibility Mapping (NLSM) & Disaster Inventory",
        "source": "Geological Survey of India (GSI), Ministry of Mines, Govt of India",
        "retrieval_date": "2024-11-15T00:00:00Z",
        "geographic_coverage": {
            "region": "Himalayas & Western Ghats (Northeast India focus: Sikkim, Assam, Arunachal, Meghalaya, Manipur)",
            "bounding_box": {"min_lat": 8.0, "max_lat": 35.5, "min_lng": 68.0, "max_lng": 97.5}
        },
        "temporal_coverage": {
            "start_date": "2013-01-01",
            "end_date": "2024-09-30"
        },
        "feature_description": [
            "latitude, longitude: Event centroid WGS84 coordinates",
            "date: Confirmed landslide event occurrence date",
            "type: Landslide mechanism (debris flow, rockfall, rotational slump)",
            "fatalities, damage: Observed ground-truth human and infrastructure impact",
            "trigger: Atmospheric/hydrological trigger (cloudburst, monsoon deluge, seismic)",
            "geological_formation: Lithology and underlying bedrock classification"
        ],
        "preprocessing_version": "v2.1.0-spatial-deduped",
        "license": "Open Government Data (OGD) Platform India / GSI Public Technical Reports",
        "validation_status": "Verified against official state disaster management authority (SDMA) post-disaster field reports"
    },
    "nasa_glc_inventory": {
        "dataset_name": "NASA Global Landslide Catalog (GLC)",
        "source": "NASA Goddard Space Flight Center (GSFC) / Landslide Hazard Program",
        "retrieval_date": "2024-10-20T00:00:00Z",
        "geographic_coverage": {
            "region": "Global with South Asia / Hindu Kush Himalayan Filter",
            "bounding_box": {"min_lat": 20.0, "max_lat": 30.0, "min_lng": 88.0, "max_lng": 97.5}
        },
        "temporal_coverage": {
            "start_date": "2007-01-01",
            "end_date": "2024-06-30"
        },
        "feature_description": [
            "event_title: Historical event identifier",
            "latitude, longitude: Reported slide location",
            "trigger: Rain, downpour, continuous rain, snowmelt",
            "landslide_category: Mudslide, debris flow, rockfall",
            "landslide_size: Small, medium, large, very large, catastrophic"
        ],
        "preprocessing_version": "v2.0.0-wgs84-standardized",
        "license": "NASA Open Data Policy (Public Domain)",
        "validation_status": "Cross-referenced with GSI and Copernicus Emergency Management Service records"
    },
    "weather_telemetry": {
        "dataset_name": "Numerical Weather Prediction & Precipitation Telemetry",
        "source": "Open-Meteo Weather API (ECMWF IFS / GFS seamless ensemble) & IMD Gridded Data Adapters",
        "retrieval_date": "Dynamic Real-Time Ingestion (Hourly/Daily sync)",
        "geographic_coverage": {
            "region": "Northeast India Monitored Hazard Corridors (lat: 23.0 to 29.0, lng: 88.0 to 97.5)",
            "bounding_box": {"min_lat": 23.0, "max_lat": 29.0, "min_lng": 88.0, "max_lng": 97.5}
        },
        "temporal_coverage": {
            "start_date": "2019-01-01 (Historical Re-analysis)",
            "end_date": "Real-time + 72h Forecast"
        },
        "feature_description": [
            "current_rainfall_mm: Instantaneous precipitation intensity (mm/h)",
            "rainfall_24h_mm: 24-hour cumulative precipitation (mm)",
            "rainfall_3d_accum_mm: 72-hour antecedent rainfall (mm)",
            "rainfall_7d_accum_mm: 7-day antecedent saturation driver (mm)",
            "rainfall_anomaly_ratio: Deviation from 30-year climatological monthly baseline",
            "soil_moisture_0_to_7cm: Surface volumetric water content (m3/m3)"
        ],
        "preprocessing_version": "v2.2.0-spatial-nearest-neighbor",
        "license": "Creative Commons Attribution 4.0 International (CC BY 4.0) / IMD Public Data",
        "validation_status": "Calibrated against automated weather stations (AWS)"
    },
    "srtm_alos_dem": {
        "dataset_name": "Digital Elevation Model (DEM) & Morphometric Derivatives",
        "source": "NASA SRTM (30m) & JAXA ALOS World 3D (30m AW3D30)",
        "retrieval_date": "2024-09-01T00:00:00Z",
        "geographic_coverage": {
            "region": "Eastern Himalayas, Sikkim, Meghalaya Plateau, Assam Valleys, Patkai Range",
            "bounding_box": {"min_lat": 22.0, "max_lat": 29.5, "min_lng": 88.0, "max_lng": 97.5}
        },
        "temporal_coverage": {
            "start_date": "2000-02-11 (SRTM Baseline)",
            "end_date": "2024-01-01 (AW3D30 v3.2 Revision)"
        },
        "feature_description": [
            "elevation_m: Orthometric height above WGS84 ellipsoid (m)",
            "slope_deg: Maximum slope gradient (degrees 0-90)",
            "aspect_deg: Azimuth of steepest downward slope (degrees 0-360)",
            "curvature_plan: Divergence/convergence of overland surface runoff",
            "curvature_profile: Flow acceleration/deceleration factor",
            "terrain_ruggedness_index: TRI local relief standard deviation (Riley et al. 1999)",
            "topographic_wetness_index: TWI ln(a / tan beta) proxy for moisture accumulation"
        ],
        "preprocessing_version": "v1.4.0-hydrologically-conditioned",
        "license": "Public Domain (NASA / JAXA Open Data)",
        "validation_status": "Sink-filled and verified against SOI (Survey of India) 1:50,000 topomaps"
    },
    "copernicus_sentinel": {
        "dataset_name": "Copernicus Sentinel-2 MSI (Optical) & Sentinel-1 (C-Band SAR)",
        "source": "European Space Agency (ESA) Copernicus Open Access Hub",
        "retrieval_date": "Dynamic Revisit (5-12 days orbit repeat cycle)",
        "geographic_coverage": {
            "region": "Northeast India Hazard Zones (Sentinel Tiles: 45R, 46R, 46Q)",
            "bounding_box": {"min_lat": 22.0, "max_lat": 29.5, "min_lng": 88.0, "max_lng": 97.5}
        },
        "temporal_coverage": {
            "start_date": "2016-01-01",
            "end_date": "Operational Ongoing"
        },
        "feature_description": [
            "ndvi: Normalized Difference Vegetation Index (B8 - B4) / (B8 + B4)",
            "ndwi: Normalized Difference Water Index (B3 - B8) / (B3 + B8)",
            "land_cover_class: 1=Forest, 2=Agriculture, 3=Built-up, 4=Barren, 5=Water",
            "insar_los_velocity_mm_yr: Sentinel-1 InSAR Line-of-Sight deformation velocity"
        ],
        "preprocessing_version": "v2.1.0-sen2cor-atm-corrected",
        "license": "Copernicus Legal Notice / Free, Full and Open Access",
        "validation_status": "Atmospherically corrected bottom-of-atmosphere (BOA) Level-2A reflectance"
    }
}

def get_all_dataset_provenance() -> List[Dict[str, Any]]:
    """Returns the comprehensive dataset provenance list for all ingested sources."""
    results = []
    for key, val in DATASET_PROVENANCE_REGISTRY.items():
        entry = {"dataset_id": key}
        entry.update(val)
        results.append(entry)
    return results

def get_dataset_provenance_by_id(dataset_id: str) -> Dict[str, Any]:
    """Returns provenance metadata for a specific dataset ID or a default descriptor."""
    if dataset_id in DATASET_PROVENANCE_REGISTRY:
        entry = {"dataset_id": dataset_id}
        entry.update(DATASET_PROVENANCE_REGISTRY[dataset_id])
        return entry
    return {
        "dataset_id": dataset_id,
        "status": "Dataset not configured",
        "retrieval_date": datetime.utcnow().isoformat() + "Z",
        "disclaimer": "No provenance record registered for this dataset identifier."
    }
