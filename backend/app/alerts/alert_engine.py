"""
SlopeSafe 5-Tier Early Warning Alert & Geofencing Engine
Implements standard NDMA/IMD 5-Tier Alert Hierarchy, deduplication hashes, and geofencing.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import hashlib

ALERT_TIERS = {
    "NORMAL": {
        "score_range": (0.0, 24.9),
        "color": "#22c55e",
        "title_prefix": "🟢 GREEN — NORMAL CONDITIONS",
        "urgency": "LOW",
        "action": "Environmental parameters stable. Normal transit and construction permitted."
    },
    "WATCH": {
        "score_range": (25.0, 49.9),
        "color": "#eab308",
        "title_prefix": "🟡 YELLOW — LANDSLIDE WATCH",
        "urgency": "MODERATE",
        "action": "Elevated soil moisture and ongoing light rainfall. Stay alert on mountain bends."
    },
    "ADVISORY": {
        "score_range": (50.0, 64.9),
        "color": "#f97316",
        "title_prefix": "🟠 ORANGE — HAZARD ADVISORY",
        "urgency": "HIGH",
        "action": "Sustained precipitation threshold breach. High risk of debris runouts. Avoid night driving."
    },
    "WARNING": {
        "score_range": (65.0, 74.9),
        "color": "#ea580c",
        "title_prefix": "🔶 AMBER — SEVERE SLOPE WARNING",
        "urgency": "VERY_HIGH",
        "action": "Imminent rockfall / slope failure danger. QRT teams on standby. Heavy vehicles restricted."
    },
    "CRITICAL": {
        "score_range": (75.0, 100.0),
        "color": "#ef4444",
        "title_prefix": "🚨 RED — CRITICAL LANDSLIDE EMERGENCY",
        "urgency": "CRITICAL",
        "action": "Imminent slope failure or active debris flow. Immediate evacuation of vulnerable corridors."
    }
}

def generate_alert_dedup_hash(zone_id: str, severity: str, timestamp_iso: Optional[str] = None) -> str:
    """
    Generates a unique deduplication hash per zone + severity + 4-hour time block
    to prevent spamming identical alerts repeatedly within the same operational window.
    """
    if not timestamp_iso:
        timestamp_iso = datetime.now(timezone.utc).isoformat()
    # 4-hour bucket window
    dt = datetime.fromisoformat(timestamp_iso.replace("Z", "+00:00"))
    hour_bucket = dt.hour // 4
    date_str = dt.strftime("%Y-%m-%d")
    raw = f"{zone_id}|{severity}|{date_str}|b{hour_bucket}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]

def evaluate_alert_tier(risk_score: float) -> str:
    """Returns the 5-tier alert severity based on the fused risk score."""
    if risk_score >= 75.0:
        return "CRITICAL"
    elif risk_score >= 65.0:
        return "WARNING"
    elif risk_score >= 50.0:
        return "ADVISORY"
    elif risk_score >= 25.0:
        return "WATCH"
    return "NORMAL"

def create_geofenced_alert(
    zone_id: str,
    zone_name: str,
    district: str,
    risk_score: float,
    rainfall_24h: float,
    verified_reports: int = 0
) -> Optional[Dict[str, Any]]:
    """
    Generates an institutional alert packet if risk exceeds threshold.
    """
    severity = evaluate_alert_tier(risk_score)
    if severity == "NORMAL":
        return None

    tier_info = ALERT_TIERS[severity]
    now_iso = datetime.now(timezone.utc).isoformat()
    dedup_hash = generate_alert_dedup_hash(zone_id, severity, now_iso)

    title = f"{tier_info['title_prefix']} — {zone_name}"
    msg = (
        f"Fused Landslide Hazard Index: {risk_score:.1f}/100 in {district} district. "
        f"24h Precipitation: {rainfall_24h:.1f}mm. "
        f"{verified_reports} verified ground hazard reports in corridor vicinity."
    )

    return {
        "zone_id": zone_id,
        "district": district,
        "title": title,
        "message": msg,
        "severity": severity,
        "status": "ACTIVE",
        "action_advice": tier_info["action"],
        "dedup_hash": dedup_hash,
        "source": "SlopeSafe National Multi-Hazard Early Warning Pipeline",
        "created_at": now_iso
    }
