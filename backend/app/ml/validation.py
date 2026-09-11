"""
SlopeSafe ML Data Quality & Environmental Sanity Validator
Performs strict validation on incoming environmental and geotechnical observations.
Rejects impossible values, coordinates out of bounds, negative rainfalls, and extreme anomalies.
"""

from typing import Dict, Any, List, Tuple, Optional
import math

# Valid geographic bounding box for India (Mainland + Island territories)
LAT_MIN, LAT_MAX = 6.0, 37.5
LNG_MIN, LNG_MAX = 68.0, 97.5

# Physical plausibility boundaries
VALID_RANGES = {
    "rainfall_1h": (0.0, 300.0),       # mm/hr (Highest recorded cloudbursts ~200mm/hr)
    "rainfall_24h": (0.0, 1500.0),     # mm/24h (Cherrapunji/Mawsynram record max ~1000mm)
    "rainfall_72h": (0.0, 3000.0),     # mm/72h
    "slope_deg": (0.0, 89.0),          # degrees incline (90 is vertical cliff)
    "soil_moisture": (0.0, 1.0),       # volumetric water content ratio (0% to 100%)
    "elevation": (-50.0, 8848.0),      # meters above sea level
    "ndvi": (-1.0, 1.0),               # Normalized Difference Vegetation Index
    "historical_landslides": (0, 500), # count
    "land_cover": (0, 15)              # categorical index
}

class ValidationError(Exception):
    """Raised when environmental observations fail physical validity checks."""
    pass

def validate_environmental_record(record: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validates a single environmental observation record.
    Returns (is_valid, list_of_error_messages).
    """
    errors = []

    # 1. Geographic Coordinate Bounds Check
    lat = record.get("lat") or record.get("latitude")
    lng = record.get("lng") or record.get("longitude")
    
    if lat is not None:
        try:
            lat_f = float(lat)
            if not (LAT_MIN <= lat_f <= LAT_MAX):
                errors.append(f"Latitude {lat_f}° is outside valid India bounds [{LAT_MIN}°, {LAT_MAX}°].")
        except (ValueError, TypeError):
            errors.append(f"Invalid non-numeric latitude: {lat}")

    if lng is not None:
        try:
            lng_f = float(lng)
            if not (LNG_MIN <= lng_f <= LNG_MAX):
                errors.append(f"Longitude {lng_f}° is outside valid India bounds [{LNG_MIN}°, {LNG_MAX}°].")
        except (ValueError, TypeError):
            errors.append(f"Invalid non-numeric longitude: {lng}")

    # 2. Physical Range Validation
    for field, (min_val, max_val) in VALID_RANGES.items():
        if field in record and record[field] is not None:
            try:
                val = float(record[field])
                if math.isnan(val) or math.isinf(val):
                    errors.append(f"Field '{field}' contains NaN or Infinite value.")
                elif not (min_val <= val <= max_val):
                    errors.append(f"Field '{field}' with value {val} is outside physically plausible range [{min_val}, {max_val}].")
            except (ValueError, TypeError):
                errors.append(f"Field '{field}' must be a numeric value, got: {record[field]}")

    # 3. Consistency Checks
    r1 = record.get("rainfall_1h")
    r24 = record.get("rainfall_24h")
    r72 = record.get("rainfall_72h")

    if r1 is not None and r24 is not None:
        try:
            if float(r1) > float(r24):
                errors.append(f"Inconsistent rainfall: 1h accumulation ({r1}mm) cannot exceed 24h accumulation ({r24}mm).")
        except (ValueError, TypeError):
            pass

    if r24 is not None and r72 is not None:
        try:
            if float(r24) > float(r72):
                errors.append(f"Inconsistent rainfall: 24h accumulation ({r24}mm) cannot exceed 72h accumulation ({r72}mm).")
        except (ValueError, TypeError):
            pass

    return (len(errors) == 0, errors)

def clean_and_sanitize_features(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cleans and clamps input features to safe physical ranges for prediction inference.
    """
    cleaned = record.copy()
    
    # Clamp to boundaries
    for field, (min_val, max_val) in VALID_RANGES.items():
        if field in cleaned and cleaned[field] is not None:
            try:
                val = float(cleaned[field])
                if math.isnan(val) or math.isinf(val):
                    cleaned[field] = min_val
                else:
                    cleaned[field] = max(min_val, min(max_val, val))
            except (ValueError, TypeError):
                cleaned[field] = min_val

    # Ensure rainfall cumulative consistency
    r1 = float(cleaned.get("rainfall_1h", 0.0))
    r24 = float(cleaned.get("rainfall_24h", 0.0))
    r72 = float(cleaned.get("rainfall_72h", 0.0))

    cleaned["rainfall_1h"] = r1
    cleaned["rainfall_24h"] = max(r1, r24)
    cleaned["rainfall_72h"] = max(cleaned["rainfall_24h"], r72)

    return cleaned
