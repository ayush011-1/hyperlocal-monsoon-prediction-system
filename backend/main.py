import os
import json
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Try loading .env variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Setup structured logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("agromet_backend")

# Import API Routers
from routes.locations import router as locations_router
from routes.forecast import router as forecast_router
from routes.climate import router as climate_router
from routes.advisory import router as advisory_router
from routes.observations import router as observations_router
from routes.nlp import router as nlp_router
from routes.agent import router as agent_router
from routes.notifications import router as notifications_router
from routes.stream import router as stream_router

app = FastAPI(
    title="Hyperlocal Monsoon Onset & Break Prediction System",
    description="SIH PS 26086: Operational Agromet Decision Support System for Block/Village Scale Agriculture",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": str(exc),
            "path": request.url.path
        }
    )

# Include Routers
app.include_router(locations_router)
app.include_router(forecast_router)
app.include_router(climate_router)
app.include_router(advisory_router)
app.include_router(observations_router)
app.include_router(nlp_router)
app.include_router(agent_router)
app.include_router(notifications_router)
app.include_router(stream_router)

@app.get("/", tags=["System Information"])
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
            "/api/pipeline-info",
            "/api/nlp/query",
            "/api/agent/chat",
            "/api/notifications/send",
            "/api/stream/live/all"
        ]
    }

@app.get("/api/health", tags=["Health & Monitoring"])
def health_check():
    return {
        "status": "healthy",
        "service": "fastapi-backend",
        "version": "1.0.0",
        "environment": os.getenv("APP_ENV", "production")
    }

@app.get("/api/models/status", tags=["Health & Monitoring"])
def models_status():
    from services.ml_predictor import ml_predictor
    return {
        "models_loaded": ml_predictor.models_loaded,
        "metadata": ml_predictor.model_metadata
    }

@app.get("/api/pipeline-info", tags=["Health & Monitoring"])
def get_prediction_pipeline_info():
    """
    Returns real ML prediction pipeline metrics and architecture specification.
    """
    base_dir = os.path.dirname(__file__)
    metrics_path = os.path.join(base_dir, "models/model_metrics.json")
    meta_path = os.path.join(base_dir, "models/feature_metadata.json")

    metrics = {}
    if os.path.exists(metrics_path):
        try:
            with open(metrics_path, "r", encoding="utf-8") as f:
                metrics = json.load(f)
        except Exception as e:
            logger.warning(f"Could not read metrics: {e}")

    meta = {}
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
        except Exception as e:
            logger.warning(f"Could not read metadata: {e}")

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
                "parameters": ["ENSO Niño 3.4 SST anomaly", "Indian Ocean Dipole (DMI)", "MJO Real-time Phase & Amplitude"],
                "role": "Defines broad 15-45 day convective envelope potential across the Indian subcontinent."
            },
            {
                "stage": 2,
                "name": "Regional Weather & Atmospheric Dynamic Fields",
                "sources": ["NCMRWF (Unified Model)", "ECMWF IFS (0.1°)", "IMD WRF"],
                "parameters": ["850hPa Zonal Wind Velocity (u-wind)", "700hPa Relative Humidity", "Outgoing Longwave Radiation (OLR)"],
                "role": "Quantifies moisture flux convergence along the Western Ghats and peninsular rain shadow."
            },
            {
                "stage": 3,
                "name": "Historical Climatological Baselines (1995-2024)",
                "sources": ["IMD Daily Gridded Rainfall (0.25° x 0.25°)", "Agromet Taluka Station Archives"],
                "parameters": ["30-Year Normal Onset Date by Block", "Dry Spell Frequency Distribution", "Standardized Precipitation Index"],
                "role": "Provides robust Bayesian priors and prevents false alarms from unseasonal pre-monsoon showers."
            },
            {
                "stage": 4,
                "name": "Hyperlocal Physiographic & Topographic Features",
                "sources": ["SRTM 30m Digital Elevation Model", "NBSS&LUP Soil Survey"],
                "parameters": ["Block Elevation (m)", "Slope & Aspect", "Soil Available Water Capacity (AWC)", "Distance to Ridge Line"],
                "role": "Downscales grid predictions to village micro-climate variations."
            },
            {
                "stage": 5,
                "name": "Machine Learning Prediction Engine",
                "target_models": ["Isotonic XGBoost Classifier", "Balanced Random Forest Classifier", "Convective XGBoost Classifier"],
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
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)
