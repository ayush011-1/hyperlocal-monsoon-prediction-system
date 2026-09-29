from fastapi import APIRouter, Query
from services.ml_predictor import ml_predictor

router = APIRouter(prefix="/api/forecast", tags=["Forecast"])

@router.get("")
def get_hyperlocal_forecast(
    district: str = Query(default="Pune", description="District name"),
    block: str = Query(default="Haveli", description="Block name"),
    panchayat: str = Query(default="Wagholi", description="Panchayat name"),
    days: int = Query(default=14, description="Forecast window in days: 7, 14, 21, 30")
):
    """
    Returns probabilistic onset, break/dry spell, and heavy rainfall predictions
    along with daily time-series forecast and GIS risk layers.
    """
    valid_days = [7, 14, 21, 30]
    if days not in valid_days:
        days = 14

    return ml_predictor.predict_probabilities(
        district=district,
        block=block,
        panchayat=panchayat,
        days=days
    )
