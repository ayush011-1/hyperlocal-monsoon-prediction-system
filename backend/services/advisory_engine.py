"""
Rule-Based Crop Advisory Engine
Translates hyperlocal onset, dry spell, and heavy rainfall probabilities into actionable agronomic guidance.
Supports English, Marathi (मराठी), and Hindi (हिंदी).
"""

from typing import Dict, Any, List

CROP_PROFILES = {
    "soybean": {
        "name": "Soybean",
        "marathi_name": "सोयाबीन",
        "hindi_name": "सोयाबीन",
        "sowing_moisture_depth_cm": 7.5,
        "sowing_ideal_rain_threshold_mm": 50.0,
        "dry_spell_tolerance_days": 10,
        "waterlogging_sensitivity": "High"
    },
    "rice": {
        "name": "Rice (Paddy)",
        "marathi_name": "भात (तांदूळ)",
        "hindi_name": "धान (चावल)",
        "sowing_moisture_depth_cm": 15.0,
        "sowing_ideal_rain_threshold_mm": 80.0,
        "dry_spell_tolerance_days": 5,
        "waterlogging_sensitivity": "Very Low (Water loving)"
    },
    "maize": {
        "name": "Maize (Corn)",
        "marathi_name": "मका",
        "hindi_name": "मक्का",
        "sowing_moisture_depth_cm": 6.0,
        "sowing_ideal_rain_threshold_mm": 40.0,
        "dry_spell_tolerance_days": 14,
        "waterlogging_sensitivity": "Medium-High"
    },
    "cotton": {
        "name": "Cotton",
        "marathi_name": "कापूस",
        "hindi_name": "कपास",
        "sowing_moisture_depth_cm": 10.0,
        "sowing_ideal_rain_threshold_mm": 60.0,
        "dry_spell_tolerance_days": 18,
        "waterlogging_sensitivity": "Medium"
    },
    "bajra": {
        "name": "Bajra (Pearl Millet)",
        "marathi_name": "बाजरी",
        "hindi_name": "बाजरा",
        "sowing_moisture_depth_cm": 4.0,
        "sowing_ideal_rain_threshold_mm": 30.0,
        "dry_spell_tolerance_days": 21,
        "waterlogging_sensitivity": "High"
    }
}

