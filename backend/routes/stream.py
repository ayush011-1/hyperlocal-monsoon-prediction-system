from fastapi import APIRouter, Query
from datetime import datetime

router = APIRouter(prefix="/api/stream", tags=["Streaming Telemetry"])

@router.get("/live/all")
def get_live_stream_all(threshold: float = Query(default=0.35)):
    """
    Returns live AWS / Radar telemetry stream for agromet monitoring.
    """
    return {
        "status": "active",
        "timestamp": datetime.now().isoformat(),
        "threshold": threshold,
        "active_telemetry_nodes": [
            {
                "node_id": "AWS-PUNE-01",
                "location": "Wagholi, Haveli",
                "rainfall_rate_mm_hr": 4.2,
                "wind_speed_kmh": 14.5,
                "rh_pct": 78.0
            },
            {
                "node_id": "AWS-NASHIK-04",
                "location": "Dindori",
                "rainfall_rate_mm_hr": 2.1,
                "wind_speed_kmh": 11.2,
                "rh_pct": 72.0
            }
        ]
    }
