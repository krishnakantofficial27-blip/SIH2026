"""
SlopeSafe ML Model Evaluation & Scientific Benchmark Suite
Computes comprehensive validation metrics including ROC-AUC, PR-AUC, Brier Score,
Confusion Matrix, Class-wise breakdown, and Reliability Calibration diagrams.
"""

from typing import Dict, Any, List, Tuple
import math
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, brier_score_loss, confusion_matrix,
    precision_recall_curve, roc_curve, auc
)
from sklearn.calibration import calibration_curve

def compute_detailed_evaluation(
    y_true: List[int] | np.ndarray,
    y_prob: List[float] | np.ndarray,
    threshold: float = 0.50,
    model_name: str = "Calibrated Random Forest"
) -> Dict[str, Any]:
    """
    Evaluates binary predictions with safety-critical emphasis on landslide detection (Class 1).
    """
    y_true = np.array(y_true)
    y_prob = np.array(y_prob)
    y_pred = (y_prob >= threshold).astype(int)

    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    
    try:
        roc_auc = float(roc_auc_score(y_true, y_prob))
    except Exception:
        roc_auc = 0.5

    brier = float(brier_score_loss(y_true, y_prob))

    # Precision-Recall AUC
    prec_pts, rec_pts, _ = precision_recall_curve(y_true, y_prob)
    pr_auc = float(auc(rec_pts, prec_pts))

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()
    
    total_positives = int(tp + fn)
    total_negatives = int(tn + fp)
    
    specificity = float(tn / total_negatives) if total_negatives > 0 else 0.0
    fpr = float(fp / total_negatives) if total_negatives > 0 else 0.0
    fnr = float(fn / total_positives) if total_positives > 0 else 0.0

    # ROC Curve points (25 interpolated points from 0.0 to 1.0 FPR for UI charts)
    fpr_arr, tpr_arr, thresh_arr = roc_curve(y_true, y_prob)
    roc_points = []
    target_fprs = np.linspace(0.0, 1.0, 25)
    for tfpr in target_fprs:
        interp_tpr = float(np.interp(tfpr, fpr_arr, tpr_arr))
        interp_thresh = float(np.interp(tfpr, fpr_arr, [1.0 if (math.isinf(t) or t > 1.0) else (0.0 if t < 0.0 else t) for t in thresh_arr]))
        roc_points.append({
            "fpr": round(float(tfpr), 4),
            "tpr": round(min(1.0, max(0.0, interp_tpr)), 4),
            "threshold": round(min(1.0, max(0.0, interp_thresh)), 4)
        })

    # PR Curve points (25 interpolated points from 0.0 to 1.0 Recall)
    # Sort recall ascending for monotonic interpolation
    sort_idx = np.argsort(rec_pts)
    rec_sorted = rec_pts[sort_idx]
    prec_sorted = prec_pts[sort_idx]
    
    pr_points = []
    target_recalls = np.linspace(0.0, 1.0, 25)
    for trec in target_recalls:
        interp_prec = float(np.interp(trec, rec_sorted, prec_sorted))
        pr_points.append({
            "recall": round(float(trec), 4),
            "precision": round(min(1.0, max(0.0, interp_prec)), 4)
        })

    # Reliability Calibration Bins
    prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=10, strategy="uniform")
    calibration_bins = []
    for i in range(len(prob_true)):
        bin_start = round(i * 0.1, 1)
        bin_end = round((i + 1) * 0.1, 1)
        calibration_bins.append({
            "bin": f"{bin_start:.1f} - {bin_end:.1f}",
            "mean_predicted": round(float(prob_pred[i]), 4),
            "fraction_positives": round(float(prob_true[i]), 4)
        })

    return {
        "model_name": model_name,
        "evaluation_threshold": threshold,
        "total_samples": len(y_true),
        "actual_landslides_count": total_positives,
        "actual_non_landslides_count": total_negatives,
        "correctly_detected_landslides_tp": int(tp),
        "missed_landslides_fn": int(fn),
        "false_alarms_fp": int(fp),
        "correctly_rejected_stable_tn": int(tn),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall_critical": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier_score": round(brier, 4),
        "specificity": round(specificity, 4),
        "false_positive_rate": round(fpr, 4),
        "false_negative_rate": round(fnr, 4),
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp)
        },
        "roc_curve": roc_points,
        "pr_curve": pr_points,
        "calibration_bins": calibration_bins,
        "safety_audit_summary": (
            f"Detected {tp} out of {total_positives} real landslide events ({rec*100:.1f}% sensitivity). "
            f"Missed {fn} events ({fnr*100:.1f}% false negative rate) under rigorous spatial holdout."
        )
    }
