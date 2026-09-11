"""
SlopeSafe DEM & Terrain Morphometry Feature Module
Extracts physically grounded topographical parameters from Digital Elevation Models (DEM).
Supports elevation, slope, aspect, plan/profile curvature, TRI, and TWI.
"""

from dataclasses import dataclass, asdict
from typing import Dict, Any, Tuple
import math

@dataclass
class TerrainFeatures:
    elevation_m: float                  # Meters above mean sea level
    slope_deg: float                    # Incline angle (0 - 89 degrees)
    aspect_deg: float                   # Azimuth orientation (0 - 360 degrees)
    plan_curvature: float               # Flow convergence/divergence (-1.0 to 1.0)
    profile_curvature: float            # Flow acceleration/deceleration (-1.0 to 1.0)
    terrain_ruggedness_index: float     # Surface roughness metric TRI (0 - 100)
    topographic_wetness_index: float    # Hydrological moisture accumulation index TWI
    shear_stress_proxy: float           # Gravitational driving stress component

    def to_dict(self) -> Dict[str, float]:
        return asdict(self)

def compute_dem_terrain_features(
    elevation: float,
    slope_deg: float,
    aspect_deg: float = 180.0,
    plan_curvature: float = 0.02,
    profile_curvature: float = -0.04,
    soil_moisture: float = 0.50
) -> TerrainFeatures:
    """
    Derives complete morphometric terrain feature set from elevation and slope parameters.
    """
    elev = max(-50.0, min(8848.0, float(elevation)))
    slope = max(0.0, min(85.0, float(slope_deg)))
    aspect = max(0.0, min(360.0, float(aspect_deg)))

    # 1. Gravitational driving shear stress proxy: sin(theta) * cos(theta) * (1 + 0.3 * moist)
    theta_rad = math.radians(slope)
    shear_stress = round(math.sin(theta_rad) * math.cos(theta_rad) * (1.0 + soil_moisture * 0.3), 4)

    # 2. Topographic Wetness Index (TWI) proxy: TWI = ln(a / tan(beta))
    tan_slope = max(0.01, math.tan(theta_rad))
    # Catchment area proxy scales with elevation relief and plan curvature
    catchment_proxy = max(10.0, (elev / 100.0) * (1.0 + abs(plan_curvature) * 5.0))
    twi = round(math.log(catchment_proxy / tan_slope), 2)

    # 3. Terrain Ruggedness Index (TRI) proxy
    tri = round(min(100.0, (slope / 45.0) * 60.0 + (abs(profile_curvature) + abs(plan_curvature)) * 200.0), 2)

    return TerrainFeatures(
        elevation_m=round(elev, 1),
        slope_deg=round(slope, 1),
        aspect_deg=round(aspect, 1),
        plan_curvature=round(float(plan_curvature), 3),
        profile_curvature=round(float(profile_curvature), 3),
        terrain_ruggedness_index=tri,
        topographic_wetness_index=twi,
        shear_stress_proxy=shear_stress
    )
