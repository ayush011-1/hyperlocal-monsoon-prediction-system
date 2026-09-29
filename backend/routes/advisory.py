from fastapi import APIRouter, Query
from services.advisory_engine import advisory_engine, CROP_PROFILES
from services.ml_predictor import ml_predictor

router = APIRouter(prefix="/api/advisory", tags=["Advisory"])

@router.get("")
def get_crop_advisory(
    crop: str = Query(default="soybean", description="Crop identifier: soybean, rice, maize, cotton, bajra"),
    district: str = Query(default="Pune", description="District name"),
    block: str = Query(default="Haveli", description="Block name"),
    panchayat: str = Query(default="Wagholi", description="Panchayat name"),
    days: int = Query(default=14, description="Forecast period in days")
):
    """
    Translates prediction probabilities into crop-specific agronomic advice in English, Marathi, and Hindi.
    """
    prediction = ml_predictor.predict_probabilities(district=district, block=block, panchayat=panchayat, days=days)
    probs = prediction["probabilities"]

    return advisory_engine.generate_advisory(
        crop_id=crop,
        district=district,
        block=block,
        panchayat=panchayat,
        days=days,
        onset_prob=probs["monsoon_onset"],
        break_prob=probs["break_dry_spell"],
        heavy_prob=probs["heavy_rainfall"],
        confidence_level=prediction.get("confidence_level", 85)
    )

@router.get("/supported-crops")
def get_supported_crops():
    """
    Returns list of crops supported by the agronomic advisory system.
    """
    crops_list = []
    for cid, data in CROP_PROFILES.items():
        crops_list.append({
            "id": cid,
            "name": data["name"],
            "marathi_name": data["marathi_name"],
            "hindi_name": data["hindi_name"],
            "sowing_moisture_depth_cm": data["sowing_moisture_depth_cm"],
            "dry_spell_tolerance_days": data["dry_spell_tolerance_days"]
        })
    return crops_list
