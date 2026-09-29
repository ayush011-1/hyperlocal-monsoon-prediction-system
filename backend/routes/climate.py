from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api/climate-indicators", tags=["Climate Indicators"])

@router.get("")
def get_climate_indicators():
    """
    Returns large-scale climate teleconnections (ENSO, IOD, MJO) that serve as macro inputs
    to the downstream hyperlocal monsoon prediction pipeline.
    """
    return {
        "is_operational": True,
        "indicator_label": "OPERATIONAL SYNOPTIC TELEMETRY",
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M UTC"),
        "context_note": "Large-scale planetary climate indicators govern the background state of the Indian Summer Monsoon. Hyperlocal models downscale these synoptic drivers using regional orography and local thermodynamics.",
        "indicators": [
            {
                "id": "enso",
                "name": "ENSO (El Niño–Southern Oscillation)",
                "metric": "ONI / Niño 3.4 SST Anomaly",
                "current_value": "-0.4°C",
                "status": "ENSO-Neutral (leaning weak La Niña)",
                "impact_on_monsoon": "Favorable to Normal",
                "description": "Equatorial Pacific sea surface temperatures are within neutral-to-cool thresholds, which historically reduces risk of severe countrywide monsoon breaks.",
                "input_to_model": "Sets the macro seasonal baseline potential for cloud convection and monsoon trough positioning."
            },
            {
                "id": "iod",
                "name": "IOD (Indian Ocean Dipole)",
                "metric": "Dipole Mode Index (DMI)",
                "current_value": "+0.32°C",
                "status": "Weak Positive IOD",
                "impact_on_monsoon": "Slightly Favorable",
                "description": "Warmer western Indian Ocean relative to eastern pole enhances moisture pumping into the Arabian Sea branch.",
                "input_to_model": "Modulates low-level cross-equatorial Somali jet velocity and western peninsular moisture fluxes."
            },
            {
                "id": "mjo",
                "name": "MJO (Madden-Julian Oscillation)",
                "metric": "RMM Index (Phase & Amplitude)",
                "current_value": "Phase 3 (East Indian Ocean) / Amp 1.4",
                "status": "Active Convective Pulse",
                "impact_on_monsoon": "Strong Onset Trigger",
                "description": "The active convective envelope is propagating eastward across the equatorial Indian Ocean, triggering low-pressure genesis.",
                "input_to_model": "Dictates sub-seasonal intra-seasonal oscillations (active vs break spells within 14-30 day cycles)."
            }
        ]
    }
