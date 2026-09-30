"""
Farmer Support AI Agent API Router
Exposes conversational chat endpoint for farmer support.
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional, List, Dict
from services.farmer_agent import farmer_agent

router = APIRouter(prefix="/api/agent", tags=["Farmer Support Agent"])

class AgentChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []
    district: Optional[str] = "Pune"
    block: Optional[str] = "Haveli"
    panchayat: Optional[str] = "Wagholi"
    crop: Optional[str] = "soybean"
    days: Optional[int] = 14

@router.post("/chat")
def process_agent_chat_post(req: AgentChatRequest):
    """
    Processes farmer support chat messages in English, Marathi, Hindi, or Hinglish.
    Routes query through FarmerSupportAgent using verified ML Predictor & Advisory Engine data.
    """
    return farmer_agent.process_message(
        message=req.message,
        conversation_history=req.conversation_history or [],
        district=req.district or "Pune",
        block=req.block or "Haveli",
        panchayat=req.panchayat or "Wagholi",
        crop=req.crop or "soybean",
        days=req.days or 14
    )

@router.get("/chat")
def process_agent_chat_get(
    message: str = Query(..., description="Farmer chat query message"),
    district: Optional[str] = Query("Pune"),
    block: Optional[str] = Query("Haveli"),
    panchayat: Optional[str] = Query("Wagholi"),
    crop: Optional[str] = Query("soybean"),
    days: Optional[int] = Query(14)
):
    """
    GET version of farmer support chat endpoint.
    """
    return farmer_agent.process_message(
        message=message,
        conversation_history=[],
        district=district or "Pune",
        block=block or "Haveli",
        panchayat=panchayat or "Wagholi",
        crop=crop or "soybean",
        days=days or 14
    )
