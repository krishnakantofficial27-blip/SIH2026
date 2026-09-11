"""
SlopeSafe Data Adapters Package
"""
from .weather import (
    WeatherProvider, WeatherObservation, LiveOpenMeteoProvider,
    IMDCompatibleProvider, DemoFallbackProvider, get_weather_provider
)
from .provider import fetch_open_meteo_weather, get_current_data_mode_status, DataProviderStatus, DATA_MODE
