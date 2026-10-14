"""Predictor and Explainable Risk Scoring Engine for URL Sentinel AI."""

import os
import joblib
import pandas as pd
from typing import Dict, Any, List, Tuple
from app.features.url_features import extract_features, INDICATOR_EXPLANATIONS

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "model.joblib")

_model_cache = None


def get_model():
    """Loads the serialized model bundle into memory (cached)."""
    global _model_cache
    if _model_cache is not None:
        return _model_cache
    
    if os.path.exists(MODEL_PATH):
        try:
            _model_cache = joblib.load(MODEL_PATH)
            return _model_cache
        except Exception as e:
            print(f"Warning: Failed to load model artifact: {e}")
            return None
    return None


def calculate_risk_score(prob_malicious: float, detected_indicators: List[str], features: Dict[str, Any]) -> int:
    """
    Calculates a reproducible, documented risk score (0 to 100) combining:
    - 70% Weight: Calibrated Machine Learning Malicious Probability.
    - 30% Weight: Observable Structural & Lexical Risk Indicators.
    """
    ml_component = prob_malicious * 70.0

    # Indicator weights (bounded to max 30)
    indicator_weights = {
        "ip_address_hostname": 10.0,
        "userinfo_syntax": 8.0,
        "suspicious_keywords_present": 6.0,
        "multiple_subdomains": 5.0,
        "encoded_characters": 4.0,
        "nonstandard_port": 5.0,
        "long_hostname": 3.0,
        "long_url": 3.0,
        "http_usage": 3.0,
        "high_special_char_count": 3.0,
        "excessive_digits": 3.0,
    }

    indicator_sum = sum(indicator_weights.get(ind, 2.0) for ind in detected_indicators)
    heuristic_component = min(30.0, indicator_sum)

    total_score = int(round(ml_component + heuristic_component))
    return max(0, min(100, total_score))


def generate_explanation(classification: str, detected_indicators: List[str], is_ml: bool, prob_malicious: float) -> Tuple[str, str]:
    """
    Generates human-readable, evidence-based explanation and recommended actions.
    Separates observed URL characteristics from model-derived inferences.
    """
    if detected_indicators:
        indicator_names = [ind.replace("_", " ") for ind in detected_indicators[:3]]
        obs_text = f"The URL exhibits observable characteristics including {', '.join(indicator_names)}."
    else:
        obs_text = "No high-risk structural anomalies or deceptive keyword patterns were detected in the URL structure."

    if classification == "MALICIOUS":
        explanation = (
            f"{obs_text} The trained model computed a high risk probability ({prob_malicious * 100:.1f}%), "
            "indicating strong alignment with patterns observed in phishing, credential harvesting, or unauthorized payload distribution."
        )
        recommendation = (
            "The model predicts that this URL is potentially malicious. "
            "Avoid opening it or submitting sensitive information."
        )
    elif classification == "SUSPICIOUS":
        explanation = (
            f"{obs_text} While the risk level does not meet definitive malicious thresholds ({prob_malicious * 100:.1f}%), "
            "the combination of structural and lexical indicators warrants caution."
        )
        recommendation = (
            "Verify the domain independently and avoid submitting sensitive information "
            "until its legitimacy is established."
        )
    else:  # SAFE
        explanation = (
            f"{obs_text} The URL demonstrates structural consistency with standard benign domain naming conventions "
            f"with low estimated risk ({prob_malicious * 100:.1f}%)."
        )
        recommendation = (
            "Fewer suspicious URL characteristics were detected. "
            "This result does not guarantee that the website is safe."
        )

    return explanation, recommendation


