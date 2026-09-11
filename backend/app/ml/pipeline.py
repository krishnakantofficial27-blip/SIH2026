"""
SlopeSafe ML Feature Engineering & Transformation Pipeline
Transforms raw environmental observations into physics-guided geotechnical feature vectors.
"""

from typing import Dict, Any, List, Tuple
from .features import FEATURE_NAMES, extract_feature_vector
from .validation import clean_and_sanitize_features

def engineer_features(raw_record: Dict[str, Any]) -> Tuple[List[float], Dict[str, float]]:
    """
    Transforms clean observation record into full 12-dimensional engineered feature vector.
    Returns (feature_vector_list, feature_dict).
    """
    clean = clean_and_sanitize_features(raw_record)
    return extract_feature_vector(clean)

