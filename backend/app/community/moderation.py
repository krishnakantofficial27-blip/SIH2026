"""
SlopeSafe Community Intelligence, Duplicate Detection & Abuse Prevention Module
Prevents false alarms via spatial-temporal duplicate clustering, reporter reputation scoring,
IP rate limiting, and a 3-tier verification hierarchy.
"""

from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timezone, timedelta
import math

# Thresholds
DUPLICATE_RADIUS_KM = 0.60       # 600 meters
DUPLICATE_WINDOW_HOURS = 2.0     # 2 hours
MAX_REPORTS_PER_HOUR_IP = 3      # Abuse protection

# Verification Hierarchy
VERIFICATION_LEVELS = {
    "UNVERIFIED_CITIZEN": {
        "trust_multiplier": 0.35,
        "description": "Submitted by citizen ground observer; awaiting cross-correlation."
    },
    "FIELD_VERIFIED": {
        "trust_multiplier": 0.80,
        "description": "Verified on-site by SDRF, QRT, or multiple independent observers."
    },
    "AUTHORITY_COMMAND_VERIFIED": {
        "trust_multiplier": 1.00,
        "description": "Officially verified and signed by District Magistrate / DDMA Commander."
    }
}

# In-memory rate limiting and recent reports for deduplication
_IP_REPORT_TIMESTAMPS: Dict[str, List[float]] = {}
_RECENT_REPORTS_CACHE: List[Dict[str, Any]] = []

def check_report_rate_limit(client_ip: str) -> bool:
    """
    Ensures a single client IP cannot spam hazard reports (max 3 per hour).
    Returns True if allowed, False if rate limited.
    """
    now = datetime.now(timezone.utc).timestamp()
    if client_ip not in _IP_REPORT_TIMESTAMPS:
        _IP_REPORT_TIMESTAMPS[client_ip] = []

    # Clean old timestamps (> 1 hour)
    _IP_REPORT_TIMESTAMPS[client_ip] = [
        ts for ts in _IP_REPORT_TIMESTAMPS[client_ip] 
        if now - ts < 3600.0
    ]

    if len(_IP_REPORT_TIMESTAMPS[client_ip]) >= MAX_REPORTS_PER_HOUR_IP:
        return False

    _IP_REPORT_TIMESTAMPS[client_ip].append(now)
    return True

def calculate_haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * (math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def detect_duplicate_report(
    lat: float, 
    lng: float, 
    report_type: str, 
    existing_reports: List[Dict[str, Any]]
) -> Tuple[bool, Optional[str]]:
    """
    Checks if a report is a duplicate of a recent report within 600m and 2 hours.
    Returns (is_duplicate, duplicate_parent_id).
    """
    now = datetime.now(timezone.utc)
    for r in existing_reports:
        try:
            r_lat = float(r.get("latitude") or r.get("lat", 0.0))
            r_lng = float(r.get("longitude") or r.get("lng", 0.0))
            dist = calculate_haversine_km(lat, lng, r_lat, r_lng)
            
            if dist <= DUPLICATE_RADIUS_KM:
                # Check report type concordance
                if r.get("report_type") == report_type:
                    return (True, str(r.get("id") or r.get("report_code", "PARENT_REPORT")))
        except Exception:
            continue

    return (False, None)

def calculate_trust_weighted_evidence(reports: List[Dict[str, Any]]) -> Tuple[int, float]:
    """
    Calculates the effective verified report count downweighting unverified singletons.
    Returns (effective_verified_count, average_trust_multiplier).
    """
    if not reports:
        return 0, 0.0

    total_weight = 0.0
    verified_count = 0

    for r in reports:
        status = str(r.get("status", "SUBMITTED")).upper()
        if status in ["VERIFIED", "ACTION_REQUIRED", "AUTHORITY_VERIFIED"]:
            level_info = VERIFICATION_LEVELS.get("AUTHORITY_COMMAND_VERIFIED" if status == "AUTHORITY_VERIFIED" else "FIELD_VERIFIED")
            total_weight += level_info["trust_multiplier"]
            verified_count += 1
        elif status == "UNDER_REVIEW":
            total_weight += 0.20
        else: # UNVERIFIED SUBMITTED
            total_weight += 0.10

    avg_trust = round(total_weight / len(reports), 2) if reports else 0.0
    return verified_count, avg_trust
