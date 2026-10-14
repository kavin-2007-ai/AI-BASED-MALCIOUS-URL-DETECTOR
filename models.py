"""SQLAlchemy ORM Models for URL Sentinel AI.

Tables:
1. SCAN_HISTORY
2. URL_FEATURES
3. MODEL_EVALUATIONS
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .connection import Base


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    original_url = Column(String(2048), nullable=False)
    normalized_url = Column(String(2048), nullable=False, index=True)
    classification = Column(String(32), nullable=False, index=True)  # SAFE, SUSPICIOUS, MALICIOUS
    risk_score = Column(Integer, nullable=False)                     # 0 to 100
    model_name = Column(String(64), nullable=False)
    model_version = Column(String(32), nullable=False)
    prediction_status = Column(String(64), nullable=False)           # ML_PREDICTION or FALLBACK_ANALYSIS
    scanned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    explanation = Column(Text, nullable=False)

    # One-to-one relationship with URLFeatures
    features = relationship("URLFeatures", back_populates="scan", uselist=False, cascade="all, delete-orphan")


class URLFeatures(Base):
    __tablename__ = "url_features"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scan_id = Column(Integer, ForeignKey("scan_history.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    url_length = Column(Integer, nullable=False)
    hostname_length = Column(Integer, nullable=False)
    number_of_dots = Column(Integer, nullable=False)
    number_of_subdomains = Column(Integer, nullable=False)
    https_used = Column(Boolean, nullable=False)
    ip_address_hostname = Column(Boolean, nullable=False)
    suspicious_keyword_count = Column(Integer, nullable=False)
    special_character_count = Column(Integer, nullable=False)
    detected_indicators = Column(Text, nullable=False)  # JSON-serialized list of detected indicators

    scan = relationship("ScanHistory", back_populates="features")


class ModelEvaluations(Base):
    __tablename__ = "model_evaluations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_name = Column(String(64), nullable=False, index=True)
    dataset_name = Column(String(128), nullable=False)
    accuracy = Column(Float, nullable=True)
    precision_score = Column(Float, nullable=True)
    recall_score = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    test_sample_count = Column(Integer, nullable=False)
    evaluation_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    metrics_json = Column(Text, nullable=True)  # Optional JSON details (confusion matrix, ROC-AUC)
