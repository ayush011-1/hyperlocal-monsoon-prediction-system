"""
NLP Query API Router
Exposes natural-language agro-meteorological query endpoint for multilingual decision support.
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from services.nlp_engine import nlp_engine

router = APIRouter(prefix="/api/nlp", tags=["NLP Pipeline"])

class QueryRequest(BaseModel):
    query: str
    district: Optional[str] = "Pune"
    block: Optional[str] = "Haveli"
    panchayat: Optional[str] = "Wagholi"
    crop: Optional[str] = "soybean"
    days: Optional[int] = 14

@router.post("/query")
def process_nlp_query_post(req: QueryRequest):
    """
    Processes natural language agricultural queries in English, Marathi, Hindi, or Hinglish.
    Extracts entities and routes to real ML & Advisory engines.
    """
    return nlp_engine.process_query(
        query=req.query,
        current_district=req.district or "Pune",
        current_block=req.block or "Haveli",
        current_panchayat=req.panchayat or "Wagholi",
        current_crop=req.crop or "soybean",
        current_days=req.days or 14
    )

@router.get("/query")
def process_nlp_query_get(
    q: str = Query(..., description="Natural language query string"),
    district: Optional[str] = Query("Pune"),
    block: Optional[str] = Query("Haveli"),
    panchayat: Optional[str] = Query("Wagholi"),
    crop: Optional[str] = Query("soybean"),
    days: Optional[int] = Query(14)
):
    """
    GET version of natural language agricultural query endpoint.
    """
    return nlp_engine.process_query(
        query=q,
        current_district=district or "Pune",
        current_block=block or "Haveli",
        current_panchayat=panchayat or "Wagholi",
        current_crop=crop or "soybean",
        current_days=days or 14
    )
