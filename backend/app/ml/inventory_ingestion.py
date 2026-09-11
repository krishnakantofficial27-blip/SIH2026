"""
SlopeSafe Historical Landslide Inventory Ingestion & Spatial Querying Pipeline
Ingests authentic GSI NLSM and NASA GLC event records and computes localized historical hazard densities.
"""

from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Optional, Tuple
import json
import math
from pathlib import Path

@dataclass
class LandslideEventRecord:
    id: str
    event_title: str
    state: str
    district: str
    location: str
    basin_id: str
    latitude: float
    longitude: float
    date: str
    year: int
    trigger: str
    landslide_category: str
    severity: str
    source: str
    fatalities: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class LandslideInventoryIngestion:
    """
    Ingestion engine and spatial indexing for authentic historical landslide events.
    """
    def __init__(self, inventory_path: Optional[Path] = None):
        self.inventory_path = inventory_path or (Path(__file__).resolve().parent / "data" / "landslide_inventory.json")
        self.events: List[LandslideEventRecord] = []
        self._load_inventory()

    def _load_inventory(self):
        if self.inventory_path.exists():
            try:
                with open(self.inventory_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        # Infer severity based on fatalities or damage
                        fat = int(item.get("fatalities", 0))
                        sev = "CRITICAL" if fat >= 50 else ("HIGH" if fat >= 10 else ("MODERATE" if fat > 0 else "LOW"))
                        
                        rec = LandslideEventRecord(
                            id=item["id"],
                            event_title=item.get("event_title", item.get("name", "Historical Slope Movement")),
                            state=item.get("state", "India"),
                            district=item.get("district", "Mountain District"),
                            location=item.get("location", "Highway Corridor"),
                            basin_id=item.get("basin_id", "BASIN-01-BEAS-SUTLEJ"),
                            latitude=float(item.get("latitude", item.get("lat", 0.0))),
                            longitude=float(item.get("longitude", item.get("lng", 0.0))),
                            date=item.get("date", "2024-01-01"),
                            year=int(item.get("year", 2024)),
                            trigger=item.get("trigger", "Monsoon Precipitation Saturation"),
                            landslide_category=item.get("landslide_category", item.get("type", "Debris Slide")),
                            severity=sev,
                            source=item.get("source", item.get("source_agency", "Geological Survey of India (GSI)")),
                            fatalities=fat
                        )
                        self.events.append(rec)
            except Exception:
                pass

    def get_events_near(self, lat: float, lng: float, radius_km: float = 30.0) -> List[Tuple[LandslideEventRecord, float]]:
        """Returns list of (event, distance_km) within radius."""
        res = []
        for ev in self.events:
            # Haversine distance in km
            d_lat = math.radians(ev.latitude - lat)
            d_lng = math.radians(ev.longitude - lng)
            a = math.sin(d_lat / 2.0) ** 2 + math.cos(math.radians(lat)) * math.cos(math.radians(ev.latitude)) * math.sin(d_lng / 2.0) ** 2
            c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
            dist_km = 6371.0 * c
            if dist_km <= radius_km:
                res.append((ev, round(dist_km, 1)))
        res.sort(key=lambda x: x[1])
        return res

    def calculate_historical_hotspot_density(self, lat: float, lng: float, radius_km: float = 25.0) -> Tuple[int, float]:
        """
        Calculates number of documented past landslides and nearest distance within radius.
        Returns (event_count, nearest_distance_km).
        """
        near = self.get_events_near(lat, lng, radius_km)
        count = len(near)
        nearest = near[0][1] if near else 999.0
        return count, nearest

_GLOBAL_INGESTION: Optional[LandslideInventoryIngestion] = None

def get_inventory_ingestion() -> LandslideInventoryIngestion:
    """Singleton getter for inventory ingestion."""
    global _GLOBAL_INGESTION
    if _GLOBAL_INGESTION is None:
        _GLOBAL_INGESTION = LandslideInventoryIngestion()
    return _GLOBAL_INGESTION
