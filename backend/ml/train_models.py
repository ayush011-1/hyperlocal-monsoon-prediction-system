"""
Model Training Pipeline for Hyperlocal Monsoon Onset & Break Prediction System
Trains XGBoost and Random Forest models on historical daily meteorological records.
Performs Out-of-Time (OOT) evaluation (Train: 1995-2019, Test: 2020-2024).
"""

import os
import json
import math
import joblib
import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    roc_auc_score,
    brier_score_loss,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score
)

def add_cyclic_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["doy_sin"] = np.sin(2 * np.pi * df["doy"] / 365.25)
    df["doy_cos"] = np.cos(2 * np.pi * df["doy"] / 365.25)
    return df

def train_all_models():
    base_dir = os.path.dirname(__file__)
    data_path = os.path.join(base_dir, "../data/historical_monsoon_30yr.csv")
    models_dir = os.path.join(base_dir, "../models")
    os.makedirs(models_dir, exist_ok=True)

    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    df = add_cyclic_features(df)

    feature_cols = [
        "lat",
        "lng",
        "elevation_m",
        "ghats_dist_km",
        "doy_sin",
        "doy_cos",
        "enso_nino34",
        "iod_dmi",
        "mjo_phase",
        "mjo_amplitude",
        "temp_max_c",
        "relative_humidity_700hpa",
        "zonal_wind_850hpa_ms",
        "outgoing_longwave_radiation_wm2",
        "antecedent_soil_moisture_pct"
    ]

    print(f"Feature set ({len(feature_cols)} features): {feature_cols}")

    # Out-of-Time split: Train on 1995-2019, Test on 2020-2024
    train_mask = df["year"] <= 2019
    test_mask = df["year"] >= 2020

    X_train = df.loc[train_mask, feature_cols]
    X_test  = df.loc[test_mask, feature_cols]

    print(f"Train samples (1995-2019): {len(X_train):,}")
    print(f"Test samples (2020-2024):  {len(X_test):,}")

    metrics_summary = {}

    # ============================================================
    # 1. MODEL 1: Monsoon Onset Predictor (XGBoost + Calibration)
    # ============================================================
    print("\n" + "="*60)
    print("Training Model 1: Monsoon Onset 14-Day Classifier (XGBoost)")
    print("="*60)
    y_train_onset = df.loc[train_mask, "target_onset_14d"]
    y_test_onset  = df.loc[test_mask, "target_onset_14d"]

    pos_scale = (len(y_train_onset) - sum(y_train_onset)) / max(1, sum(y_train_onset))

    xgb_onset_base = XGBClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        scale_pos_weight=pos_scale,
        random_state=42,
        eval_metric="logloss"
    )

    # Wrap in probability calibration
    onset_model = CalibratedClassifierCV(estimator=xgb_onset_base, method="isotonic", cv=3)
    onset_model.fit(X_train, y_train_onset)

    preds_proba_onset = onset_model.predict_proba(X_test)[:, 1]
    preds_onset = (preds_proba_onset >= 0.5).astype(int)

    auc_onset = roc_auc_score(y_test_onset, preds_proba_onset)
    brier_onset = brier_score_loss(y_test_onset, preds_proba_onset)
    f1_onset = f1_score(y_test_onset, preds_onset)

    print(f"Monsoon Onset Model Test ROC-AUC:    {auc_onset:.4f}")
    print(f"Monsoon Onset Model Brier Score:    {brier_onset:.4f}")
    print(f"Monsoon Onset Model F1 Score:       {f1_onset:.4f}")
    print("Classification Report:\n", classification_report(y_test_onset, preds_onset, digits=3))

    joblib.dump(onset_model, os.path.join(models_dir, "xgboost_onset.pkl"))

    # Extract base model feature importances
    xgb_onset_base.fit(X_train, y_train_onset)
    importances_onset = dict(zip(feature_cols, [round(float(x), 4) for x in xgb_onset_base.feature_importances_]))
    sorted_importances_onset = dict(sorted(importances_onset.items(), key=lambda item: item[1], reverse=True))

    metrics_summary["monsoon_onset"] = {
        "model_type": "XGBoost Classifier (Isotonic Calibrated)",
        "roc_auc": round(float(auc_onset), 4),
        "brier_score": round(float(brier_onset), 4),
        "f1_score": round(float(f1_onset), 4),
        "top_features": list(sorted_importances_onset.items())[:5]
    }

    # ============================================================
    # 2. MODEL 2: Break / Dry Spell Risk Model (Random Forest)
    # ============================================================
    print("\n" + "="*60)
    print("Training Model 2: Break / Dry Spell Risk Model (Random Forest)")
    print("="*60)
    y_train_break = df.loc[train_mask, "target_break_14d"]
    y_test_break  = df.loc[test_mask, "target_break_14d"]

    rf_break = RandomForestClassifier(
        n_estimators=100,
        max_depth=7,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42
    )
    rf_break.fit(X_train, y_train_break)

    preds_proba_break = rf_break.predict_proba(X_test)[:, 1]
    preds_break = (preds_proba_break >= 0.5).astype(int)

    auc_break = roc_auc_score(y_test_break, preds_proba_break)
    brier_break = brier_score_loss(y_test_break, preds_proba_break)
    f1_break = f1_score(y_test_break, preds_break)

    print(f"Break Risk Model Test ROC-AUC: {auc_break:.4f}")
    print(f"Break Risk Model Brier Score: {brier_break:.4f}")
    print(f"Break Risk Model F1 Score:    {f1_break:.4f}")

    joblib.dump(rf_break, os.path.join(models_dir, "rf_break_spell.pkl"))

    importances_break = dict(zip(feature_cols, [round(float(x), 4) for x in rf_break.feature_importances_]))
    sorted_importances_break = dict(sorted(importances_break.items(), key=lambda item: item[1], reverse=True))

    metrics_summary["break_risk"] = {
        "model_type": "Random Forest Classifier (Balanced Class Weights)",
        "roc_auc": round(float(auc_break), 4),
        "brier_score": round(float(brier_break), 4),
        "f1_score": round(float(f1_break), 4),
        "top_features": list(sorted_importances_break.items())[:5]
    }

    # ============================================================
    # 3. MODEL 3: Heavy Rainfall Hazard Model (XGBoost)
    # ============================================================
    print("\n" + "="*60)
    print("Training Model 3: Extreme Heavy Rainfall Event Model (XGBoost)")
    print("="*60)
    y_train_heavy = df.loc[train_mask, "target_heavy_rain"]
    y_test_heavy  = df.loc[test_mask, "target_heavy_rain"]

    heavy_pos_scale = (len(y_train_heavy) - sum(y_train_heavy)) / max(1, sum(y_train_heavy))

    xgb_heavy = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.06,
        scale_pos_weight=min(pos_scale, 20.0),
        random_state=42,
        eval_metric="logloss"
    )
    xgb_heavy.fit(X_train, y_train_heavy)

    preds_proba_heavy = xgb_heavy.predict_proba(X_test)[:, 1]
    auc_heavy = roc_auc_score(y_test_heavy, preds_proba_heavy)
    brier_heavy = brier_score_loss(y_test_heavy, preds_proba_heavy)

    print(f"Heavy Rain Event Model Test ROC-AUC: {auc_heavy:.4f}")
    print(f"Heavy Rain Event Model Brier Score: {brier_heavy:.4f}")

    joblib.dump(xgb_heavy, os.path.join(models_dir, "xgboost_heavy_rain.pkl"))

    importances_heavy = dict(zip(feature_cols, [round(float(x), 4) for x in xgb_heavy.feature_importances_]))
    sorted_importances_heavy = dict(sorted(importances_heavy.items(), key=lambda item: item[1], reverse=True))

    metrics_summary["heavy_rain"] = {
        "model_type": "XGBoost Convective Precipitation Classifier",
        "roc_auc": round(float(auc_heavy), 4),
        "brier_score": round(float(brier_heavy), 4),
        "top_features": list(sorted_importances_heavy.items())[:5]
    }

    # Save feature metadata & training report
    feature_meta = {
        "features": feature_cols,
        "train_years": "1995-2019",
        "test_years": "2020-2024",
        "total_records": len(df),
        "training_samples": len(X_train),
        "evaluation_samples": len(X_test),
        "last_trained_utc": pd.Timestamp.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    }

    with open(os.path.join(models_dir, "feature_metadata.json"), "w") as f:
        json.dump(feature_meta, f, indent=2)

    with open(os.path.join(models_dir, "model_metrics.json"), "w") as f:
        json.dump(metrics_summary, f, indent=2)

    print("\n" + "="*60)
    print("SUCCESS: All 3 real ML models trained and saved to backend/models/")
    print(json.dumps(metrics_summary, indent=2))
    print("="*60)

if __name__ == "__main__":
    train_all_models()
