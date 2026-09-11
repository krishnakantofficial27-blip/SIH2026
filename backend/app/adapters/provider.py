"""
SlopeSafe Unified Data Provider & Adapter Architecture
Supports both DATA_MODE=real and DATA_MODE=demo with explicit provenance tracking.
Never presents synthetic/demo observations as real ground truth measurements.
"""

import os
from typing import Dict, Any, Tuple
from .weather import get_weather_provider, WeatherObservation, WeatherProvider

DATA_MODE = os.getenv("DATA_MODE", "real").lower()  # "real" or "demo"

class DataProviderStatus:
    LIVE = "LIVE_DATA"
    CACHED = "CACHED_DATA"
    DEMO = "DEMO_DATA"
    UNAVAILABLE = "DATA_UNAVAILABLE"

async def fetch_open_meteo_weather(lat: float, lng: float) -> Tuple[Dict[str, Any], str]:
    """
    Fetches real-time precipitation and soil saturation from the active WeatherProvider.
    Returns (weather_dict, data_status_badge).
    """
    provider = get_weather_provider()
    obs: WeatherObservation = await provider.get_weather(lat, lng)
    return obs.to_dict(), obs.data_status

def get_current_data_mode_status() -> Dict[str, Any]:
    """Returns the operational data mode status for the UI badge."""
    provider = get_weather_provider()
    provider_name = provider.__class__.__name__
    is_real = "Demo" not in provider_name

    return {
        "configured_mode": DATA_MODE,
        "active_provider": provider_name,
        "status_badge": DataProviderStatus.LIVE if is_real else DataProviderStatus.DEMO,
        "is_real_data": is_real,
        "disclaimer": (
            "Data Mode Transparency: Operating in " + 
            ("REAL TELEMETRY MODE (Live Open-Meteo & IMD AWS Grid)" if is_real else "DEMONSTRATION SIMULATION MODE (Calibrated Demo Slopes)")
        )
    }

