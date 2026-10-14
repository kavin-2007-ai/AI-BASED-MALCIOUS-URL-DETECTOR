export type ClassificationType = 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS';
export type PredictionStatus = 'ML_PREDICTION' | 'FALLBACK_ANALYSIS';

export interface URLFeatureDetail {
  url_length: number;
  hostname_length: number;
  number_of_dots: number;
  number_of_subdomains: number;
  https_used: boolean;
  ip_address_hostname: boolean;
  suspicious_keyword_count: number;
  special_character_count: number;
  detected_indicators: string[];
}

export interface IndicatorDetail {
  code: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ScanResult {
  id?: number;
  original_url: string;
  normalized_url: string;
  classification: ClassificationType;
  risk_score: number;
  model_name: string;
  model_version: string;
  prediction_status: PredictionStatus;
  scanned_at: string;
  explanation: string;
  recommendation: string;
  scheme: string;
  hostname: string;
  registered_domain: string;
  subdomain?: string;
  port?: number | null;
  path: string;
  query_params_count: number;
  features: URLFeatureDetail;
  indicators: IndicatorDetail[];
  probabilities?: {
    safe: number;
    malicious: number;
  };
}

export interface ScanHistoryItem {
  id: number;
  original_url: string;
  normalized_url: string;
  classification: ClassificationType;
  risk_score: number;
  model_name: string;
  model_version: string;
  prediction_status: PredictionStatus;
  scanned_at: string;
  explanation: string;
  detected_indicators: string[];
}

export interface HistoryListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: ScanHistoryItem[];
}

export interface DashboardStats {
  total_urls: number;
  safe_urls: number;
  suspicious_urls: number;
  malicious_urls: number;
  average_risk_score: number;
  model_status: string;
  backend_status: string;
  class_distribution: {
    SAFE: number;
    SUSPICIOUS: number;
    MALICIOUS: number;
  };
  recent_activity: Array<{
    timestamp: string;
    url: string;
    classification: string;
    risk_score: number;
  }>;
  recent_scans: ScanHistoryItem[];
}

export interface ConfusionMatrix {
  true_negative: number;
  false_positive: number;
  false_negative: number;
  true_positive: number;
}

export interface ModelPerformance {
  model_name: string;
  dataset_name: string;
  is_evaluated: boolean;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
  test_sample_count: number;
  evaluation_date: string | null;
  comparison?: Array<{
    model: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
  }>;
  confusion_matrix?: ConfusionMatrix;
  class_distribution?: {
    benign_train: number;
    malicious_train: number;
    benign_test: number;
    malicious_test: number;
  };
  status_message: string;
}

export interface ModelInfo {
  model_name: string;
  model_version: string;
  model_type: string;
  is_trained: boolean;
  trained_at?: string;
  dataset_name?: string;
  threshold_safe: number;
  threshold_malicious: number;
  features_count: number;
  status: string;
}
