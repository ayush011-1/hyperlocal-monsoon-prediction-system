from fastapi import APIRouter, HTTPException
import json
import os

router = APIRouter(prefix="/api/locations", tags=["Locations"])

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "locations.json")

def load_locations():
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=500, detail="Locations dataset not found")
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("")
def get_all_locations():
    """
    Returns hierarchical location tree: State -> Districts -> Blocks -> Panchayats
    """
    return load_locations()

@router.get("/districts")
def get_districts():
    data = load_locations()
    return [{"id": d["id"], "name": d["name"], "center": d["center"]} for d in data.get("districts", [])]

@router.get("/blocks/{district_id}")
def get_blocks_for_district(district_id: str):
    data = load_locations()
    for d in data.get("districts", []):
        if d["id"].lower() == district_id.lower() or d["name"].lower() == district_id.lower():
            return d.get("blocks", [])
    raise HTTPException(status_code=404, detail="District not found")
