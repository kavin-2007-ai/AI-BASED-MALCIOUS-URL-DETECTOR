from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict


class ScanRequest(BaseModel):
    url: str = Field(..., max_length=2048, description="URL string to analyze")

    @field_validator("url")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("URL cannot be empty or only whitespace.")
        if len(trimmed) > 2048:
            raise ValueError("URL exceeds maximum permitted length of 2048 characters.")
        return trimmed


class URLFeatureDetail(BaseModel):
    url_length: int
    hostname_length: int
    number_of_dots: int
    number_of_subdomains: int
    https_used: bool
    ip_address_hostname: bool
    suspicious_keyword_count: int
    special_character_count: int
    detected_indicators: List[str]


class IndicatorDetail(BaseModel):
    code: str
    title: str
    description: str
    severity: str  # LOW, MEDIUM, HIGH


class ScanResponse(BaseModel):
    id: Optional[int] = None
    original_url: str
    normalized_url: str
    classification: str  # SAFE, SUSPICIOUS, MALICIOUS
    risk_score: int       # 0 to 100
    model_name: str
    model_version: str
    prediction_status: str  # ML_PREDICTION or FALLBACK_ANALYSIS
    scanned_at: datetime
    explanation: str
    recommendation: str
    scheme: str
    hostname: str
    registered_domain: str
    subdomain: Optional[str] = None
    port: Optional[int] = None
    path: str
    query_params_count: int
    features: URLFeatureDetail
    indicators: List[IndicatorDetail]
    probabilities: Optional[Dict[str, float]] = None


from pydantic import BaseModel, Field, field_validator, ConfigDict


class ScanHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_url: str
    normalized_url: str
    classification: str
    risk_score: int
    model_name: str
    model_version: str
    prediction_status: str
    scanned_at: datetime
    explanation: str
    detected_indicators: List[str]


class HistoryListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[ScanHistoryItem]


class ClearHistoryRequest(BaseModel):
    confirm: bool = Field(..., description="Must be true to execute clear operation")


class DashboardStats(BaseModel):
    total_urls: int
    safe_urls: int
    suspicious_urls: int
    malicious_urls: int
    average_risk_score: float
    model_status: str
    backend_status: str
    class_distribution: Dict[str, int]
    recent_activity: List[Dict[str, Any]]
    recent_scans: List[ScanHistoryItem]


class ModelInfo(BaseModel):
    model_name: str
    model_version: str
    model_type: str
    is_trained: bool
    trained_at: Optional[str] = None
    dataset_name: Optional[str] = None
    threshold_safe: float
    threshold_malicious: float
    features_count: int
    status: str


class ConfusionMatrix(BaseModel):
    true_negative: int
    false_positive: int
    false_negative: int
    true_positive: int


class ModelPerformance(BaseModel):
    model_name: str
    dataset_name: str
    is_evaluated: bool
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    test_sample_count: int
    evaluation_date: Optional[str] = None
    comparison: Optional[List[Dict[str, Any]]] = None
    confusion_matrix: Optional[ConfusionMatrix] = None
    class_distribution: Optional[Dict[str, int]] = None
    status_message: str
