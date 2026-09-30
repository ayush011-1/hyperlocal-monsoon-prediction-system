"""
Farmer Support AI Agent Service
A conversational, multilingual agromet decision-support agent for farmers.
Uses nlp_engine for intent/entity parsing, and enforces ml_predictor & advisory_engine
as the strict single source of truth for predictions and recommendations.
"""

from typing import Dict, Any, List, Optional
from services.nlp_engine import nlp_engine
from services.ml_predictor import ml_predictor
from services.advisory_engine import advisory_engine

class FarmerSupportAgent:
    def __init__(self):
        self.system_role = "Agromet AI Kisan Sahayak"

    def process_message(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        district: str = "Pune",
        block: str = "Haveli",
        panchayat: str = "Wagholi",
        crop: str = "soybean",
        days: int = 14
    ) -> Dict[str, Any]:
        """
        Executes the Farmer Support Agent workflow:
        Query -> NLP Parsing -> Context Resolution -> ML Predictor + Advisory Execution -> Farmer-Friendly Agent Response.
        """
        history = conversation_history or []

        # 1. NLP Parsing
        lang_code, lang_label = nlp_engine.detect_language(message)
        intent = nlp_engine.detect_intent(message)
        entities = nlp_engine.extract_entities(
            message,
            default_district=district,
            default_block=block,
            default_panchayat=panchayat,
            default_crop=crop,
            default_days=days
        )

        resolved_district = entities["district"]
        resolved_block = entities["block"]
        resolved_panchayat = entities["panchayat"]
        resolved_crop = entities["crop"]
        resolved_days = entities["days"]

        # 2. Strict Single Source of Truth Execution
        ml_res = ml_predictor.predict_probabilities(
            district=resolved_district,
            block=resolved_block,
            panchayat=resolved_panchayat,
            days=resolved_days
        )

        onset_prob = ml_res["probabilities"]["monsoon_onset"]
        break_prob = ml_res["probabilities"]["break_dry_spell"]
        heavy_prob = ml_res["probabilities"]["heavy_rainfall"]
        confidence = ml_res.get("confidence_level", 85)

        advisory_res = advisory_engine.generate_advisory(
            crop_id=resolved_crop,
            district=resolved_district,
            block=resolved_block,
            panchayat=resolved_panchayat,
            days=resolved_days,
            onset_prob=onset_prob,
            break_prob=break_prob,
            heavy_prob=heavy_prob,
            confidence_level=confidence
        )

        crop_display = advisory_res.get("crop", resolved_crop.title())
        crop_details = advisory_res.get("crop_details", {})

        # 3. Conversational Agent Response Generation
        agent_response = self._generate_conversational_response(
            message=message,
            lang_code=lang_code,
            intent=intent,
            district=resolved_district,
            block=resolved_block,
            panchayat=resolved_panchayat,
            crop_display=crop_display,
            crop_details=crop_details,
            days=resolved_days,
            onset_prob=onset_prob,
            break_prob=break_prob,
            heavy_prob=heavy_prob,
            advisory_res=advisory_res,
            history=history
        )

        # 4. Update Conversation Memory
        updated_history = list(history)
        updated_history.append({"role": "user", "text": message})
        updated_history.append({"role": "agent", "text": agent_response})

        return {
            "agent_response": agent_response,
            "language": lang_code,
            "language_label": lang_label,
            "intent": intent,
            "context": {
                "district": resolved_district,
                "block": resolved_block,
                "panchayat": resolved_panchayat,
                "crop": resolved_crop,
                "crop_display": f"{crop_display} ({crop_details.get('marathi_name', '')})",
                "days": resolved_days
            },
            "ml_verified_data": {
                "monsoon_onset_percent": onset_prob,
                "break_dry_spell_percent": break_prob,
                "heavy_rainfall_percent": heavy_prob,
                "overall_risk_status": ml_res.get("overall_risk_status"),
                "confidence_level": f"{confidence}%"
            },
            "advisory_verified_data": {
                "primary_action": advisory_res.get("recommendation"),
                "primary_action_marathi": advisory_res.get("recommendation_marathi"),
                "primary_action_hindi": advisory_res.get("recommendation_hindi"),
                "reasons": advisory_res.get("reasons", []),
                "field_measures": advisory_res.get("field_measures", []),
                "urgency_level": advisory_res.get("urgency_level", "Normal")
            },
            "updated_history": updated_history
        }

    def _generate_conversational_response(
        self,
        message: str,
        lang_code: str,
        intent: str,
        district: str,
        block: str,
        panchayat: str,
        crop_display: str,
        crop_details: dict,
        days: int,
        onset_prob: int,
        break_prob: int,
        heavy_prob: int,
        advisory_res: dict,
        history: List[Dict[str, str]]
    ) -> str:
        mr_crop = crop_details.get("marathi_name", crop_display)
        hi_crop = crop_details.get("hindi_name", crop_display)

        rec_en = advisory_res.get("recommendation", "")
        rec_mr = advisory_res.get("recommendation_marathi", rec_en)
        rec_hi = advisory_res.get("recommendation_hindi", rec_en)

        measures = advisory_res.get("field_measures", [])
        m_str_en = " ".join(measures[:2]) if measures else ""
        m_str_mr = " बियाण्यांवर ट्रायकोडेर्माची प्रक्रिया करा आणि पाणी निचऱ्याची सोय ठेवा." if measures else ""

        # MARATHI (mr)
        if lang_code == "mr":
            if intent == "sowing_advisory" or "पेरणी" in message:
                if onset_prob >= 75:
                    return f"नमस्कार शेतकरी बंधूंनो, {panchayat} ({block}, {district}) परिसरात मान्सून आगमनाची शक्यता {onset_prob}% आहे. {rec_mr} जमिनीत पुरेसा ओलावा (>५० मिमी पाऊस) झाल्याची खात्री करूनच पेरणी करा. {m_str_mr}"
                else:
                    return f"नमस्कार शेतकरी बंधूंनो, {panchayat} भागात आगमनाची शक्यता कमी ({onset_prob}%) आहे. {rec_mr} पाऊस सुरू होईपर्यंत पेरणी घाई करू नका."
            
            elif intent == "weather_forecast" or "पाऊस कसा आहे" in message:
                return f"📍 {panchayat} गावात पुढील {days} दिवसांचा हवामान अंदाज: पावसाच्या आगमनाची शक्यता {onset_prob}%, खंडाचा धोका {break_prob}%, आणि अतिवृष्टीची शक्यता {heavy_prob}% आहे. हवामान संचलित कृषी सल्ला: {rec_mr}"

            elif intent == "dry_spell_risk" or "खंड" in message:
                return f"⚠️ {panchayat} परिसरात पुढील {days} दिवसांत पावसाचा खंड पडण्याची (Dry Spell) शक्यता {break_prob}% आहे. {rec_mr} पिकाला पाण्याचा ताण बसू नये म्हणून तुषार किंवा ठिबक सिंचनाची सोय तयार ठेवा."

            elif intent == "heavy_rainfall_risk" or "मुसळधार" in message or "धोका" in message:
                return f"🚨 {panchayat} क्षेत्रात मुसळधार / अतिवृष्टीची शक्यता {heavy_prob}% नोंदवली आहे. {rec_mr} शेतातील सऱ्या आणि पाटातील पाण्याचा निचरा मोकळा करा जेणेकरून बियाणे कुजणार नाही."

            elif intent == "irrigation_advisory" or "पाणी" in message:
                return f"💧 {mr_crop} पिकासाठी पाणी व्यवस्थापन सल्ला ({panchayat}): खंडाचा धोका {break_prob}% आहे. {rec_mr} जमिनीत ७.५ सेंमी ओलावा टिकून राहण्यासाठी हलके सिंचन द्या."

            else:
                return f"नमस्कार शेतकरी बंधूंनो, {panchayat} करिता पुढील {days} दिवसांचा अंदाज: आगमनाची शक्यता {onset_prob}%, खंड {break_prob}%, अतिवृष्टी {heavy_prob}%. {mr_crop} पिकासाठी सल्ला: {rec_mr}"

        # HINDI (hi)
        elif lang_code == "hi":
            if intent == "sowing_advisory":
                return f"नमस्कार किसान भाई! {panchayat} ({block}, {district}) में अगले {days} दिनों में मानसून आगमन की संभावना {onset_prob}% है। {rec_hi} कम से कम 50 मिमी वर्षा होने पर ही बुवाई करें।"
            elif intent == "dry_spell_risk":
                return f"⚠️ {panchayat} में सूखा/ब्रेक का जोखिम {break_prob}% है। {rec_hi} सिंचाई का बैकअप तैयार रखें।"
            elif intent == "heavy_rainfall_risk":
                return f"🚨 {panchayat} क्षेत्र में भारी बारिश का खतरा {heavy_prob}% है। {rec_hi} जल निकासी की व्यवस्था दुरुस्त करें।"
            elif intent == "irrigation_advisory":
                return f"💧 {hi_crop} के लिए सिंचाई सलाह: {panchayat} में सूखा जोखिम {break_prob}% है। {rec_hi}"
            else:
                return f"नमस्कार किसान भाई, {panchayat} के लिए अगले {days} दिनों का पूर्वानुमान: आगमन {onset_prob}%, सूखा जोखिम {break_prob}%, भारी बारिश {heavy_prob}%। सलाह: {rec_hi}"

        # HINGLISH / MARATHI-ENGLISH (hinglish)
        elif lang_code == "hinglish":
            if "paani" in message.lower() or intent == "irrigation_advisory":
                return f"💧 {panchayat} ({block}, {district}) me {crop_display} ke liye Water Management Advisory: Dry spell break risk is {break_prob}%. {rec_en} Continuous soil moisture maintain kare aur micro-irrigation ready rakhe."
            elif "peravi" in message.lower() or "perani" in message.lower() or intent == "sowing_advisory":
                return f"🌾 Namaskar Shetkari/Kisan bhai! {panchayat} me next {days} days me Monsoon Onset Chance {onset_prob}% hai. {rec_en} At least 50mm wetting rain ke baad hi sowing start kare."
            elif intent == "dry_spell_risk":
                return f"⚠️ {panchayat} me Dry Spell / Rain Break Risk {break_prob}% hai. {rec_en} Backup irrigation ready rakhe."
            elif intent == "heavy_rainfall_risk" or "doka" in message.lower() or "heavy" in message.lower():
                return f"🚨 {panchayat} me Heavy Rainfall Risk {heavy_prob}% hai. {rec_en} Drainage channels clear kare."
            else:
                return f"🌾 {panchayat} ({block}, {district}) ke liye next {days} days forecast: Monsoon Onset Chance {onset_prob}%, Dry Spell Risk {break_prob}%, Heavy Rain Risk {heavy_prob}%. {crop_display} Agromet Advisory: {rec_en}"

        # ENGLISH (en)
        else:
            if intent == "sowing_advisory":
                return f"🌾 For {panchayat} ({block}, {district}), the ML model estimates a {onset_prob}% Monsoon Onset Probability over the next {days} days. {rec_en} {m_str_en}"
            elif intent == "dry_spell_risk":
                return f"⚠️ Dry Spell Risk for {panchayat} is at {break_prob}%. {rec_en} Ensure protective irrigation readiness."
            elif intent == "heavy_rainfall_risk":
                return f"🚨 Heavy Rainfall Episode Probability for {panchayat} is {heavy_prob}%. {rec_en} Clear field outlets immediately."
            elif intent == "irrigation_advisory":
                return f"💧 Irrigation Guidance for {crop_display} in {panchayat}: Dry spell hazard is {break_prob}%. {rec_en}"
            else:
                return f"🌾 For {panchayat} ({block}, {district}) over the next {days} days: Onset Probability is {onset_prob}%, Dry Spell Hazard is {break_prob}%, and Heavy Rain Probability is {heavy_prob}%. Advisory for {crop_display}: {rec_en}"

farmer_agent = FarmerSupportAgent()
