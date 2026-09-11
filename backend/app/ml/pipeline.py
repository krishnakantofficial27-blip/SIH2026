"""
SlopeSafe ML Feature Engineering & Transformation Pipeline
Transforms raw environmental observations into physics-guided geotechnical feature vectors.
"""

from typing import Dict, Any, List, Tuple
import math
import numpy as np
from .validation import clean_and_sanitize_features

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

def engineer_features(raw_record: Dict[str, Any]) -> Tuple[List[float], Dict[str, float]]:
    """
    Transforms clean observation record into full 12-dimensional engineered feature vector.
    Returns (feature_vector_list, feature_dict).
    """
    clean = clean_and_sanitize_features(raw_record)
    
    r1 = float(clean.get("rainfall_1h", 0.0))
    r24 = float(clean.get("rainfall_24h", 0.0))
    r72 = float(clean.get("rainfall_72h", 0.0))
    slope = float(clean.get("slope_deg", 0.0))
    elev = float(clean.get("elevation", 1000.0))
    moist = float(clean.get("soil_moisture", 0.3))
    ndvi = float(clean.get("ndvi", 0.5))
    lc = float(clean.get("land_cover", 2))
    hist = float(clean.get("historical_landslides", 0))

    # 1. 7-Day Antecedent Precipitation Index (API) proxy
    # Decayed antecedent moisture storage: API = r24 + 0.85 * (r72 - r24)
    api_7d = round(r24 + 0.85 * max(0.0, r72 - r24), 2)

    # 2. Pore Saturation Critical Ratio (combination of soil moisture and cumulative rainfall)
    pore_ratio = round(min(1.0, moist * 0.6 + (r24 / 200.0) * 0.4), 3)

    # 3. Gravitational Shear Stress Proxy: sin(theta) * cos(theta) * soil_weight
    theta_rad = math.radians(slope)
    shear_proxy = round(math.sin(theta_rad) * math.cos(theta_rad) * (1.0 + moist * 0.3), 3)

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
