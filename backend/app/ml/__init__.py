"""
SlopeSafe ML Package
Modular Machine Learning Pipeline for Landslide Early Warning
"""
from .validation import validate_environmental_record, clean_and_sanitize_features, ValidationError
from .spatial_validation import get_spatial_cross_validation_strategy
from .pipeline import engineer_features, FEATURE_NAMES
from .explainability import generate_decision_support_explanation, calculate_uncertainty_and_confidence
from .trainer import get_multi_model_comparison_benchmark