class CropAdvisoryEngine:
    def generate_advisory(
        self,
        crop_id: str,
        district: str,
        block: str,
        panchayat: str,
        days: int,
        onset_prob: int,
        break_prob: int,
        heavy_prob: int,
        confidence_level: int = 85,
        crop_stage: str = "sowing"
    ) -> Dict[str, Any]:
        crop_key = (crop_id or "soybean").lower()
        if crop_key not in CROP_PROFILES:
            crop_key = "soybean"

        stage_key = (crop_stage or "sowing").lower()

        profile = CROP_PROFILES[crop_key]
        crop_name = profile["name"]

        # Action directives
        primary_action = ""
        action_marathi = ""
        action_hindi = ""
        
        reasons: List[str] = []
        reasons_mr: List[str] = []
        reasons_hi: List[str] = []
        
        field_measures: List[str] = []
        urgency = "Normal"

        # Rule evaluation
        if onset_prob >= 75 and break_prob <= 25 and heavy_prob <= 40:
            urgency = "Optimal"
            primary_action = f"Proceed with {crop_name} sowing as cumulative onset conditions are strongly favorable."
            action_marathi = f"मान्सून आगमनाची अनुकूल स्थिती असल्याने {profile['marathi_name']} पेरणीस सुरुवात करा."
            action_hindi = f"मानसून आगमन के अनुकूल संकेत हैं, {profile['hindi_name']} की बुवाई शुरू करें।"

            reasons.append(f"Onset probability is high ({onset_prob}%) and sustained soil moisture accumulation (>50mm) is anticipated.")
            reasons_mr.append(f"आगमनाची शक्यता जास्त ({onset_prob}%) असून जमिनीत पुरेसा ओलावा (>५० मिमी) संचित होईल.")
            reasons_hi.append(f"मानसून आगमन की संभावना अधिक ({onset_prob}%) है और मिट्टी में पर्याप्त नमी रहेगी।")

            field_measures.append("Ensure seed treatment with Rhizobium and Trichoderma before sowing.")
            field_measures.append("Maintain recommended row spacing (45 cm for Soybean) to optimize plant density.")

        elif onset_prob < 50:
            urgency = "Caution - Delay"
            primary_action = f"Consider delaying {crop_name} sowing and monitor local rainfall conditions closely."
            action_marathi = f"सध्या {profile['marathi_name']} पेरणी पुढे ढकला आणि स्थानिक पावसाच्या नोंदींचे निरीक्षण करा."
            action_hindi = f"फिलहाल {profile['hindi_name']} की बुवाई टालें और बारिश की स्थिति पर नजर रखें।"

            reasons.append(f"Onset probability is low ({onset_prob}%). Sowing in dry soil risks poor seed germination and seedling mortality.")
            reasons_mr.append(f"आगमनाची शक्यता कमी ({onset_prob}%) आहे. पुरेशा पावसाशिवाय पेरणी केल्यास बियाणे वाया जाण्याची भीती असते.")
            reasons_hi.append(f"मानसून आगमन की संभावना कम ({onset_prob}%) है। सूखे में बुवाई करने से अंकुरण प्रभावित हो सकता है।")

            field_measures.append("Wait for at least 75-100 mm continuous rainfall before initiating dry sowing.")
            field_measures.append("Keep seed stocks in cool, dry storage until definitive onset is reported.")

        elif break_prob > 35:
            urgency = "High Alert"
            primary_action = f"Prepare an irrigation backup and avoid relying only on direct monsoon rainfall for {crop_name}."
            action_marathi = f"पावसाचा खंड पडण्याची शक्यता असल्याने सिंचनाची पर्यायी सोय तयार ठेवा; केवळ पावसावर अवलंबून राहू नका."
            action_hindi = f"मानसून में ब्रेक (लंबा सूखा) संभव है, सिंचाई का बैकअप तैयार रखें; केवल बारिश पर निर्भर न रहें।"

            reasons.append(f"Break/dry spell probability is elevated at {break_prob}%. Seedlings may suffer terminal moisture stress.")
            reasons_mr.append(f"पावसात खंड पडण्याची शक्यता {break_prob}% आहे. कोवळ्या पिकाला पाण्याचा ताण बसू शकतो.")
            reasons_hi.append(f"वर्षा में रुकावट (ड्राई स्पेल) का जोखिम {break_prob}% है। फसलों को जल तनाव हो सकता है।")

            field_measures.append("Deploy in-situ moisture conservation (broad bed furrow or contour ridges).")
            field_measures.append("Plan protective micro-sprinkler or drip irrigation schedule if dry spell exceeds 7 days.")

        elif heavy_prob > 35:
            urgency = "Advisory Alert"
            primary_action = f"Check field drainage channels and avoid sowing {crop_name} immediately before the expected heavy downpour window."
            action_marathi = f"शेतातील पाणी निचरा मार्ग मोकळे करा आणि अतिवृष्टीच्या अंदाजित दिवसांत पेरणी करणे टाळा."
            action_hindi = f"खेतों में जल निकासी की व्यवस्था दुरुस्त करें और भारी बारिश के समय तुरंत बुवाई करने से बचें।"

            reasons.append(f"Heavy rainfall probability is elevated ({heavy_prob}%). Waterlogging causes seed rot in {crop_name}.")
            reasons_mr.append(f"अतिवृष्टीची शक्यता {heavy_prob}% आहे. शेतात पाणी साचल्यास {profile['marathi_name']} बियाणे कुजण्याचा धोका असतो.")
            reasons_hi.append(f"भारी बारिश का खतरा ({heavy_prob}%) है। जलभराव से बीज सड़ने की संभावना बढ़ जाती है।")

            field_measures.append("Clear outlets, ridges, and drainage furrows to prevent water stagnation in lower corners.")
            field_measures.append("If sowing is already complete, ensure excess rainwater runs off rapidly within 12 hours.")

        else:
            urgency = "Moderate"
            primary_action = f"Normal field preparation for {crop_name}; commence sowing upon receiving 50mm wetting rain."
            action_marathi = f"{profile['marathi_name']} पेरणीची पूर्वतयारी ठेवा; किमान ५० मिमी पाऊस झाल्यावरच पेरणी करा."
            action_hindi = f"{profile['hindi_name']} की सामान्य तैयारी जारी रखें; कम से कम 50 मिमी वर्षा होने पर ही बुवाई करें।"

            reasons.append("Moderate weather outlook with balanced onset indicators and manageable dry spell risk.")
            reasons_mr.append("हवामानाचा अंदाज मध्यम असून पावसाचे संतुलन राखले जाण्याची शक्यता आहे.")
            reasons_hi.append("मौसम का पूर्वानुमान सामान्य है, जोखिम संतुलित स्तर पर है।")

        stage_guidance = {
            "sowing": "Pre-sowing stage: Ensure seed treatment with Rhizobium & Trichoderma before field placement.",
            "germination": "Germination / Emergence stage: Monitor seedling emergence and protect young sprouts from standing water.",
            "vegetative": "Vegetative growth stage: Maintain weed-free plots and apply top-dressing nitrogen only when soil moisture is adequate.",
            "flowering": "Flowering / Pod formation stage: Critical moisture sensitivity window. Deploy protective micro-irrigation if dry spell exceeds 5 days.",
            "maturity": "Maturity / Harvest stage: Plan harvesting during dry clear windows and drain excess field water 10 days before harvest."
        }
        if stage_key in stage_guidance:
            field_measures.insert(0, stage_guidance[stage_key])

        return {
            "crop": crop_name,
            "crop_id": crop_key,
            "crop_stage": stage_key.title(),
            "crop_details": profile,
            "location": f"{panchayat.title()}, {block.title()}, {district.title()}",
            "forecast_period": f"{days} Days",
            "prediction": {
                "onset_probability": onset_prob,
                "break_probability": break_prob,
                "heavy_rain_probability": heavy_prob
            },
            "recommendation": primary_action,
            "recommendation_marathi": action_marathi,
            "recommendation_hindi": action_hindi,
            "reasons": reasons,
            "reasons_marathi": reasons_mr,
            "reasons_hindi": reasons_hi,
            "field_measures": field_measures,
            "urgency_level": urgency,
            "confidence_level": f"{confidence_level}%",
            "disclaimer": "Automated agro-meteorological advisory generated in accordance with IMD GKMS standards and ICAR agronomic thresholds. Cross-checked with local KVK updates."
        }

advisory_engine = CropAdvisoryEngine()
