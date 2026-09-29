from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import json
import os
import uuid
from datetime import datetime

router = APIRouter(prefix="/api", tags=["Field Observations"])

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "observations.json")

class FieldObservationCreate(BaseModel):
    district: str
    block: str
    panchayat: str
    date: Optional[str] = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    observed_rainfall_mm: float
    rainfall_condition: str
    crop_condition: str
    remarks: str
    officer_name: Optional[str] = "Agricultural Field Officer"
    has_photo: Optional[bool] = False

def load_observations() -> List[dict]:
    if not os.path.exists(DATA_PATH):
        return []
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_observations(obs_list: List[dict]):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(obs_list, f, indent=2)

@router.get("/field-observations")
def get_all_field_observations():
    """
    Returns all submitted ground-truth validation reports from Agricultural Officers.
    """
    return load_observations()

@router.post("/field-observation")
def create_field_observation(obs: FieldObservationCreate):
    """
    Saves an officer ground observation report into backend observational storage.
    """
    current_list = load_observations()
    new_entry = {
        "id": f"obs-{uuid.uuid4().hex[:6]}",
        "district": obs.district,
        "block": obs.block,
        "panchayat": obs.panchayat,
        "date": obs.date or datetime.now().strftime("%Y-%m-%d"),
        "observed_rainfall_mm": float(obs.observed_rainfall_mm),
        "rainfall_condition": obs.rainfall_condition,
        "crop_condition": obs.crop_condition,
        "remarks": obs.remarks,
        "officer_name": obs.officer_name or "Agricultural Officer",
        "status": "Submitted & Logged",
        "has_photo": obs.has_photo,
        "submitted_at": datetime.now().isoformat()
    }
    # Prepend to list so newest is first
    current_list.insert(0, new_entry)
    save_observations(current_list)

    return {
        "success": True,
        "message": "Field observation registered successfully into validation repository.",
        "data": new_entry
    }
