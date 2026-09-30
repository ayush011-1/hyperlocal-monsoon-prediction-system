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

LOCATION_MARATHI_MAP = {
    # Districts
    "pune": "पुणे",
    "nashik": "नाशिक",
    "ahilyanagar": "अहिल्यानगर",
    "ahilyanagar (ahmednagar)": "अहिल्यानगर",
    "ahmednagar": "अहिल्यानगर",
    "satara": "सातारा",
    "kolhapur": "कोल्हापूर",
    "solapur": "सोलापूर",
    # Blocks
    "haveli": "हवेली",
    "baramati": "बारामती",
    "junnar": "जुन्नर",
    "shirur": "शिरूर",
    "indapur": "इंदापूर",
    "dindori": "दिंडोरी",
    "niphad": "निफाड",
    "malegaon": "मालेगाव",
    "chandwad": "चांदवड",
    "sinnar": "सिन्नर",
    "sangamner": "संगमनेर",
    "rahata": "राहाता",
    "kopergaon": "कोपरगाव",
    "parner": "पारनेर",
    "shrirampur": "श्रीरामपूर",
    "karad": "कराड",
    "wai": "वाई",
    "phaltan": "फलटण",
    "koregaon": "कोरेगाव",
    "patan": "पाटण",
    "karveer": "करवीर",
    "shirol": "शिरोळ",
    "hatkanangale": "हातकणंगले",
    "kagal": "कागल",
    "radhanagari": "राधानगरी",
    "pandharpur": "पंढरपूर",
    "barshi": "बार्शी",
    "mohol": "मोहोळ",
    "karmala": "करमाळा",
    "madha": "माढा",
    # Panchayats / Villages
    "wagholi": "वाघोली",
    "loni_kalbhor": "लोणी काळभोर",
    "loni kalbhor": "लोणी काळभोर",
    "uruli_kanchan": "उरुळी कांचन",
    "uruli kanchan": "उरुळी कांचन",
    "malegaon_bk": "माळेगाव बुद्रुक",
    "malegaon budruk": "माळेगाव बुद्रुक",
    "katphal": "कटफळ",
    "supe": "सुपे",
    "narayangaon": "नारायणगाव",
    "otur": "ओतूर",
    "alephata": "आळेफाटा",
    "alen": "आळेफाटा",
    "shikrapur": "शिक्रापूर",
    "sanaswadi": "सणसवाडी",
    "sanvi": "सणसवाडी",
    "wani": "वणी",
    "dindori_rural": "दिंडोरी ग्रामीण",
    "dindori rural": "दिंडोरी ग्रामीण",
    "pimpalgaon_baswant": "पिंपळगाव बसवंत",
    "pimpalgaon baswant": "पिंपळगाव बसवंत",
    "lasalgaon": "लासलगाव",
    "ashwi": "आश्वी",
    "shirdi_rural": "शिर्डी ग्रामीण",
    "shirdi rural": "शिर्डी ग्रामीण",
    "belapur": "बेलापूर",
    "vairag": "वैराग",
    "shegaon": "शेगाव"
}

def to_marathi_place(name: str) -> str:
    if not name:
        return ""
    clean = name.strip()
    return LOCATION_MARATHI_MAP.get(clean.lower(), clean)

