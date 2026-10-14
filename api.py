"""FastAPI API Routes for URL Sentinel AI."""

import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import ModelEvaluations
from app.schemas.schemas import (
    ScanRequest,
    ScanResponse,
    HistoryListResponse,
    ClearHistoryRequest,
    DashboardStats,
    ModelInfo,
    ModelPerformance,
)
from app.ml.predictor import predict_url, get_model
from app.services.scan_service import (
    save_scan_result,
    get_scan_history,
    get_scan_by_id,
    clear_scan_history,
    get_dashboard_analytics,
)

router = APIRouter(prefix="/api", tags=["Sentinel Security API"])


@router.get("/health")
def health_check():
    """Health check endpoint indicating backend readiness."""
    model_bundle = get_model()
    return {
        "status": "healthy",
        "service": "URL Sentinel AI",
        "model_loaded": model_bundle is not None,
        "database": "sqlite",
        "version": "1.0.0"
    }


@router.post("/scan", response_model=ScanResponse, status_code=status.HTTP_200_OK)
def scan_url_endpoint(request: ScanRequest, db: Session = Depends(get_db)):
    """
    Analyzes submitted URL:
    1. Validates & normalizes URL input.
    2. Extracts lexical & structural features.
    3. Runs ML inference with 3-class uncertainty policy.
    4. Computes risk score and evidence explanations.
    5. Saves scan and features to SQLite database.
    """
    try:
        result_data = predict_url(request.url)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Security analysis pipeline failed: {str(e)}"
        )

    # Persist to database
    try:
        saved_scan = save_scan_result(db, result_data)
        result_data["id"] = saved_scan.id
    except Exception as db_err:
        # We still return the analysis even if DB persistence encounters an issue, but log it
        print(f"Warning: Failed to save scan record to database: {db_err}")

    return result_data


@router.get("/history", response_model=HistoryListResponse)
def get_history_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by original or normalized URL"),
    classification: Optional[str] = Query(None, description="Filter by SAFE, SUSPICIOUS, or MALICIOUS"),
    sort_by: str = Query("scanned_at", description="Field to sort by (scanned_at, risk_score)"),
    order: str = Query("desc", description="Sort order (asc, desc)"),
    db: Session = Depends(get_db)
):
    """Retrieves paginated scan history with filtering, sorting, and search."""
    return get_scan_history(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        classification=classification,
        sort_by=sort_by,
        order=order
    )


