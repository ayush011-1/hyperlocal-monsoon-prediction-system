"""
Multilingual NLP Pipeline Service
Provides Language Detection, Intent Detection, Agricultural Entity Extraction,
Structured Inference Routing, and Multilingual Response Synthesis for Agromet Decision Support.

Supports: English (en), Marathi (mr), Hindi (hi), and Hinglish / Marathi-English transliterated queries.
"""

import re
import json
import os
from typing import Dict, Any, Tuple, Optional
from services.ml_predictor import ml_predictor
from services.advisory_engine import advisory_engine

class MultilingualNLPEngine:
    def __init__(self):
        # Load location database for entity extraction mapping
        base_dir = os.path.dirname(__file__)
        locations_file = os.path.join(base_dir, "../data/locations.json")
        
        self.location_index = []
        try:
            with open(locations_file, "r", encoding="utf-8") as f:
                loc_data = json.load(f)
            
            for district in loc_data.get("districts", []):
                d_id = district["id"]
                d_name = district["name"]
                
                # District entry
                self.location_index.append({
                    "type": "district",
                    "district": d_name,
                    "block": district.get("blocks", [{}])[0].get("name", "Haveli"),
                    "panchayat": district.get("blocks", [{}])[0].get("panchayats", [{}])[0].get("name", "Wagholi"),
                    "keywords": self._generate_location_keywords(d_name, d_id)
                })
                
                for block in district.get("blocks", []):
                    b_id = block["id"]
                    b_name = block["name"]
                    
                    # Block entry
                    self.location_index.append({
                        "type": "block",
                        "district": d_name,
                        "block": b_name,
                        "panchayat": block.get("panchayats", [{}])[0].get("name", "Wagholi"),
                        "keywords": self._generate_location_keywords(b_name, b_id)
                    })
                    
                    for panchayat in block.get("panchayats", []):
                        p_id = panchayat["id"]
                        p_name = panchayat["name"]
                        
                        # Panchayat entry
                        self.location_index.append({
                            "type": "panchayat",
                            "district": d_name,
                            "block": b_name,
                            "panchayat": p_name,
                            "keywords": self._generate_location_keywords(p_name, p_id)
                        })
        except Exception as e:
            print(f"NLP Engine location index warning: {e}")

        # Crop entity mappings
        self.crop_keywords = {
            "soybean": ["soybean", "soyabean", "soya", "सोयाबीन", "सोया", "soya bean"],
            "rice": ["rice", "paddy", "भात", "तांदूळ", "धान", "चावल", "bhat", "dhan", "chawal", "tandul"],
            "maize": ["maize", "corn", "मका", "मक्का", "maka", "makka"],
            "cotton": ["cotton", "कापूस", "कपास", "kapus", "kapas"],
            "bajra": ["bajra", "millet", "pearl millet", "बाजरी", "बाजरा", "bajri"],
            "sugarcane": ["sugarcane", "cane", "ऊस", "गन्ना", "us", "ganna"],
            "groundnut": ["groundnut", "peanut", "भूईमूग", "मूंगफली", "bhuimug", "mungfali"]
        }

    def _generate_location_keywords(self, name: str, name_id: str) -> list:
        kw = [name.lower(), name_id.lower()]
        # Strip brackets if any (e.g. Ahilyanagar (Ahmednagar))
        clean_name = re.sub(r'\(.*?\)', '', name).strip().lower()
        kw.append(clean_name)
        
        # Split tokens
        for token in clean_name.split():
            if len(token) > 3:
                kw.append(token)
                
        # Common regional transliteration aliases
        aliases = {
            "pune": ["पुणे", "poona"],
            "haveli": ["हवेली", "haweli"],
            "wagholi": ["वाघोली", "wagoli", "vagholi"],
            "baramati": ["बारामती", "barmati"],
            "junnar": ["जुन्नर", "junnere"],
            "shirur": ["शिरूर", "shirur"],
            "nashik": ["नाशिक", "nasik"],
            "dindori": ["दिंडोरी", "dindore"],
            "niphad": ["निफाड", "nifad"],
            "sinnar": ["सिन्नर", "sinar"],
            "ahilyanagar": ["अहिल्यानगर", "ahmednagar", "nagar", "नगर"],
            "sangamner": ["संगमनेर", "sangamner"],
            "rahata": ["राहाता", "rahata"],
            "shrirampur": ["श्रीरामपूर", "srirampur"],
            "satara": ["सातारा", "satara"],
            "karad": ["कराड", "karrad"],
            "wai": ["वाई", "wai"],
            "phaltan": ["फलटण", "phaltan"],
            "kolhapur": ["कोल्हापूर", "kolhapur"],
            "karveer": ["करवीर", "karvir"],
            "hatkanangle": ["हातकणंगले", "hatkanangale"],
            "shirol": ["शिरोळ", "shirol"],
            "solapur": ["सोलापूर", "sholapur"],
            "pandharpur": ["पंढरपूर", "pandharpur"],
            "barshi": ["बार्शी", "barsi"],
            "mohol": ["मोहोळ", "mohol"],
            "loni_kalbhor": ["लोणी काळभोर", "loni"],
            "uruli_kanchan": ["उरुळी कांचन", "uruli"],
            "narayangaon": ["नारायणगाव", "narayangaon"],
            "lasalgaon": ["लासलगाव", "lasalgaon"],
            "shirdi_rural": ["शिर्डी", "shirdi"],
            "belapur": ["बेलापूर", "belapur"],
            "vairag": ["वैराग", "vairag"],
            "wani": ["वणी", "vani"]
        }
        if name_id.lower() in aliases:
            kw.extend(aliases[name_id.lower()])
        return list(set(kw))

    def detect_language(self, text: str) -> Tuple[str, str]:
        """
        Detects if query is Marathi (mr), Hindi (hi), English (en), or Hinglish / Marathi-English transliterated (hinglish).
        """
        # Check for Devanagari script range
        devanagari_chars = re.findall(r'[\u0900-\u097F]', text)
        total_chars = len(re.findall(r'\w', text)) or 1
        
        if len(devanagari_chars) / max(1, len(text)) > 0.15:
            # Script is Devanagari. Distinguish Marathi vs Hindi.
            marathi_indicators = ["पेरणी", "पाऊस", "आगमन", "कधी", "गावात", "खंड", "माहिती", "सोयाबीन", "कापूस", "बाजरी", "अंदाज", "दिवसात", "करू", "काय", "धोका", "हवामान", "शेतात", "पिकासाठी", "करावी"]
            hindi_indicators = ["बुवाई", "बारिश", "मानसून", "कब", "मौसम", "सिंचाई", "सूखा", "खतरा", "जानकारी", "क्या", "दिनों", "करें", "होगा", "फसल", "के लिए", "होगी"]
            
            mr_score = sum(1 for w in marathi_indicators if w in text)
            hi_score = sum(1 for w in hindi_indicators if w in text)
            
            if mr_score >= hi_score:
                return "mr", "Marathi (मराठी)"
            else:
                return "hi", "Hindi (हिंदी)"

        # Text is in Latin script. Distinguish English vs Hinglish / Marathi-English.
        text_lower = text.lower()
        transliterated_indicators = [
            "perava", "perani", "paus", "padel", "kadhi", "madhe", "gaavat", "kiti", "hoil", "kara",
            "karaychi", "dhoka", "kasa", "kay", "aagman", "kya", "kab", "ho", "sow kar", "karo",
            "karna", "bataye", "barish", "aayega", "kitna", "dino", "din", "hoga", "me", "se",
            "karela", "rain kitna", "onset kab", "perni", "panchayat me", "block me", "gaon me"
        ]
        
        trans_count = sum(1 for word in transliterated_indicators if word in text_lower)
        if trans_count > 0:
            return "hinglish", "Hinglish / Marathi-English"
        
        # Check if words are predominantly English
        english_words = ["should", "will", "forecast", "monsoon", "onset", "when", "sow", "rain", "heavy", "dry", "spell", "days", "risk", "chance", "predict", "for", "in", "the", "what", "is"]
        en_count = sum(1 for w in english_words if w in text_lower)
        
        if en_count >= 1 or len(devanagari_chars) == 0:
            return "en", "English"
        
        return "hinglish", "Hinglish / Marathi-English"

    def detect_intent(self, text: str) -> str:
        """
        Classifies user query intent: sowing_advisory, monsoon_onset, dry_spell_risk, heavy_rainfall_risk, weather_forecast, irrigation_advisory
        """
        text_lower = text.lower()
        
        # Heavy rain / flood keywords
        if any(k in text_lower or k in text for k in ["heavy rain", "flood", "waterlogging", "downpour", "अतिवृष्टी", "भारी बारिश", "पाणी साचणे", "अतिवृष्टीची", "मुसळधार", "धोका"]):
            return "heavy_rainfall_risk"
            
        # Irrigation / Water management keywords
        if any(k in text_lower or k in text for k in ["irrigation", "water", "paani", "पानी", "पाणी", "सिंचाई", "निचरा", "जल", "पानी देना", "पाणी द्यायचे", "पाणी कधी"]):
            return "irrigation_advisory"

        # Dry spell keywords
        if any(k in text_lower or k in text for k in ["dry spell", "break", "drought", "moisture stress", "खंड", "सूखा", "ताण", "पावसात खंड"]):
            return "dry_spell_risk"
            
        # Monsoon onset keywords
        if any(k in text_lower or k in text for k in ["onset", "arrival", "aagman", "aayega", "monsoon arrival", "आगमन", "मानसून", "पाऊस कधी"]):
            return "monsoon_onset"
            
        # Sowing advisory keywords
        if any(k in text_lower or k in text for k in ["sow", "sowing", "perava", "perani", "buwai", "plant", "crop", "पेरणी", "बुवाई", "पिक", "फसल", "perni", "कधी करावी"]):
            return "sowing_advisory"
            
        # General rain / forecast keywords
        if any(k in text_lower or k in text for k in ["forecast", "rain", "rainfall", "weather", "अंदाज", "हवामान", "बारिश", "पाऊस", "कसा आहे"]):
            return "weather_forecast"
            
        return "sowing_advisory"

    def extract_entities(
        self,
        text: str,
        default_district: str = "Pune",
        default_block: str = "Haveli",
        default_panchayat: str = "Wagholi",
        default_crop: str = "soybean",
        default_days: int = 14
    ) -> Dict[str, Any]:
        """
        Extracts location (District, Block, Panchayat), crop, and forecast period (days) from natural language text.
        """
        text_lower = text.lower()
        
        # 1. Location Extraction
        extracted_district = None
        extracted_block = None
        extracted_panchayat = None
        
        # Search location index for match (prioritize specific panchayat/block over broad district)
        best_match = None
        best_match_len = 0
        
        for loc in self.location_index:
            for kw in loc["keywords"]:
                if kw in text_lower and len(kw) > best_match_len:
                    best_match = loc
                    best_match_len = len(kw)
                    
        if best_match:
            extracted_district = best_match["district"]
            extracted_block = best_match["block"]
            extracted_panchayat = best_match["panchayat"]
        else:
            extracted_district = default_district
            extracted_block = default_block
            extracted_panchayat = default_panchayat
            
        # 2. Crop Extraction
        extracted_crop = None
        for crop_id, kw_list in self.crop_keywords.items():
            if any(kw in text_lower or kw in text for kw in kw_list):
                extracted_crop = crop_id
                break
                
        if not extracted_crop:
            extracted_crop = default_crop or "soybean"
            
        # 3. Forecast Days Horizon Extraction
        extracted_days = default_days
        # Regex for numbers 7, 14, 21, 30
        num_match = re.search(r'\b(7|14|21|30)\b', text)
        if num_match:
            extracted_days = int(num_match.group(1))
        else:
            # Devanagari numerals
            if "७" in text: extracted_days = 7
            elif "१४" in text: extracted_days = 14
            elif "२१" in text: extracted_days = 21
            elif "३०" in text: extracted_days = 30
            
        return {
            "district": extracted_district,
            "block": extracted_block,
            "panchayat": extracted_panchayat,
            "crop": extracted_crop,
            "days": extracted_days
        }

    def process_query(
        self,
        query: str,
        current_district: str = "Pune",
        current_block: str = "Haveli",
        current_panchayat: str = "Wagholi",
        current_crop: str = "soybean",
        current_days: int = 14
    ) -> Dict[str, Any]:
        """
        Executes end-to-end NLP Pipeline:
        Language Detection -> Intent Detection -> Entity Extraction -> Structured Request -> ML + Advisory Inference -> Multilingual Response Synthesis.
        """
        if not query or not query.strip():
            query = "What is the 14-day monsoon forecast and sowing advisory?"
            
        lang_code, lang_label = self.detect_language(query)
        intent = self.detect_intent(query)
        entities = self.extract_entities(
            query,
            default_district=current_district,
            default_block=current_block,
            default_panchayat=current_panchayat,
            default_crop=current_crop,
            default_days=current_days
        )
        
        district = entities["district"]
        block = entities["block"]
        panchayat = entities["panchayat"]
        crop_id = entities["crop"]
        days = entities["days"]

        # Call existing ML Predictor (STRICT UNTOUCHED SOURCE OF PREDICTIONS)
        ml_res = ml_predictor.predict_probabilities(
            district=district,
            block=block,
            panchayat=panchayat,
            days=days
        )
        
        onset_prob = ml_res["probabilities"]["monsoon_onset"]
        break_prob = ml_res["probabilities"]["break_dry_spell"]
        heavy_prob = ml_res["probabilities"]["heavy_rainfall"]

        # Call existing Advisory Engine (STRICT UNTOUCHED SOURCE OF ADVISORIES)
        advisory_res = advisory_engine.generate_advisory(
            crop_id=crop_id,
            district=district,
            block=block,
            panchayat=panchayat,
            days=days,
            onset_prob=onset_prob,
            break_prob=break_prob,
            heavy_prob=heavy_prob,
            confidence_level=ml_res.get("confidence_level", 85)
        )

        crop_display = advisory_res.get("crop", crop_id.title())
        crop_details = advisory_res.get("crop_details", {})

        # Synthesize multilingual response based on exact ML and Advisory results
        response_text = self._synthesize_response(
            lang_code=lang_code,
            intent=intent,
            district=district,
            block=block,
            panchayat=panchayat,
            crop_display=crop_display,
            crop_details=crop_details,
            days=days,
            onset_prob=onset_prob,
            break_prob=break_prob,
            heavy_prob=heavy_prob,
            advisory_res=advisory_res
        )

        return {
            "query": query,
            "nlp_analysis": {
                "language": lang_code,
                "language_label": lang_label,
                "intent": intent,
                "extracted_entities": {
                    "district": district,
                    "block": block,
                    "panchayat": panchayat,
                    "crop": crop_id,
                    "crop_display": f"{crop_display} ({crop_details.get('marathi_name', '')})",
                    "days": days
                }
            },
            "response_text": response_text,
            "ml_forecast": ml_res,
            "crop_advisory": advisory_res
        }

    def _synthesize_response(
        self,
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
        advisory_res: dict
    ) -> str:
        mr_crop = crop_details.get("marathi_name", crop_display)
        hi_crop = crop_details.get("hindi_name", crop_display)

        if lang_code == "mr":
            rec = advisory_res.get("recommendation_marathi") or advisory_res.get("recommendation")
            if intent == "monsoon_onset":
                return f"📍 {district} जिल्ह्यातील {block} तालुक्यातील {panchayat} गावासाठी पुढील {days} दिवसांत मान्सून आगमनाची शक्यता {onset_prob}% आहे (विश्वासार्हता: {advisory_res.get('confidence_level')}). {rec}"
            elif intent == "dry_spell_risk":
                return f"📍 {panchayat} परिसरात पुढील {days} दिवसांत पावसात खंड पडण्याचा धोका {break_prob}% आहे. {rec}"
            elif intent == "heavy_rainfall_risk":
                return f"📍 {panchayat} क्षेत्रात अतिवृष्टीची शक्यता {heavy_prob}% आहे. {rec}"
            else:
                return f"🌾 {panchayat} ({block}, {district}) करिता पुढील {days} दिवसांचा अंदाज: आगमनाची शक्यता {onset_prob}%, पावसातील खंडाचा धोका {break_prob}%, आणि अतिवृष्टी {heavy_prob}%. {mr_crop} पिकासाठी सल्ला: {rec}"

        elif lang_code == "hi":
            rec = advisory_res.get("recommendation_hindi") or advisory_res.get("recommendation")
            if intent == "monsoon_onset":
                return f"📍 {district} जिले के {block} ब्लॉक में {panchayat} के लिए अगले {days} दिनों में मानसून आगमन की संभावना {onset_prob}% है। {rec}"
            elif intent == "dry_spell_risk":
                return f"📍 {panchayat} में अगले {days} दिनों में सूखा/ब्रेक का जोखिम {break_prob}% है। {rec}"
            elif intent == "heavy_rainfall_risk":
                return f"📍 {panchayat} क्षेत्र में भारी बारिश का खतरा {heavy_prob}% है। {rec}"
            else:
                return f"🌾 {panchayat} ({block}, {district}) के लिए अगले {days} दिनों का पूर्वानुमान: आगमन की संभावना {onset_prob}%, सूखा जोखिम {break_prob}%, और भारी बारिश {heavy_prob}%। {hi_crop} फसल के लिए परामर्श: {rec}"

        elif lang_code == "hinglish":
            rec = advisory_res.get("recommendation")
            return f"🌾 {panchayat} ({block}, {district}) ke liye next {days} days ka prediction: Monsoon Onset Chance {onset_prob}%, Dry Spell Risk {break_prob}%, & Heavy Rain Risk {heavy_prob}%. {crop_display} ke liye Agromet Advisory: {rec}"

        else: # English
            rec = advisory_res.get("recommendation")
            return f"🌾 For {panchayat} ({block}, {district}) over the next {days} days: Monsoon Onset Probability is {onset_prob}%, Dry Spell Risk is {break_prob}%, and Heavy Rain Risk is {heavy_prob}%. Agromet Advisory for {crop_display}: {rec}"

nlp_engine = MultilingualNLPEngine()
