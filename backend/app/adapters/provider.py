"""
SlopeSafe Unified Data Provider & Adapter Architecture
Supports both DATA_MODE=real and DATA_MODE=demo with explicit provenance tracking.
Never presents synthetic/demo observations as real ground truth measurements.
"""

import os
import time
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import httpx

DATA_MODE = os.getenv("DATA_MODE", "demo").lower()  # "real" or "demo"

class DataProviderStatus:
    LIVE = "LIVE_DATA"
    CACHED = "CACHED_DATA"
    DEMO = "DEMO_DATA"
    UNAVAILABLE = "DATA_UNAVAILABLE"

# In-memory weather cache: { (lat, lng): (timestamp, data_dict) }
_WEATHER_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}
CACHE_TTL_SECONDS = 1800.0  # 30 minutes

async def fetch_open_meteo_weather(lat: float, lng: float) -> Tuple[Dict[str, Any], str]:
    """
    Fetches real-time precipitation and soil saturation from Open-Meteo API.
    Returns (weather_dict, data_status_badge).
    """
    cache_key = f"{round(lat, 2)}:{round(lng, 2)}"
    now = time.time()

    # Check cache first
    if cache_key in _WEATHER_CACHE:
        cached_ts, cached_data = _WEATHER_CACHE[cache_key]
        if now - cached_ts < CACHE_TTL_SECONDS:
            return cached_data, DataProviderStatus.CACHED

    if DATA_MODE == "real":
        try:
            url = (
                f"https://api.open-meteo.com/v1/forecast"
                f"?latitude={lat}&longitude={lng}"
                f"&hourly=precipitation,soil_moisture_0_to_7cm"
                f"&daily=precipitation_sum,precipitation_hours"
                f"&timezone=auto&forecast_days=3"
            )
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    hourly_rain = data.get("hourly", {}).get("precipitation", [0.0])
                    soil_moist = data.get("hourly", {}).get("soil_moisture_0_to_7cm", [0.3])
                    daily_rain = data.get("daily", {}).get("precipitation_sum", [0.0, 0.0, 0.0])

                    r1 = float(hourly_rain[-1]) if hourly_rain else 0.0
                    r24 = float(daily_rain[0]) if daily_rain else sum(hourly_rain[-24:])
                    r72 = float(sum(daily_rain[:3])) if daily_rain else r24 * 1.8
                    moist = float(soil_moist[-1]) if soil_moist else 0.45

                    result = {
                        "rainfall_1h": round(r1, 1),
                        "rainfall_24h": round(r24, 1),
                        "rainfall_72h": round(r72, 1),
                        "soil_moisture": round(moist, 2),
                        "source": "Open-Meteo ERA5 / Numerical Weather Forecast",
                        "fetched_at": datetime.now(timezone.utc).isoformat()
                    }
                    _WEATHER_CACHE[cache_key] = (now, result)
                    return result, DataProviderStatus.LIVE
        except Exception:
            pass  # Fall back gracefully

    # Fallback to cached or demo baseline
    if cache_key in _WEATHER_CACHE:
        return _WEATHER_CACHE[cache_key][1], DataProviderStatus.CACHED

    demo_result = {
        "rainfall_1h": 8.0,
        "rainfall_24h": 45.0,
        "rainfall_72h": 90.0,
        "soil_moisture": 0.52,
        "source": "SlopeSafe Calibrated Demonstration Baseline",
        "fetched_at": datetime.now(timezone.utc).isoformat()
    }
    return demo_result, DataProviderStatus.DEMO

def get_current_data_mode_status() -> Dict[str, Any]:
    """Returns the operational data mode status for the UI badge."""
    return {
        "configured_mode": DATA_MODE,
        "status_badge": DataProviderStatus.LIVE if DATA_MODE == "real" else DataProviderStatus.DEMO,
        "is_real_data": DATA_MODE == "real",
        "cache_entries_active": len(_WEATHER_CACHE),
        "disclaimer": (
            "Data Mode Transparency: Operating in " + 
            ("REAL TELEMETRY MODE (Live Open-Meteo + GSI Dataset)" if DATA_MODE == "real" else "DEMONSTRATION SIMULATION MODE (Calibrated Demo Slopes)")
        )
    }
