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

@router.get("/states")
def get_states():
    data = load_locations()
    if "states" in data:
        return [{"id": s["id"], "name": s["name"], "state_code": s.get("state_code", "")} for s in data["states"]]
    return [{"id": "maharashtra", "name": data.get("state", "Maharashtra"), "state_code": data.get("state_code", "MH")}]

@router.get("/districts")
def get_districts(state_id: str = None):
    data = load_locations()
    districts_list = []
    if "states" in data:
        for s in data["states"]:
            if not state_id or s["id"].lower() == state_id.lower() or s["name"].lower() == state_id.lower():
                districts_list.extend(s.get("districts", []))
    else:
        districts_list = data.get("districts", [])
    return [{"id": d["id"], "name": d["name"], "center": d["center"]} for d in districts_list]

@router.get("/blocks/{district_id}")
def get_blocks_for_district(district_id: str):
    data = load_locations()
    districts_list = []
    if "states" in data:
        for s in data["states"]:
            districts_list.extend(s.get("districts", []))
    else:
        districts_list = data.get("districts", [])

    for d in districts_list:
        if d["id"].lower() == district_id.lower() or d["name"].lower() == district_id.lower():
            return d.get("blocks", [])
    raise HTTPException(status_code=404, detail="District not found")
