from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.locations import router as locations_router
from routes.forecast import router as forecast_router
from routes.climate import router as climate_router
from routes.advisory import router as advisory_router
from routes.observations import router as observations_router

app = FastAPI(
    title="Hyperlocal Monsoon Onset & Break Prediction System",
    description="SIH PS 26086: Operational Agromet Decision Support System for Block/Village Scale Agriculture",
    version="1.0.0"
)

# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(locations_router)
app.include_router(forecast_router)
app.include_router(climate_router)
app.include_router(advisory_router)
app.include_router(observations_router)

@app.get("/")
def read_root():
    return {
        "system": "Hyperlocal Monsoon Onset & Break Prediction System (Block/Village Scale)",
        "problem_statement": "PS 26086",
        "jurisdiction": "Department of Agriculture / IMD Agromet Advisory Collaboration",
        "status": "Operational (Agromet Decision Support System)",
        "endpoints": [
            "/api/locations",
            "/api/forecast",
            "/api/climate-indicators",
            "/api/advisory",
            "/api/field-observations",
            "/api/field-observation",
            "/api/pipeline-info"
        ]
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "fastapi-backend", "version": "1.0.0"}

@app.get("/api/pipeline-info")
def get_prediction_pipeline_info():
    """
    Returns real ML prediction pipeline metrics and architecture specification.
    """
    import os, json
    base_dir = os.path.dirname(__file__)
    metrics_path = os.path.join(base_dir, "models/model_metrics.json")
    meta_path = os.path.join(base_dir, "models/feature_metadata.json")

    metrics = {}
    if os.path.exists(metrics_path):
        try:
            with open(metrics_path, "r") as f:
                metrics = json.load(f)
        except Exception:
            pass

    meta = {}
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r") as f:
                meta = json.load(f)
        except Exception:
            pass

    return {
        "title": "Hyperlocal Monsoon Onset & Break ML Architecture",
        "description": "Hierarchical multi-stage spatial downscaling from synoptic planetary teleconnections to village micro-catchments.",
        "trained_models": metrics,
        "training_metadata": meta,
        "stages": [
            {
                "stage": 1,
                "name": "Synoptic & Macro Teleconnection Ingestion",
                "sources": ["NOAA CPC", "IMD Pune", "BOM Australia"],
                "parameters": ["ENSO Niño 3.4 SST anomaly", "Indian Ocean Dipole (DMI)", "MJO Real-time Phase & Amplitude", "Equatorial Wave Spectra"],
                "role": "Defines broad 15-45 day convective envelope potential across the Indian subcontinent."
            },
            {
                "stage": 2,
                "name": "Regional Weather & Atmospheric Dynamic Fields",
                "sources": ["NCMRWF (Unified Model)", "ECMWF IFS (0.1°)", "IMD WRF"],
                "parameters": ["850hPa Zonal Wind Velocity (u-wind)", "700hPa Relative Humidity", "Outgoing Longwave Radiation (OLR)", "Convective Available Potential Energy (CAPE)"],
                "role": "Quantifies moisture flux convergence along the Western Ghats and peninsular rain shadow."
            },
            {
                "stage": 3,
                "name": "Historical Climatological Baselines (1991-2025)",
                "sources": ["IMD Daily Gridded Rainfall (0.25° x 0.25°)", "Agromet Taluka Station Archives"],
                "parameters": ["30-Year Normal Onset Date by Block", "Dry Spell Frequency Distribution", "Standardized Precipitation Index (SPI)"],
                "role": "Provides robust Bayesian priors and prevents false alarms from unseasonal pre-monsoon showers."
            },
            {
                "stage": 4,
                "name": "Hyperlocal Physiographic & Topographic Features",
                "sources": ["SRTM 30m Digital Elevation Model", "NBSS&LUP Soil Survey"],
                "parameters": ["Block Elevation (m)", "Slope & Aspect (Orographic Lift Coefficient)", "Soil Available Water Capacity (AWC)", "Distance to Ridge Line"],
                "role": "Downscales grid predictions to village micro-climate variations."
            },
            {
                "stage": 5,
                "name": "Machine Learning Prediction Engine",
                "target_models": ["LightGBM / XGBoost Regressor", "Random Forest Spatial Classifier", "Survival Analysis Hazard Estimator"],
                "outputs": [
                    "Monsoon Onset Probability (%)",
                    "Break / Extended Dry Spell Risk (%)",
                    "Heavy Rainfall Episode Probability (%)"
                ],
                "role": "Delivers calibrated, non-binary probabilistic risk estimates for agro-climatic decision support."
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