def predict_url(raw_url: str) -> Dict[str, Any]:
    """
    Main prediction pipeline:
    1. Extracts 39 features, metadata, and detected indicators.
    2. Runs Machine Learning model (or fallback if uninitialized).
    3. Implements 3-class classification policy:
       - P(malicious) < threshold_safe (0.35) => SAFE
       - threshold_safe <= P(malicious) < threshold_malicious (0.65) => SUSPICIOUS
       - P(malicious) >= threshold_malicious (0.65) => MALICIOUS
    4. Computes deterministic risk score and evidence explanations.
    """
    features, metadata, detected_indicators = extract_features(raw_url)
    bundle = get_model()

    if bundle is not None and "model" in bundle:
        model = bundle["model"]
        feature_names = bundle["feature_names"]
        model_name = bundle.get("model_name", "Random Forest Classifier")
        model_version = bundle.get("model_version", "1.0.0")
        th_safe = bundle.get("threshold_safe", 0.35)
        th_mal = bundle.get("threshold_malicious", 0.65)
        prediction_status = "ML_PREDICTION"

        # Construct dataframe matching exact trained columns
        X_input = pd.DataFrame([features])[feature_names]
        
        # Binary prediction probabilities
        probs = model.predict_proba(X_input)[0]
        prob_benign = float(probs[0])
        prob_malicious = float(probs[1])

        # Three-Class Decision Policy based on calibrated uncertainty thresholds
        if prob_malicious >= th_mal:
            classification = "MALICIOUS"
        elif prob_malicious >= th_safe:
            classification = "SUSPICIOUS"
        else:
            classification = "SAFE"
            
        prob_dict = {
            "safe": round(prob_benign, 4),
            "malicious": round(prob_malicious, 4)
        }
    else:
        # Fallback Analysis (clearly distinguished if model artifact is absent)
        prediction_status = "FALLBACK_ANALYSIS"
        model_name = "Heuristic Rule-Based Fallback"
        model_version = "0.9.0"
        
        # Calculate heuristic risk
        high_severity_count = sum(1 for ind in detected_indicators if ind in ("ip_address_hostname", "userinfo_syntax"))
        total_indicators = len(detected_indicators)

        if high_severity_count > 0 or total_indicators >= 4:
            prob_malicious = 0.85
            classification = "MALICIOUS"
        elif total_indicators >= 2:
            prob_malicious = 0.50
            classification = "SUSPICIOUS"
        else:
            prob_malicious = 0.10
            classification = "SAFE"

        prob_dict = {
            "safe": round(1.0 - prob_malicious, 4),
            "malicious": round(prob_malicious, 4)
        }

    # Documented, reproducible risk score
    risk_score = calculate_risk_score(prob_malicious, detected_indicators, features)

    # Explanation and recommendation
    explanation, recommendation = generate_explanation(
        classification, detected_indicators, (prediction_status == "ML_PREDICTION"), prob_malicious
    )

    # Detailed indicators for the UI
    indicator_details = []
    for ind in detected_indicators:
        severity = "HIGH" if ind in ("ip_address_hostname", "userinfo_syntax", "nonstandard_port") else \
                   "MEDIUM" if ind in ("suspicious_keywords_present", "multiple_subdomains", "encoded_characters") else "LOW"
        indicator_details.append({
            "code": ind,
            "title": ind.replace("_", " ").title(),
            "description": INDICATOR_EXPLANATIONS.get(ind, "Observable structural variation in URL component."),
            "severity": severity
        })

    from datetime import datetime, timezone
    scanned_at_now = datetime.now(timezone.utc)

    return {
        "original_url": metadata["original_url"],
        "normalized_url": metadata["normalized_url"],
        "classification": classification,
        "risk_score": risk_score,
        "model_name": model_name,
        "model_version": model_version,
        "prediction_status": prediction_status,
        "scanned_at": scanned_at_now,
        "explanation": explanation,
        "recommendation": recommendation,
        "scheme": metadata["scheme"],
        "hostname": metadata["hostname"],
        "registered_domain": metadata["registered_domain"],
        "subdomain": metadata["subdomain"],
        "port": metadata["port"],
        "path": metadata["path"],
        "query_params_count": metadata["query_params_count"],
        "features": {
            "url_length": features["url_len"],
            "hostname_length": features["hostname_len"],
            "number_of_dots": features["dots_count"],
            "number_of_subdomains": features["num_subdomains"],
            "https_used": bool(features["has_https"]),
            "ip_address_hostname": bool(features["ip_host"]),
            "suspicious_keyword_count": len(metadata["matched_keywords"]),
            "special_character_count": features["special_chars"],
            "detected_indicators": detected_indicators
        },
        "indicators": indicator_details,
        "probabilities": prob_dict
    }
