"""
Direct Test Harness for Multilingual NLP Pipeline
Tests Language Detection, Intent Classification, Entity Extraction,
ML Inference Routing, and Multilingual Response Generation.
"""

import sys
import json
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from services.nlp_engine import nlp_engine

test_queries = [
    "Wagholi madhe soybean kadhi perava?",
    "वाघोलीत पुढील 14 दिवसात पाऊस पडेल का?",
    "क्या पुणे हवेली में अगले 14 दिनों में बारिश होगी?",
    "Should I sow cotton in Haveli next 14 days?",
    "Nashik Dindori wani panchayat me 21 days heavy rain alert hai kya?",
    "Sangamner ashwi me dry spell risk kitna hai?"
]

print("==================================================")
print("     HYPERLOCAL MONSOON NLP PIPELINE TEST BENCH   ")
print("==================================================\n")

for i, q in enumerate(test_queries, 1):
    print(f"--- [Query {i}] ---")
    print(f"Input Query : \"{q}\"")
    res = nlp_engine.process_query(q)
    
    analysis = res["nlp_analysis"]
    entities = analysis["extracted_entities"]
    
    print(f"Detected Lang: {analysis['language_label']} ({analysis['language']})")
    print(f"Intent       : {analysis['intent']}")
    print(f"Entities     : District={entities['district']}, Block={entities['block']}, Panchayat={entities['panchayat']}, Crop={entities['crop_display']}, Days={entities['days']}")
    print(f"ML Forecast  : Onset={res['ml_forecast']['probabilities']['monsoon_onset']}%, Break={res['ml_forecast']['probabilities']['break_dry_spell']}%, Heavy={res['ml_forecast']['probabilities']['heavy_rainfall']}%")
    print(f"Response Text:\n  => {res['response_text']}\n")

print("==================================================")
print("     ALL MULTILINGUAL NLP TESTS COMPLETED OK!     ")
print("==================================================")
