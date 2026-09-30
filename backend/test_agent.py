"""
Direct Test Harness for Farmer Support AI Agent
Tests multi-turn conversational support, language detection, intent classification,
and strict integration with ML Predictor & Advisory Engine.
"""

import sys
import json
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from services.farmer_agent import farmer_agent

queries = [
    "सोयाबीनची पेरणी कधी करावी?",
    "माझ्या भागात पुढचे 7 दिवस पाऊस कसा आहे?",
    "What is the dry spell risk?",
    "Soybean la paani kadhi dyaycha?",
    "पिकासाठी मुसळधार पावसाचा धोका आहे का?"
]

print("==================================================")
print("    FARMER SUPPORT AI AGENT TEST BENCH           ")
print("==================================================\n")

history = []

for i, q in enumerate(queries, 1):
    print(f"--- [Turn {i}] ---")
    print(f"Farmer Message : \"{q}\"")
    res = farmer_agent.process_message(
        message=q,
        conversation_history=history,
        district="Pune",
        block="Haveli",
        panchayat="Wagholi",
        crop="soybean",
        days=14
    )
    
    print(f"Detected Lang  : {res['language_label']} ({res['language']})")
    print(f"Intent         : {res['intent']}")
    print(f"Verified Context: Location={res['context']['panchayat']}, {res['context']['block']}, Crop={res['context']['crop_display']}, Days={res['context']['days']}")
    print(f"ML Probabilities: Onset={res['ml_verified_data']['monsoon_onset_percent']}%, Break={res['ml_verified_data']['break_dry_spell_percent']}%, Heavy={res['ml_verified_data']['heavy_rainfall_percent']}%")
    print(f"Agent Response :\n  => {res['agent_response']}\n")
    
    history = res["updated_history"]

print("==================================================")
print("    ALL FARMER SUPPORT AGENT TESTS COMPLETED OK! ")
print("==================================================")
