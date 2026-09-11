"""
SlopeSafe Real-World Geotechnical & Hydro-Meteorological Feature Engineering
Translates raw observation telemetry across 5 core domains:
1. Rainfall (current, 24h, 72h, 7d, API index, anomaly)
2. Terrain / DEM (elevation, slope, aspect, curvature, TRI, TWI, shear stress)
3. Land Cover / EO (LULC classes, NDVI, root cohesion, canopy interception)
4. Soil & Geology (lithology, effective cohesion c', friction angle phi', pore saturation)
5. Historical Landslide Inventory (hotspot density, distance to nearest failure)
"""

from typing import Dict, Any, List, Tuple, Optional
import math
import numpy as np

from .terrain import compute_dem_terrain_features, TerrainFeatures
from .landcover import compute_land_cover_features, LandCoverFeatures
from .geology import compute_geological_features, GeologicalFeatures
from .inventory_ingestion import get_inventory_ingestion

# Canonical feature names used for ML Model training & inference
FEATURE_NAMES = [
    "rainfall_1h",
    "rainfall_24h",
    "rainfall_72h",
    "slope_deg",
    "elevation",
    "soil_moisture",
    "ndvi",
    "land_cover",
    "historical_landslides",
    "api_7d_index",
    "pore_saturation_ratio",
    "shear_stress_proxy"
]

def compute_7d_api(rainfall_24h: float, rainfall_72h: float) -> float:
    """
    Computes 7-Day Antecedent Precipitation Index (API) using hydrological decay:
    API = R_24h + k * max(0, R_72h - R_24h), where decay constant k = 0.85
    """
    antecedent_extra = max(0.0, float(rainfall_72h) - float(rainfall_24h))
    return round(float(rainfall_24h) + 0.85 * antecedent_extra, 2)

def compute_pore_saturation(soil_moisture: float, rainfall_24h: float) -> float:
    """
    Calculates subsoil pore saturation ratio combining volumetric water content and daily rain flux.
    """
    moist = max(0.0, min(1.0, float(soil_moisture)))
    rain_flux = min(1.0, float(rainfall_24h) / 200.0)
    return round(min(1.0, moist * 0.6 + rain_flux * 0.4), 3)

def compute_shear_stress_proxy(slope_deg: float, soil_moisture: float) -> float:
    """
    Gravitational shear stress component along failure plane:
    tau_proxy = sin(theta) * cos(theta) * (1.0 + soil_moisture * 0.3)
    """
    theta_rad = math.radians(max(0.0, min(85.0, float(slope_deg))))
    moist = max(0.0, min(1.0, float(soil_moisture)))
    return round(math.sin(theta_rad) * math.cos(theta_rad) * (1.0 + moist * 0.3), 4)

def extract_feature_vector(record: Dict[str, Any]) -> Tuple[List[float], Dict[str, float]]:
    """
    Extracts and computes the canonical 12-dimensional engineered feature vector from an observation dictionary.
    Returns (feature_vector_list, feature_dict).
    """
    r1 = max(0.0, float(record.get("rainfall_1h", 0.0)))
    r24 = max(r1, float(record.get("rainfall_24h", 0.0)))
    r72 = max(r24, float(record.get("rainfall_72h", 0.0)))
    slope = max(0.0, min(89.0, float(record.get("slope_deg", 25.0))))
    elev = max(-50.0, min(8848.0, float(record.get("elevation", 1200.0))))
    moist = max(0.0, min(1.0, float(record.get("soil_moisture", 0.45))))
    ndvi = max(-1.0, min(1.0, float(record.get("ndvi", 0.50))))
    lc = float(record.get("land_cover", 2))
    hist = max(0.0, float(record.get("historical_landslides", 1)))

    api_7d = compute_7d_api(r24, r72)
    pore_ratio = compute_pore_saturation(moist, r24)
    shear_proxy = compute_shear_stress_proxy(slope, moist)

    feature_dict = {
        "rainfall_1h": r1,
        "rainfall_24h": r24,
        "rainfall_72h": r72,
        "slope_deg": slope,
        "elevation": elev,
        "soil_moisture": moist,
        "ndvi": ndvi,
        "land_cover": lc,
        "historical_landslides": hist,
        "api_7d_index": api_7d,
        "pore_saturation_ratio": pore_ratio,
        "shear_stress_proxy": shear_proxy
    }

    feature_vector = [feature_dict[name] for name in FEATURE_NAMES]
    return feature_vector, feature_dict

def extract_comprehensive_domain_features(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts structured multi-domain environmental parameters across all 5 physical feature groups.
    """
    vector, feat_dict = extract_feature_vector(record)
    
    # 1. Terrain Morphometry
    terrain = compute_dem_terrain_features(
        elevation=feat_dict["elevation"],
        slope_deg=feat_dict["slope_deg"],
        aspect_deg=float(record.get("aspect_deg", 180.0)),
        plan_curvature=float(record.get("plan_curvature", 0.02)),
        profile_curvature=float(record.get("profile_curvature", -0.04)),
        soil_moisture=feat_dict["soil_moisture"]
    )

    # 2. Land Cover & Vegetation Bio-stabilization
    landcover = compute_land_cover_features(
        land_cover_code=int(feat_dict["land_cover"]),
        ndvi_value=feat_dict["ndvi"]
    )

    # 3. Soil & Geological Lithology
    geology = compute_geological_features(
        lithology_key=record.get("lithology_key"),
        soil_moisture=feat_dict["soil_moisture"],
        rainfall_24h=feat_dict["rainfall_24h"],
        state=record.get("state")
    )

    # 4. Historical Landslide Hotspot Proximity
    lat = float(record.get("latitude", record.get("lat", 0.0)))
    lng = float(record.get("longitude", record.get("lng", 0.0)))
    if lat > 0.0 and lng > 0.0:
        ingestion = get_inventory_ingestion()
        density_count, nearest_dist = ingestion.calculate_historical_hotspot_density(lat, lng)
    else:
        density_count = int(feat_dict["historical_landslides"])
        nearest_dist = 4.5

    return {
        "canonical_feature_vector": vector,
        "feature_dict": feat_dict,
        "terrain_morphometry": terrain.to_dict(),
        "land_cover_vegetation": landcover.to_dict(),
        "geological_lithology": geology.to_dict(),
        "historical_inventory": {
            "hotspot_density_within_25km": density_count,
            "nearest_landslide_distance_km": nearest_dist
        }
    }
