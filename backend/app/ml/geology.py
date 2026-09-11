"""
SlopeSafe Soil & Geological Lithology Feature Module
Maps lithological groups and subsoil classifications into geotechnical strength parameters:
Effective Cohesion (c'), Internal Friction Angle (phi'), and Drainage Efficiency.
"""

from dataclasses import dataclass, asdict
from typing import Dict, Any, Optional

LITHOLOGY_CATALOG = {
    "SIWALIK_SANDSTONE_SHALE": {
        "name": "Siwalik Group (Weak Sandstone-Claystone Alternations)",
        "cohesion_kpa": 10.5,
        "friction_deg": 28.0,
        "drainage_efficiency": 0.45,
        "susceptibility_index": 0.85
    },
    "LESSER_HIMALAYAN_SCHIST": {
        "name": "Lesser Himalayan Phyllites, Schists & Slates",
        "cohesion_kpa": 14.0,
        "friction_deg": 30.0,
        "drainage_efficiency": 0.50,
        "susceptibility_index": 0.80
    },
    "DECCAN_BASALT_REGOLITH": {
        "name": "Deccan Traps Layered Basalt & Clay Paleosol",
        "cohesion_kpa": 12.0,
        "friction_deg": 32.0,
        "drainage_efficiency": 0.40,
        "susceptibility_index": 0.75
    },
    "WESTERN_GHATS_LATERITE": {
        "name": "Lateritic Regolith over Weathered Gneiss",
        "cohesion_kpa": 16.0,
        "friction_deg": 33.0,
        "drainage_efficiency": 0.65,
        "susceptibility_index": 0.78
    },
    "BARAIL_DISANG_SHALE": {
        "name": "Barail & Disang Formation (Tertiary Flysch & Shale)",
        "cohesion_kpa": 9.0,
        "friction_deg": 26.0,
        "drainage_efficiency": 0.35,
        "susceptibility_index": 0.90
    },
    "CRYSTALLINE_GNEISS": {
        "name": "Higher Himalayan Metamorphic Crystalline Gneiss",
        "cohesion_kpa": 22.0,
        "friction_deg": 36.0,
        "drainage_efficiency": 0.70,
        "susceptibility_index": 0.45
    }
}

@dataclass
class GeologicalFeatures:
    lithology_key: str
    lithology_name: str
    effective_cohesion_kpa: float
    effective_friction_deg: float
    drainage_efficiency: float
    geological_susceptibility_index: float
    pore_saturation_ratio: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

def compute_geological_features(
    lithology_key: Optional[str] = None,
    soil_moisture: float = 0.50,
    rainfall_24h: float = 45.0,
    state: Optional[str] = None
) -> GeologicalFeatures:
    """
    Infers geotechnical soil/lithology parameters from regional geology and subsoil moisture.
    """
    key = lithology_key
    if not key or key not in LITHOLOGY_CATALOG:
        # Infer default lithology by geographical state if not explicitly specified
        if state:
            st = state.lower()
            if "himachal" in st or "jammu" in st:
                key = "SIWALIK_SANDSTONE_SHALE"
            elif "uttarakhand" in st:
                key = "LESSER_HIMALAYAN_SCHIST"
            elif "maharashtra" in st:
                key = "DECCAN_BASALT_REGOLITH"
            elif "kerala" in st or "tamil" in st or "karnataka" in st:
                key = "WESTERN_GHATS_LATERITE"
            elif "manipur" in st or "assam" in st or "nagaland" in st or "meghalaya" in st or "mizoram" in st:
                key = "BARAIL_DISANG_SHALE"
            elif "sikkim" in st or "arunachal" in st:
                key = "CRYSTALLINE_GNEISS"
            else:
                key = "LESSER_HIMALAYAN_SCHIST"
        else:
            key = "LESSER_HIMALAYAN_SCHIST"

    info = LITHOLOGY_CATALOG[key]
    moist = max(0.0, min(1.0, float(soil_moisture)))
    
    # Subsoil pore water saturation ratio
    pore_ratio = round(min(1.0, moist * 0.6 + (rainfall_24h / 200.0) * 0.4), 3)

    return GeologicalFeatures(
        lithology_key=key,
        lithology_name=info["name"],
        effective_cohesion_kpa=info["cohesion_kpa"],
        effective_friction_deg=info["friction_deg"],
        drainage_efficiency=info["drainage_efficiency"],
        geological_susceptibility_index=info["susceptibility_index"],
        pore_saturation_ratio=pore_ratio
    )
