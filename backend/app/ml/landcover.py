"""
SlopeSafe Land Cover & Earth Observation Vegetation Module
Translates satellite-derived spectral indices (NDVI) and Land Use/Land Cover (LULC)
categories into geotechnical bio-stabilization parameters.
"""

from dataclasses import dataclass, asdict
from typing import Dict, Any

# Standard Land Cover Categorical Mapping (ESA WorldCover / NRSC Bhuvan Schema)
LULC_CLASSES = {
    1: {"name": "Water Body / Fluvial Channel", "susceptibility_weight": 0.85, "root_cohesion_kpa": 0.0},
    2: {"name": "Dense Deciduous / Pine Forest", "susceptibility_weight": 0.20, "root_cohesion_kpa": 6.5},
    3: {"name": "Agricultural Terraces / Scrubland", "susceptibility_weight": 0.55, "root_cohesion_kpa": 2.5},
    4: {"name": "Urban Settlement / Built-Up Area", "susceptibility_weight": 0.75, "root_cohesion_kpa": 0.5},
    5: {"name": "Barren Rocky Escarpment / Scree", "susceptibility_weight": 0.90, "root_cohesion_kpa": 0.0}
}

@dataclass
class LandCoverFeatures:
    land_cover_class: int               # 1=Water, 2=Forest, 3=Agri, 4=Built-up, 5=Barren
    land_cover_name: str                # Human-readable LULC category
    ndvi: float                         # Normalized Difference Vegetation Index (-1.0 to +1.0)
    root_cohesion_kpa: float            # Bio-mechanical root reinforcement strength (kPa)
    canopy_interception_ratio: float    # Rainfall canopy storage and buffering ratio (0.0 - 0.35)
    vegetation_health_status: str       # VIGOROUS, MODERATE, DEPLETED, BARREN

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

def compute_land_cover_features(
    land_cover_code: int = 2,
    ndvi_value: float = 0.55
) -> LandCoverFeatures:
    """
    Computes bio-mechanical stabilization and canopy interception parameters from LULC and NDVI.
    """
    code = int(land_cover_code) if int(land_cover_code) in LULC_CLASSES else 2
    info = LULC_CLASSES[code]
    ndvi = max(-1.0, min(1.0, float(ndvi_value)))

    # Root cohesion scales with vegetation density (NDVI) and forest cover
    base_root = info["root_cohesion_kpa"]
    scaled_root = round(max(0.0, base_root * max(0.1, (ndvi + 0.2) / 0.8)), 2)

    # Canopy rainfall interception buffering
    if code == 2:  # Dense Forest
        canopy = round(min(0.35, 0.15 + ndvi * 0.20), 3)
    elif code == 3:  # Agriculture / Scrub
        canopy = round(min(0.20, 0.05 + ndvi * 0.15), 3)
    else:
        canopy = 0.0

    if ndvi >= 0.60:
        health = "VIGOROUS_FOREST_CANOPY"
    elif ndvi >= 0.35:
        health = "MODERATE_VEGETATION"
    elif ndvi >= 0.15:
        health = "SPARSE_OR_DISTURBED"
    else:
        health = "BARREN_OR_DEGRADED"

    return LandCoverFeatures(
        land_cover_class=code,
        land_cover_name=info["name"],
        ndvi=round(ndvi, 3),
        root_cohesion_kpa=scaled_root,
        canopy_interception_ratio=canopy,
        vegetation_health_status=health
    )