class MultilingualNLPEngine:
    def __init__(self):
        # Load location database for entity extraction mapping
        base_dir = os.path.dirname(__file__)
        locations_file = os.path.join(base_dir, "../data/locations.json")
        
        self.location_index = []
        try:
            with open(locations_file, "r", encoding="utf-8") as f:
                loc_data = json.load(f)
            
            states = loc_data.get("states", [])
            districts_list = []
            if states:
                for s in states:
                    districts_list.extend(s.get("districts", []))
            else:
                districts_list = loc_data.get("districts", [])

            for district in districts_list:
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

        # Crop entity mappings with morphological inflections to prevent collision
        self.crop_keywords = {
            "soybean": [
                "soybean", "soyabean", "soya", "soya bean",
                "सोयाबीन", "सोयाबीनला", "सोयाबीनची", "सोयाबीनचे", "सोयाबीनात", "सोया"
            ],
            "rice": [
                "rice", "paddy", "bhat", "dhan", "chawal", "tandul",
                "भात", "भाताला", "भाताची", "भाताचे", "भातात", "तांदूळ", "चावल", "धान"
            ],
            "maize": [
                "maize", "corn", "maka", "makka",
                "मका", "मक्याला", "मक्याची", "मक्याचे", "मक्यात", "मक्का", "मक्के"
            ],
            "cotton": [
                "cotton", "kapus", "kapas",
                "कापूस", "कापसाला", "कापसाची", "कापसाचे", "कापसात", "कपास"
            ],
            "bajra": [
                "bajra", "millet", "pearl millet", "bajri",
                "बाजरी", "बाजरीला", "बाजरीची", "बाजरीचे", "बाजरीत", "बाजरा", "बाजरे"
            ],
            "sugarcane": [
                "sugarcane", "cane", "oos", "oosa", "usala", "ganna",
                "ऊस", "उसाला", "उसाची", "उसाचे", "उसात", "उसावर", "गन्ना", "गन्ने"
            ],
            "groundnut": [
                "groundnut", "peanut", "bhuimug", "mungfali",
                "भूईमूग", "भुईमूग", "भूईमुगाला", "भुईमुगाला", "भूईमुगाची", "भूईमुगात", "मूंगफली"
            ]
        }

    def _match_keyword(self, text: str, kw: str) -> bool:
        """
        Matches a keyword using script-aware word boundary detection.
        Prevents substring collisions like Marathi 'ऊस' (sugarcane) matching inside 'पाऊस' (rain).
        """
        if not text or not kw:
            return False
        
        is_dev = bool(re.search(r'[\u0900-\u097F]', kw))
        if is_dev:
            # For Devanagari, ensure boundary against other Devanagari characters
            pattern = r'(?<![\u0900-\u097F])' + re.escape(kw) + r'(?![\u0900-\u097F])'
            return bool(re.search(pattern, text))
        else:
            # For Latin, ensure standard word boundaries
            pattern = r'\b' + re.escape(kw.lower()) + r'\b'
            return bool(re.search(pattern, text.lower()))

    def _generate_location_keywords(self, name: str, name_id: str) -> list:
        kw = [name.lower(), name_id.lower()]
        # Strip brackets if any (e.g. Ahilyanagar (Ahmednagar))
        clean_name = re.sub(r'\(.*?\)', '', name).strip().lower()
        kw.append(clean_name)
        
        # Split tokens for multi-word locations
        for token in clean_name.split():
            if len(token) > 3:
                kw.append(token)
                
        # Common regional transliteration aliases and Marathi locatives
        aliases = {
            "pune": ["पुणे", "पुण्यात", "पुण्यामध्ये", "poona"],
            "haveli": ["हवेली", "हवेलीत", "हवेलीमध्ये", "haweli"],
            "wagholi": ["वाघोली", "वाघोलीत", "वाघोलीमध्ये", "wagoli", "vagholi"],
            "baramati": ["बारामती", "बारामतीत", "बारामतीमध्ये", "barmati"],
            "junnar": ["जुन्नर", "जुन्नरमध्ये", "जुन्नरात", "junnere"],
            "shirur": ["शिरूर", "शिरूरमध्ये", "shirur"],
            "nashik": ["नाशिक", "नाशिकमध्ये", "नाशिकात", "nasik"],
            "dindori": ["दिंडोरी", "दिंडोरीत", "दिंडोरीमध्ये", "dindore"],
            "niphad": ["निफाड", "निफाडमध्ये", "निफाडात", "nifad"],
            "sinnar": ["सिन्नर", "सिन्नरमध्ये", "sinar"],
            "ahilyanagar": ["अहिल्यानगर", "अहिल्यानगरात", "अहिल्यानगरमध्ये", "नगर", "नगरात", "ahmednagar", "nagar"],
            "sangamner": ["संगमनेर", "संगमनेरात", "संगमनेरमध्ये", "sangamner"],
            "rahata": ["राहाता", "राहातात", "राहातामध्ये", "rahata"],
            "shrirampur": ["श्रीरामपूर", "श्रीरामपुरात", "श्रीरामपूरमध्ये", "srirampur"],
            "satara": ["सातारा", "साताऱ्यात", "सातारामध्ये", "साताऱ्यामध्ये", "satara"],
            "karad": ["कराड", "कराडात", "कराडमध्ये", "karrad"],
            "wai": ["वाई", "वाईत", "वाईमध्ये", "wai"],
            "phaltan": ["फलटण", "फलटणमध्ये", "phaltan"],
            "kolhapur": ["कोल्हापूर", "कोल्हापुरात", "कोल्हापूरमध्ये", "kolhapur"],
            "karveer": ["करवीर", "करवीरमध्ये", "karvir"],
            "hatkanangle": ["हातकणंगले", "हातकणंगल्यात", "hatkanangale"],
            "shirol": ["शिरोळ", "शिरोळात", "shirol"],
            "solapur": ["सोलापूर", "सोलापुरात", "सोलापूरमध्ये", "sholapur"],
            "pandharpur": ["पंढरपूर", "पंढरपुरात", "पंढरपूरमध्ये", "pandharpur"],
            "barshi": ["बार्शी", "बार्शीत", "barsi"],
            "mohol": ["मोहोळ", "मोहोळात", "mohol"],
            "loni_kalbhor": ["लोणी काळभोर", "लोणीत", "loni"],
            "uruli_kanchan": ["उरुळी कांचन", "उरुळीत", "uruli"],
            "narayangaon": ["नारायणगाव", "नारायणगावात", "narayangaon"],
            "lasalgaon": ["लासलगाव", "लासलगावात", "lasalgaon"],
            "shirdi_rural": ["शिर्डी", "शिर्डीत", "shirdi"],
            "belapur": ["बेलापूर", "बेलापुरात", "belapur"],
            "vairag": ["वैराग", "वैरागात", "vairag"],
            "wani": ["वणी", "वणीत", "वणीमध्ये", "vani"]
        }
        if name_id.lower() in aliases:
            kw.extend(aliases[name_id.lower()])
        return list(set(kw))

    def detect_language(self, text: str, preferred_lang: Optional[str] = None) -> Tuple[str, str]:
        """
        Detects if query is Marathi (mr), Hindi (hi), English (en), or Hinglish (hinglish).
        Uses script analysis, boundary-isolated lexical indicators, and preferred language hints.
        """
        if not text or not text.strip():
            if preferred_lang == "mr":
                return "mr", "Marathi (मराठी)"
            elif preferred_lang == "hi":
                return "hi", "Hindi (हिंदी)"
            return "en", "English"

        # Check for Devanagari script range
        devanagari_chars = re.findall(r'[\u0900-\u097F]', text)
        
        if len(devanagari_chars) / max(1, len(text)) > 0.15:
            # Script is Devanagari. Distinguish Marathi vs Hindi.
            marathi_indicators = [
                "पेरणी", "पाऊस", "आगमन", "कधी", "गावात", "खंड", "माहिती", "सोयाबीन", "कापूस", "बाजरी",
                "अंदाज", "दिवसात", "करू", "काय", "धोका", "हवामान", "शेतात", "पिकासाठी", "करावी", "पडेल",
                "पडणार", "द्यावे", "कसा", "कशी", "कसे", "आहे", "आहेत", "होईल", "किती", "सल्ला", "करावे",
                "करावा", "शेतकरी", "मध्ये", "लागवड", "ताण", "मुसळधार", "अतिवृष्टी", "सिंचन", "पाणी",
                "सांगा", "द्या", "मिळेल", "दिवस", "वणी", "दिंडोरी", "हवेली", "पुणे", "नाशिक", "सातारा",
                "कोल्हापूर", "सोलापूर", "पावसाचा", "पावसाची", "पावसाचे", "पिक", "पिकाला", "बियाणे", "खत", "खते"
            ]
            hindi_indicators = [
                "बुवाई", "बारिश", "मानसून", "कब", "मौसम", "सिंचाई", "सूखा", "खतरा", "जानकारी", "क्या",
                "दिनों", "करें", "होगा", "फसल", "के लिए", "होगी", "बताएं", "दीजिए", "किसान"
            ]
            
            mr_score = sum(1 for w in marathi_indicators if self._match_keyword(text, w))
            hi_score = sum(1 for w in hindi_indicators if self._match_keyword(text, w))
            
            if hi_score > mr_score and preferred_lang != "mr":
                return "hi", "Hindi (हिंदी)"
            # Default Devanagari to Marathi for Maharashtra Agromet context
            return "mr", "Marathi (मराठी)"

        # Text is in Latin script. Distinguish Marathi transliterated vs Hindi transliterated vs English.
        text_lower = text.lower()
        marathi_transliterated = [
            "paus", "kadhi", "padel", "padnar", "madhe", "gaavat", "perani", "perava", "perni",
            "karaychi", "karaycha", "karava", "karavi", "kasa", "kashi", "kase", "kay", "kaay",
            "aahe", "aahet", "hoil", "kiti", "aagman", "yenar", "yeil", "dhoka", "khand", "salla",
            "shetaat", "sheti", "havaman", "andaj", "dyaycha", "dyayche", "dyave", "lagvad",
            "bhuimug", "tandul", "oos", "kapus", "bajari", "maka", "sanga", "dya", "shetkari",
            "divas", "divsaat", "shakyata", "kasla"
        ]

        hindi_transliterated = [
            "kab", "kya", "bataye", "barish", "aayega", "kitna", "dino", "hoga", "karela",
            "buwai", "fasal", "chahiye", "batao", "baad", "rahega", "kisan", "ke liye"
        ]

        is_marathi_trans = any(self._match_keyword(text_lower, w) for w in marathi_transliterated)
        is_hindi_trans = any(self._match_keyword(text_lower, w) for w in hindi_transliterated)

        if is_marathi_trans:
            return "mr", "Marathi (मराठी)"

        if is_hindi_trans:
            return "hinglish", "Hinglish (हिंदी-English)"

        if preferred_lang == "mr":
            return "mr", "Marathi (मराठी)"
        elif preferred_lang == "hi":
            return "hi", "Hindi (हिंदी)"

        return "en", "English"

    def detect_intent(self, text: str) -> str:
        """
        Classifies user query intent:
        sowing_advisory, monsoon_onset, dry_spell_risk, heavy_rainfall_risk, weather_forecast, irrigation_advisory
        """
        text_lower = text.lower()
        
        # 1. Heavy rain / Flood / Waterlogging risk
        if any(self._match_keyword(text, k) for k in [
            "heavy rain", "flood", "waterlogging", "downpour", "extreme rain", "cloudburst",
            "अतिवृष्टी", "अतिवृष्टीची", "भारी बारिश", "पाणी साचणे", "मुसळधार", "महापूर", "dhoka", "heavy", "musaldhar"
        ]):
            return "heavy_rainfall_risk"

        # 2. Irrigation / Water management
        if any(self._match_keyword(text, k) for k in [
            "irrigation", "water", "drainage", "watering", "सिंचाई", "पाणी व्यवस्थापन", "पाणी देणे",
            "पाणी कधी", "पाणी कधी द्यावे", "जल निकासी", "निचरा", "सिंचन", "paani", "pani", "dyaycha",
            "paani kadhi", "pani kadhi"
        ]):
            return "irrigation_advisory"

        # 3. Dry spell / Break in monsoon
        if any(self._match_keyword(text, k) for k in [
            "dry spell", "break", "drought", "dry period", "rain break", "moisture stress",
            "खंड", "पावसात खंड", "खंड पडेल का", "सूखा", "ताण", "पावसाचा ताण", "khand", "paus break"
        ]):
            return "dry_spell_risk"

        # 4. Sowing advisory (sowing/crop preparation)
        if any(self._match_keyword(text, k) for k in [
            "sow", "sowing", "seed", "plant", "variety", "crop", "fertilizer",
            "पेरणी", "बुवाई", "पिक", "फसल", "बियाणे", "खते", "लागवड", "पेरणी कधी", "पेरणी कधी करावी",
            "perava", "perani", "perni", "buwai", "lagvad"
        ]):
            return "sowing_advisory"

        # 5. Monsoon onset / Arrival
        if any(self._match_keyword(text, k) for k in [
            "onset", "arrival", "monsoon arrival", "monsoon onset", "start of monsoon",
            "आगमन", "मान्सून आगमन", "मानसून आगमन", "aagman", "onset kab", "पाऊस कधी",
            "पाऊस कधी पडेल", "पाऊस कधी येईल", "कधी येईल", "कधी पडेल", "कधी पडणार", "कधी सुरू",
            "paus kadhi", "kadhi padel", "kadhi yenar", "kadhi yeil"
        ]):
            return "monsoon_onset"

        # 6. General rain / Weather forecast
        if any(self._match_keyword(text, k) for k in [
            "forecast", "rain", "rainfall", "weather", "monsoon", "climate", "temperature", "chance",
            "पाऊस", "हवामान", "अंदाज", "बारिश", "मौसम", "paus", "padel", "havaman", "andaj",
            "पाऊस पडेल", "पाऊस कसा", "पाऊस पडेल का"
        ]):
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
        
        # 1. Location Extraction using boundary-isolated keyword matching
        extracted_district = None
        extracted_block = None
        extracted_panchayat = None
        
        best_match = None
        best_match_len = 0
        
        for loc in self.location_index:
            for kw in loc["keywords"]:
                if self._match_keyword(text, kw) and len(kw) > best_match_len:
                    best_match = loc
                    best_match_len = len(kw)
                    
        if best_match:
            extracted_district = best_match["district"]
            extracted_block = best_match["block"]
            extracted_panchayat = best_match["panchayat"]
        else:
            # Clean up default district string if parenthesized
            extracted_district = default_district
            extracted_block = default_block
            extracted_panchayat = default_panchayat

        # Normalize district name if passed as ID (e.g. pune -> Pune, ahilyanagar -> Ahilyanagar)
        if extracted_district and extracted_district.lower() == "pune": extracted_district = "Pune"
        elif extracted_district and extracted_district.lower() == "nashik": extracted_district = "Nashik"
        elif extracted_district and "ahilya" in extracted_district.lower(): extracted_district = "Ahilyanagar (Ahmednagar)"
        elif extracted_district and extracted_district.lower() == "satara": extracted_district = "Satara"
        elif extracted_district and extracted_district.lower() == "kolhapur": extracted_district = "Kolhapur"
        elif extracted_district and extracted_district.lower() == "solapur": extracted_district = "Solapur"
            
        # 2. Crop Extraction using precise boundary matching
        extracted_crop = None
        for crop_id, kw_list in self.crop_keywords.items():
            if any(self._match_keyword(text, kw) for kw in kw_list):
                extracted_crop = crop_id
                break
                
        if not extracted_crop:
            extracted_crop = (default_crop or "soybean").lower()
            
        # 3. Forecast Days Horizon Extraction
        extracted_days = default_days or 14
        num_match = re.search(r'\b(7|14|21|30)\b', text)
        if num_match:
            extracted_days = int(num_match.group(1))
        elif re.search(r'\b(next week|1 week|one week|7 days)\b', text_lower):
            extracted_days = 7
        elif re.search(r'\b(2 weeks|two weeks|fortnight|14 days)\b', text_lower):
            extracted_days = 14
        elif re.search(r'\b(3 weeks|three weeks|21 days)\b', text_lower):
            extracted_days = 21
        elif re.search(r'\b(month|1 month|30 days)\b', text_lower):
            extracted_days = 30
        elif "७" in text: extracted_days = 7
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
        current_days: int = 14,
        preferred_language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end Multilingual Agromet NLP Pipeline:
        Language Detection -> Intent Detection -> Entity Extraction -> Structured Request -> ML + Advisory Inference -> Multilingual Response Synthesis.
        """
        if not query or not query.strip():
            query = "What is the 14-day monsoon forecast and sowing advisory?"
            
        lang_code, lang_label = self.detect_language(query, preferred_lang=preferred_language)
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
                },
                "pipeline_stages": [
                    {"stage": 1, "name": "Script Analysis & Language Detection", "result": f"{lang_label} ({lang_code})"},
                    {"stage": 2, "name": "Agromet Intent Recognition", "result": intent},
                    {"stage": 3, "name": "Agricultural Entity Extraction", "result": f"District={district}, Taluka={block}, Village={panchayat}, Crop={crop_display}, Horizon={days}d"},
                    {"stage": 4, "name": "Model Probability Grounding", "result": f"Onset={onset_prob}%, Break={break_prob}%, Heavy={heavy_prob}%"},
                    {"stage": 5, "name": "Dialect-Specific Advisory Synthesis", "result": "Synthesized with ICAR thresholds"}
                ]
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
            mr_d = to_marathi_place(district)
            mr_b = to_marathi_place(block)
            mr_p = to_marathi_place(panchayat)
            rec = advisory_res.get("recommendation_marathi") or advisory_res.get("recommendation")
            conf = advisory_res.get("confidence_level", "85%")
            if intent == "monsoon_onset":
                return f"📍 {mr_d} जिल्ह्यातील {mr_b} तालुक्यातील {mr_p} गावासाठी पुढील {days} दिवसांत मान्सून आगमनाची शक्यता {onset_prob}% आहे (मॉडेल विश्वासार्हता: {conf}). {rec}"
            elif intent == "sowing_advisory":
                return f"🌾 {mr_p} ({mr_b}, {mr_d}) परिसरासाठी {mr_crop} पेरणी सल्ला: आगमनाची शक्यता {onset_prob}%, पावसातील खंडाचा धोका {break_prob}%. {rec}"
            elif intent == "dry_spell_risk":
                return f"⚠️ {mr_p} परिसरात पुढील {days} दिवसांत पावसात खंड पडण्याचा (Dry Spell) धोका {break_prob}% आहे. {rec}"
            elif intent == "heavy_rainfall_risk":
                return f"🚨 {mr_p} क्षेत्रात अतिवृष्टीची शक्यता {heavy_prob}% आहे. शेतातील पाण्याचा निचरा व्यवस्थित ठेवा. {rec}"
            elif intent == "irrigation_advisory":
                return f"💧 {mr_p} येथे {mr_crop} पिकासाठी पाणी व्यवस्थापन सल्ला: खंडाचा धोका {break_prob}% आहे. जमिनीत पुरेसा ओलावा टिकून राहण्यासाठी सूक्ष्म सिंचनाचा वापर करा. {rec}"
            else:
                return f"🌦️ {mr_p} ({mr_b}, {mr_d}) करिता पुढील {days} दिवसांचा हवामान अंदाज: आगमनाची शक्यता {onset_prob}%, पावसातील खंड {break_prob}%, आणि अतिवृष्टी {heavy_prob}%. {mr_crop} पिकासाठी सल्ला: {rec}"

        elif lang_code == "hi":
            rec = advisory_res.get("recommendation_hindi") or advisory_res.get("recommendation")
            if intent == "monsoon_onset":
                return f"📍 {district} जिले के {block} ब्लॉक में {panchayat} के लिए अगले {days} दिनों में मानसून आगमन की संभावना {onset_prob}% है। {rec}"
            elif intent == "dry_spell_risk":
                return f"📍 {panchayat} में अगले {days} दिनों में सूखा/ब्रेक का जोखिम {break_prob}% है। {rec}"
            elif intent == "heavy_rainfall_risk":
                return f"📍 {panchayat} क्षेत्र में भारी बारिश का खतरा {heavy_prob}% है। जल निकासी की समुचित व्यवस्था रखें। {rec}"
            elif intent == "irrigation_advisory":
                return f"💧 {panchayat} में {hi_crop} फसल के लिए सिंचाई परामर्श: सूखा जोखिम {break_prob}% है। आवश्यकतानुसार हल्की सिंचाई दें।"
            else:
                return f"🌾 {panchayat} ({block}, {district}) के लिए अगले {days} दिनों का पूर्वानुमान: आगमन की संभावना {onset_prob}%, सूखा जोखिम {break_prob}%, और भारी बारिश {heavy_prob}%। {hi_crop} फसल के लिए परामर्श: {rec}"

        elif lang_code == "hinglish":
            rec = advisory_res.get("recommendation")
            if intent == "monsoon_onset":
                return f"📍 {panchayat} ({block}, {district}) ke liye next {days} days me Monsoon Onset Chance {onset_prob}% hai. {rec}"
            elif intent == "dry_spell_risk":
                return f"⚠️ {panchayat} me next {days} days me Dry Spell / Rain Break Risk {break_prob}% hai. {rec}"
            elif intent == "heavy_rainfall_risk":
                return f"🚨 {panchayat} area me Heavy Rain Risk {heavy_prob}% hai. Proper field drainage maintain kare. {rec}"
            elif intent == "irrigation_advisory":
                return f"💧 {panchayat} me {crop_display} ke liye Water Management Advisory: Dry spell break risk is {break_prob}%. {rec}"
            else:
                return f"🌾 {panchayat} ({block}, {district}) ke liye next {days} days ka prediction: Monsoon Onset Chance {onset_prob}%, Dry Spell Risk {break_prob}%, & Heavy Rain Risk {heavy_prob}%. {crop_display} ke liye Agromet Advisory: {rec}"

        else: # English
            rec = advisory_res.get("recommendation")
            if intent == "monsoon_onset":
                return f"📍 For {panchayat} ({block}, {district}), the ML model estimates a {onset_prob}% Monsoon Onset Probability over the next {days} days. {rec}"
            elif intent == "dry_spell_risk":
                return f"⚠️ Intraseasonal Dry Spell Hazard for {panchayat} is at {break_prob}% over the next {days} days. {rec}"
            elif intent == "heavy_rainfall_risk":
                return f"🚨 Convective Heavy Rainfall Event Risk (≥64.5mm) for {panchayat} is {heavy_prob}%. Ensure field drainage channels are cleared. {rec}"
            elif intent == "irrigation_advisory":
                return f"💧 Irrigation Guidance for {crop_display} in {panchayat}: Dry spell hazard is {break_prob}%. {rec}"
            else:
                return f"🌾 For {panchayat} ({block}, {district}) over the next {days} days: Monsoon Onset Probability is {onset_prob}%, Dry Spell Risk is {break_prob}%, and Heavy Rain Risk is {heavy_prob}%. Agromet Advisory for {crop_display}: {rec}"

nlp_engine = MultilingualNLPEngine()
