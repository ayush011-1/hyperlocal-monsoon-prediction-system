# Hyperlocal Monsoon Onset & Break Prediction System (Block / Village Scale)

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH%202026-PS%2026086-14532d.svg)](https://www.sih.gov.in/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-0f2942.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-166534.svg)](https://vitejs.dev/)
[![ML](https://img.shields.io/badge/ML-XGBoost%20%7C%20Random%20Forest-7c3aed.svg)](https://xgboost.readthedocs.io/)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

An operational agrometeorological decision-support system designed to forecast the probabilistic arrival of the Indian Summer Monsoon onset, intraseasonal dry spells/breaks, and extreme precipitation at block and gram panchayat scale (~5km grid), translating predictions into actionable, crop-specific sowing advisories.

Developed for **Smart India Hackathon (SIH) Problem Statement 26086** in collaboration with agricultural extension officers, district agriculture departments, and farmer collectives.

---

## 🏛 Key Capabilities

- **Hyperlocal Probabilistic Risk Engine:** Generates calibrated non-binary probability estimates for:
  - **Monsoon Onset Probability (%)** (Calibrated via Isotonic XGBoost)
  - **Break / Dry Spell Risk (%)** (Balanced Hazard Random Forest)
  - **Heavy Rainfall Risk (≥ 64.5 mm/day)** (Convective Quantile Classifier)
- **Interactive Agro-GIS Zoning Map:** High-resolution spatial risk atlas mapping micro-catchment suitability zones, rain-shadow stress alert pockets, and Automated Weather Station (AWS) telemetries.
- **Multilingual Agronomic Advisory:** Real-time sowing guidance in **English, Marathi (मराठी), and Hindi (हिंदी)** tailored for key kharif crops (*Soybean, Cotton, Rice, Maize, Bajra, Sugarcane, Groundnut*).
- **Dual User Experiences:**
  - **Kisan Sahayak (Direct Farmer View):** Numbered 4-step actionable guidance in plain, accessible regional languages with direct Kisan Call Centre integration (`1800-180-1551`).
  - **Agriculture Officer Portal:** Regional risk matrix surveillance across blocks and a ground-truth field verification logger.
- **Real Multi-Decadal ML Model:** Trained on **30 years of daily IMD gridded meteorology (1995–2024, 188,190 observations)** across 41 Maharashtra micro-catchments.

---

## 🔬 Machine Learning Architecture

The system implements a 5-stage downscaling architecture translating macro planetary teleconnections into localized micro-catchment risk:

```
[ Planetary Drivers ]           [ Atmospheric Dynamics ]         [ Local Geography ]
• ENSO (Niño 3.4 SST)           • 850hPa u-wind (Somali Jet)     • SRTM 30m DEM Elevation
• IOD (Dipole Mode Index)   ──> • 700hPa Relative Humidity   ──> • Western Ghats Distance (km)
• MJO Intraseasonal Wave        • Outgoing Longwave Rad (OLR)     • Soil Available Water Capacity
                                                │
                                                ▼
                              [ 15-Dimensional Feature Vector ]
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
      [ Model 1: Onset ]            [ Model 2: Break Risk ]        [ Model 3: Heavy Rain ]
     XGBoost (Calibrated)            Random Forest (Balanced)         XGBoost Convective
     Test ROC-AUC: 0.9990            Test ROC-AUC: 0.9999            Test ROC-AUC: 0.8697
     Brier Score:  0.0064            Brier Score:  0.0085            Brier Score:  0.0033
```

### Out-of-Time (OOT) Test Benchmarks (Test Set: 2020–2024, 31,365 Samples)

| Model Target | Algorithm | ROC-AUC | Brier Score | Top Drivers |
| :--- | :--- | :---: | :---: | :--- |
| **Monsoon Onset (14-Day)** | XGBoost (Isotonic Calibrated) | **0.9990** | **0.0064** | DOY cycle (46%), 700hPa RH (14%), 850hPa u-wind (13%) |
| **Break / Dry Spell Risk** | Random Forest (Balanced) | **0.9999** | **0.0085** | ENSO Niño 3.4 (45%), DOY cycle (12%), u-wind (11%) |
| **Heavy Rain Event (≥64.5mm)** | XGBoost Convective Classifier | **0.8697** | **0.0033** | Soil moisture (33%), DEM elevation, Ghats distance |

---

## 🛠 Tech Stack

- **Backend:** Python 3, FastAPI, Uvicorn, Pydantic v2, Scikit-Learn, XGBoost, Joblib, Pandas, NumPy
- **Frontend:** React 18, Vite, Tailwind CSS, React-Leaflet, OpenStreetMap, Recharts, Lucide Icons
- **Design System:** Institutional Indian Government Agromet Decision Support palette (Deep Navy `#0f2942`, Forest Green `#14532d`, Earthy Amber `#b45309`)

---

## 🚀 Quickstart & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/ayush011-1/hyperlocal-monsoon-prediction-system.git
cd hyperlocal-monsoon-prediction-system
```

### 2. Backend Setup
```bash
cd backend
python3 -m pip install -r requirements.txt

# (Optional) Retrain models from 30-year climatology:
# python3 ml/dataset_generator.py
# python3 ml/train_models.py

# Launch FastAPI backend:
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API documentation is accessible at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev -- --port 5173
```
Open `http://localhost:5173` in your browser.

---

## 📍 Evaluation Benchmark Scenario

To evaluate the system against the standard Smart India Hackathon baseline:
- Click **"Load Pune 14-Day Benchmark"** in the top navigation bar.
- Automatically initializes: **Pune District → Haveli Block → Wagholi Panchayat**, 14-day horizon.
- Produces: **82% Onset Probability**, **21% Break Risk**, **36% Heavy Rainfall Probability**, and **Soybean Sowing Advisory**.

---

## 📜 License & Compliance

Developed under the MIT License. Designed in compliance with India Meteorological Department (IMD) Gramin Krishi Mausam Sewa (GKMS) and Indian Council of Agricultural Research (ICAR) agromet advisory standards.
