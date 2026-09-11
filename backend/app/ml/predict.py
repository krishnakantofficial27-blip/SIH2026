"""
SlopeSafe ML Prediction & Inference Module
Loads calibrated model artifact and generates explainable landslide risk assessments.
"""

from typing import Dict, Any, List, Tuple, Optional
from pathlib import Path
import os
import joblib
import numpy as np

from .features import extract_feature_vector, FEATURE_NAMES
from .validation import clean_and_sanitize_features
from .model import SlopeSafeLandslideModel, MODEL_VERSION
from .explainability import generate_decision_support_explanation, calculate_uncertainty_and_confidence

# Search paths for model.joblib
ROOT = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = Path('/tmp/model.joblib') if os.getenv('VERCEL') else ROOT / 'model.joblib'
ML_SUB_PATH = ROOT / 'app' / 'ml' / 'models' / 'model.joblib'

_LOADED_MODEL: Optional[SlopeSafeLandslideModel] = None

def get_or_load_model() -> SlopeSafeLandslideModel:
    """Singleton getter for the loaded calibrated model."""
    global _LOADED_MODEL
    if _LOADED_MODEL is not None:
        return _LOADED_MODEL

    # Check potential artifact locations
    for p in [MODEL_PATH, ML_SUB_PATH]:
        if p.exists():
            try:
                loaded = joblib.load(p)
                # Check if loaded object is SlopeSafeLandslideModel or legacy model
                if isinstance(loaded, SlopeSafeLandslideModel):
                    _LOADED_MODEL = loaded
                    return _LOADED_MODEL
                elif hasattr(loaded, "predict_proba") or hasattr(loaded, "predict"):
                    # Wrap legacy scikit-learn model
                    wrapper = SlopeSafeLandslideModel(calibrated_model=loaded)
                    _LOADED_MODEL = wrapper
                    return _LOADED_MODEL
            except Exception:
                pass

    # If no model found on disk, trigger standard training pipeline
    from .train import run_full_training_pipeline
    _LOADED_MODEL = run_full_training_pipeline()
    return _LOADED_MODEL

def predict_landslide_risk(
    raw_record: Dict[str, Any],
    verified_reports_count: int = 0
) -> Dict[str, Any]:
    """
    Primary API-facing inference function:
    1. Sanitizes inputs
    2. Computes geotechnical feature vectors
    3. Infers calibrated probability
    4. Evaluates explainability factors and uncertainty bounds
    """
    clean_record = clean_and_sanitize_features(raw_record)
    model = get_or_load_model()
    
    vector, feat_dict = extract_feature_vector(clean_record)
    
    # Compute calibrated probability P(landslide=1)
    if hasattr(model.calibrated_model, "predict_proba"):
        prob_dist = model.calibrated_model.predict_proba([vector])[0]
        landslide_prob = float(prob_dist[1]) if len(prob_dist) > 1 else float(prob_dist[0])
    else:
        raw_pred = float(model.calibrated_model.predict([vector])[0])
        landslide_prob = max(0.0, min(1.0, raw_pred / 100.0 if raw_pred > 1.0 else raw_pred))

    # Explainability & uncertainty estimation
    explanation = generate_decision_support_explanation(
        probability=landslide_prob,
        features=feat_dict,
        verified_reports_count=verified_reports_count
    )

    risk_score = round(landslide_prob * 100.0, 1)
    risk_level = explanation["risk_classification"]

    # Extract top physical contributing factors
    top_factors = [d["factor"] for d in explanation.get("primary_risk_drivers", [])[:4]]

    return {
        "model_version": getattr(model, "version", MODEL_VERSION),
        "probability": round(landslide_prob, 4),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "confidence": round(1.0 - (explanation["confidence_interval_95"]["uncertainty_margin_pct"] / 100.0), 2),
        "confidence_level": explanation["confidence_level"],
        "confidence_interval_95": explanation["confidence_interval_95"],
        "top_factors": top_factors,
        "primary_risk_drivers": explanation["primary_risk_drivers"],
        "recommendation": explanation["advisory_recommendation"],
        "features_used": feat_dict,
        "scientific_disclaimer": explanation["scientific_disclaimer"]
    }
