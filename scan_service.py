"""Database Scan Service for URL Sentinel AI.

Handles database transactions for:
- Saving scan results and features in SQLite.
- Querying scan history with pagination, search, and filters.
- Generating aggregated dashboard metrics from real stored records.
- Clearing history safely.
"""

import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func

from app.database.models import ScanHistory, URLFeatures, ModelEvaluations


def save_scan_result(db: Session, result_data: Dict[str, Any]) -> ScanHistory:
    """Saves a completed URL scan and its extracted features within a single transaction."""
    scan = ScanHistory(
        original_url=result_data["original_url"],
        normalized_url=result_data["normalized_url"],
        classification=result_data["classification"],
        risk_score=result_data["risk_score"],
        model_name=result_data["model_name"],
        model_version=result_data["model_version"],
        prediction_status=result_data["prediction_status"],
        scanned_at=datetime.now(timezone.utc),
        explanation=result_data["explanation"]
    )
    db.add(scan)
    db.flush()  # Populates scan.id

    feats = result_data["features"]
    url_features = URLFeatures(
        scan_id=scan.id,
        url_length=feats["url_length"],
        hostname_length=feats["hostname_length"],
        number_of_dots=feats["number_of_dots"],
        number_of_subdomains=feats["number_of_subdomains"],
        https_used=feats["https_used"],
        ip_address_hostname=feats["ip_address_hostname"],
        suspicious_keyword_count=feats["suspicious_keyword_count"],
        special_character_count=feats["special_character_count"],
        detected_indicators=json.dumps(feats["detected_indicators"])
    )
    db.add(url_features)
    db.commit()
    db.refresh(scan)
    return scan


def get_scan_history(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: Optional[str] = None,
    classification: Optional[str] = None,
    sort_by: str = "scanned_at",
    order: str = "desc"
) -> Dict[str, Any]:
    """Retrieves paginated scan history with filtering, searching, and sorting."""
    query = db.query(ScanHistory)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (ScanHistory.original_url.ilike(search_filter)) |
            (ScanHistory.normalized_url.ilike(search_filter))
        )

    if classification and classification.upper() in ("SAFE", "SUSPICIOUS", "MALICIOUS"):
        query = query.filter(ScanHistory.classification == classification.upper())

    # Sorting
    sort_column = ScanHistory.scanned_at
    if sort_by == "risk_score":
        sort_column = ScanHistory.risk_score
    elif sort_by == "classification":
        sort_column = ScanHistory.classification

    if order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    total = query.count()
    offset = (page - 1) * page_size
    records = query.offset(offset).limit(page_size).all()

    items = []
    for r in records:
        indicators = []
        if r.features and r.features.detected_indicators:
            try:
                indicators = json.loads(r.features.detected_indicators)
            except Exception:
                indicators = []

        items.append({
            "id": r.id,
            "original_url": r.original_url,
            "normalized_url": r.normalized_url,
            "classification": r.classification,
            "risk_score": r.risk_score,
            "model_name": r.model_name,
            "model_version": r.model_version,
            "prediction_status": r.prediction_status,
            "scanned_at": r.scanned_at,
            "explanation": r.explanation,
            "detected_indicators": indicators
        })

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "items": items
    }


def get_scan_by_id(db: Session, scan_id: int) -> Optional[ScanHistory]:
    """Retrieves a single scan record with its extracted features."""
    return db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()


def clear_scan_history(db: Session) -> int:
    """Safely truncates scan history and cascading url_features."""
    count = db.query(ScanHistory).count()
    db.query(ScanHistory).delete()
    db.commit()
    return count


def get_dashboard_analytics(db: Session, model_active: bool) -> Dict[str, Any]:
    """
    Calculates statistics directly from actual stored scan records.
    For a fresh database, counts will be accurately zero.
    """
    total_urls = db.query(ScanHistory).count()
    safe_urls = db.query(ScanHistory).filter(ScanHistory.classification == "SAFE").count()
    suspicious_urls = db.query(ScanHistory).filter(ScanHistory.classification == "SUSPICIOUS").count()
    malicious_urls = db.query(ScanHistory).filter(ScanHistory.classification == "MALICIOUS").count()

    avg_risk = db.query(func.avg(ScanHistory.risk_score)).scalar()
    average_risk_score = round(float(avg_risk), 1) if avg_risk is not None else 0.0

    # 5 most recent scans
    recent_records = db.query(ScanHistory).order_by(desc(ScanHistory.scanned_at)).limit(5).all()
    recent_scans = []
    for r in recent_records:
        indicators = []
        if r.features and r.features.detected_indicators:
            try:
                indicators = json.loads(r.features.detected_indicators)
            except Exception:
                indicators = []
        recent_scans.append({
            "id": r.id,
            "original_url": r.original_url,
            "normalized_url": r.normalized_url,
            "classification": r.classification,
            "risk_score": r.risk_score,
            "model_name": r.model_name,
            "model_version": r.model_version,
            "prediction_status": r.prediction_status,
            "scanned_at": r.scanned_at,
            "explanation": r.explanation,
            "detected_indicators": indicators
        })

    # Recent activity timeline (aggregates by day or last few scans)
    recent_activity = []
    for r in recent_records:
        recent_activity.append({
            "timestamp": r.scanned_at.strftime("%H:%M:%S"),
            "url": r.normalized_url[:30] + "..." if len(r.normalized_url) > 30 else r.normalized_url,
            "classification": r.classification,
            "risk_score": r.risk_score
        })

    return {
        "total_urls": total_urls,
        "safe_urls": safe_urls,
        "suspicious_urls": suspicious_urls,
        "malicious_urls": malicious_urls,
        "average_risk_score": average_risk_score,
        "model_status": "ONLINE (Trained Model Loaded)" if model_active else "FALLBACK (Rule-Based)",
        "backend_status": "CONNECTED",
        "class_distribution": {
            "SAFE": safe_urls,
            "SUSPICIOUS": suspicious_urls,
            "MALICIOUS": malicious_urls
        },
        "recent_activity": recent_activity,
        "recent_scans": recent_scans
    }