@router.get("/history/{scan_id}", response_model=ScanResponse)
def get_scan_details_endpoint(scan_id: int, db: Session = Depends(get_db)):
    """Retrieves details of a specific scan by its database ID."""
    record = get_scan_by_id(db, scan_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Scan record #{scan_id} not found.")

    indicators = []
    if record.features and record.features.detected_indicators:
        try:
            indicators = json.loads(record.features.detected_indicators)
        except Exception:
            indicators = []

    # Format indicator details
    from app.features.url_features import INDICATOR_EXPLANATIONS
    indicator_details = []
    for ind in indicators:
        severity = "HIGH" if ind in ("ip_address_hostname", "userinfo_syntax", "nonstandard_port") else \
                   "MEDIUM" if ind in ("suspicious_keywords_present", "multiple_subdomains", "encoded_characters") else "LOW"
        indicator_details.append({
            "code": ind,
            "title": ind.replace("_", " ").title(),
            "description": INDICATOR_EXPLANATIONS.get(ind, "Observable structural variation in URL component."),
            "severity": severity
        })

    # Recommendation lookup
    from app.ml.predictor import generate_explanation
    _, recommendation = generate_explanation(
        record.classification, indicators, (record.prediction_status == "ML_PREDICTION"), record.risk_score / 100.0
    )

    from urllib.parse import urlparse, parse_qs
    import tldextract
    parsed = urlparse(record.normalized_url)
    ext = tldextract.extract(record.normalized_url)
    registered_domain = f"{ext.domain}.{ext.suffix}" if ext.domain and ext.suffix else ext.domain

    return {
        "id": record.id,
        "original_url": record.original_url,
        "normalized_url": record.normalized_url,
        "classification": record.classification,
        "risk_score": record.risk_score,
        "model_name": record.model_name,
        "model_version": record.model_version,
        "prediction_status": record.prediction_status,
        "scanned_at": record.scanned_at,
        "explanation": record.explanation,
        "recommendation": recommendation,
        "scheme": parsed.scheme,
        "hostname": parsed.hostname or "",
        "registered_domain": registered_domain or "",
        "subdomain": ext.subdomain,
        "port": parsed.port,
        "path": parsed.path or "",
        "query_params_count": len(parse_qs(parsed.query)),
        "features": {
            "url_length": record.features.url_length if record.features else len(record.normalized_url),
            "hostname_length": record.features.hostname_length if record.features else len(parsed.hostname or ""),
            "number_of_dots": record.features.number_of_dots if record.features else record.normalized_url.count("."),
            "number_of_subdomains": record.features.number_of_subdomains if record.features else 0,
            "https_used": record.features.https_used if record.features else parsed.scheme == "https",
            "ip_address_hostname": record.features.ip_address_hostname if record.features else False,
            "suspicious_keyword_count": record.features.suspicious_keyword_count if record.features else 0,
            "special_character_count": record.features.special_character_count if record.features else 0,
            "detected_indicators": indicators
        },
        "indicators": indicator_details,
        "probabilities": None
    }


@router.delete("/history")
def clear_history_endpoint(request: ClearHistoryRequest, db: Session = Depends(get_db)):
    """Safely clears all historical scan records when explicit confirm: true is provided."""
    if not request.confirm:
        raise HTTPException(
            status_code=400,
            detail="Confirmation required. Must submit 'confirm: true' to clear history."
        )
    deleted_count = clear_scan_history(db)
    return {
        "status": "success",
        "message": f"Successfully cleared {deleted_count} scan records.",
        "deleted_count": deleted_count
    }


@router.get("/analytics", response_model=DashboardStats)
def get_analytics_endpoint(db: Session = Depends(get_db)):
    """Computes real-time dashboard analytics directly from stored SQLite database scans."""
    bundle = get_model()
    is_active = bundle is not None
    return get_dashboard_analytics(db, is_active)


@router.get("/model/info", response_model=ModelInfo)
def get_model_info_endpoint():
    """Returns technical details and hyperparameters of the deployed model."""
    bundle = get_model()
    if bundle is None:
        return {
            "model_name": "Fallback Rule-Based Heuristic",
            "model_version": "0.9.0",
            "model_type": "Deterministic Rule Engine",
            "is_trained": False,
            "trained_at": None,
            "dataset_name": None,
            "threshold_safe": 0.35,
            "threshold_malicious": 0.65,
            "features_count": 39,
            "status": "FALLBACK"
        }

    return {
        "model_name": bundle.get("model_name", "Random Forest Classifier"),
        "model_version": bundle.get("model_version", "1.0.0"),
        "model_type": type(bundle["model"]).__name__,
        "is_trained": True,
        "trained_at": bundle.get("trained_at"),
        "dataset_name": bundle.get("dataset_name"),
        "threshold_safe": bundle.get("threshold_safe", 0.35),
        "threshold_malicious": bundle.get("threshold_malicious", 0.65),
        "features_count": len(bundle.get("feature_names", [])),
        "status": "TRAINED & LOADED"
    }


@router.get("/model/performance", response_model=ModelPerformance)
def get_model_performance_endpoint(db: Session = Depends(get_db)):
    """Returns genuine evaluation metrics from the held-out test split stored in the database."""
    bundle = get_model()
    selected_name = bundle.get("model_name", "Random Forest Classifier") if bundle else "Random Forest Classifier"

    eval_record = db.query(ModelEvaluations).filter(
        ModelEvaluations.model_name == selected_name
    ).first()

    if not eval_record:
        return {
            "model_name": selected_name,
            "dataset_name": "PhishTank + Tranco Benchmark Dataset",
            "is_evaluated": False,
            "accuracy": None,
            "precision": None,
            "recall": None,
            "f1_score": None,
            "test_sample_count": 0,
            "evaluation_date": None,
            "comparison": None,
            "confusion_matrix": None,
            "class_distribution": None,
            "status_message": "Model evaluation not yet available."
        }

    cm_data = None
    comparison_data = None
    class_dist = None
    if eval_record.metrics_json:
        try:
            m = json.loads(eval_record.metrics_json)
            cm_data = m.get("confusion_matrix")
            comparison_data = m.get("comparison")
            class_dist = m.get("class_distribution")
        except Exception:
            pass

    return {
        "model_name": eval_record.model_name,
        "dataset_name": eval_record.dataset_name,
        "is_evaluated": True,
        "accuracy": eval_record.accuracy,
        "precision": eval_record.precision_score,
        "recall": eval_record.recall_score,
        "f1_score": eval_record.f1_score,
        "test_sample_count": eval_record.test_sample_count,
        "evaluation_date": eval_record.evaluation_date.isoformat() if eval_record.evaluation_date else None,
        "comparison": comparison_data,
        "confusion_matrix": cm_data,
        "class_distribution": class_dist,
        "status_message": "Genuine evaluation metrics evaluated on held-out test data."
    }
