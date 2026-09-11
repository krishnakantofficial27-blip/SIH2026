"""
SlopeSafe ML Package
Real-World Machine Learning Pipeline for Landslide Early Warning & Risk Prediction
"""
from .validation import validate_environmental_record, clean_and_sanitize_features, ValidationError
from .spatial_validation import get_spatial_cross_validation_strategy, SPATIAL_BASINS
from .features import (
    extract_feature_vector, FEATURE_NAMES, compute_7d_api, compute_pore_saturation,
    compute_shear_stress_proxy, extract_comprehensive_domain_features
)
from .terrain import TerrainFeatures, compute_dem_terrain_features
from .landcover import LandCoverFeatures, compute_land_cover_features, LULC_CLASSES
from .geology import GeologicalFeatures, compute_geological_features, LITHOLOGY_CATALOG
from .inventory_ingestion import LandslideEventRecord, LandslideInventoryIngestion, get_inventory_ingestion
from .pipeline import engineer_features
from .model import SlopeSafeLandslideModel, MODEL_VERSION
from .evaluate import compute_detailed_evaluation
from .predict import get_or_load_model, predict_landslide_risk
from .explainability import generate_decision_support_explanation, calculate_uncertainty_and_confidence
from .trainer import get_multi_model_comparison_benchmark
from .train import run_full_training_pipeline, generate_stratified_dataset
from .data_provenance import get_all_dataset_provenance, get_dataset_provenance_by_id, DATASET_PROVENANCE_REGISTRY
