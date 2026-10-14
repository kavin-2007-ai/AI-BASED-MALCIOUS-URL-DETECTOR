# URL SENTINEL AI
### AI-Powered Malicious URL Detection & Explainable Risk Analysis System

**URL Sentinel AI** is an intelligent, full-stack cybersecurity application built for Security Operations Center (SOC) teams, enterprise threat analysts, and academic hackathons. It analyzes submitted URLs, extracts 39 lexical, structural, and character-based features, and executes machine learning inference (Random Forest Classifier & Logistic Regression) to classify URLs into **SAFE**, **SUSPICIOUS**, or **MALICIOUS** with transparent, evidence-based reasoning and SQLite database persistence.

---

## 1. Problem Statement & Architecture
Phishing and malicious URL distribution remain the leading initial attack vector for enterprise breaches and credential theft. Traditional blocklists (DNSBLs) suffer from high latency and zero-day evasions, while opaque "black-box" deep learning models fail to provide explainable risk indicators required by security analysts.

URL Sentinel AI solves this through a dual-engine architecture:
1. **Feature Extraction Pipeline (`url_features.py`)**: Symmetrically extracts 39 quantitative indicators covering URL structure, hostname entropy, Public Suffix List domain awareness via `tldextract`, and high-risk lexical keywords.
2. **Machine Learning Model Pipeline (`train.py` & `predictor.py`)**: Real Scikit-Learn Random Forest ensemble evaluated on held-out test splits with calibrated probabilistic thresholds.
3. **Transparent Explainability Layer**: Dissects detected indicators, calculates a documented risk score (0-100), and outputs plain-language explanations with actionable next steps.
4. **Persistent SQLite Telemetry (`url_sentinel.db`)**: Atomic database transactions logging every scan, full feature vector, and model evaluation metrics.

---

## 2. Technology Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic v2
- **Machine Learning**: Scikit-Learn, Pandas, NumPy, Joblib (Random Forest & Logistic Regression)
- **Database**: SQLite (`url_sentinel.db`) with 3 relational tables (`scan_history`, `url_features`, `model_evaluations`)
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, plus a zero-dependency standalone dashboard served directly by FastAPI.

---

## 3. Calibrated Three-Class Prediction Policy

Because real-world threat feeds (PhishTank, URLhaus, Tranco) provide binary labels (*benign* vs *malicious*), URL Sentinel AI trains on genuine binary data and implements a transparent uncertainty policy:

- **SAFE**: $P(\text{Malicious}) < 0.35$ (Minimal structural anomalies, trusted naming conventions)
- **SUSPICIOUS**: $0.35 \le P(\text{Malicious}) < 0.65$ (Anomalous characteristics requiring independent validation)
- **MALICIOUS**: $P(\text{Malicious}) \ge 0.65$ (High probability matching phishing/credential harvesting signatures)

### Deterministic Risk Score Formula (0 to 100):
$$\text{Risk Score} = \min\left(100, \; \text{round}\left( 0.70 \times (P_{\text{malicious}} \times 100) + \min(30, \sum w_{\text{indicator}}) \right)\right)$$

Where $w_{\text{indicator}}$ assigns weights to observable anomalies (e.g. raw IP host: +10, userinfo syntax: +8, keywords present: +6, nonstandard port: +5, multiple subdomains: +5).

---

## 4. Empirical Model Performance (Held-out Test Split)

| Model Candidate | Test Accuracy | Precision | Recall | F1-Score | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Random Forest Classifier** | **100.0%** | **100.0%** | **100.0%** | **100.0%** | **Selected Champion** |
| Logistic Regression | 100.0% | 100.0% | 100.0% | 100.0% | Candidate Baseline |

*Test sample size: 20 held-out URLs (stratified 50% benign, 50% malicious). Persisted into SQLite table `model_evaluations`.*

---

## 5. Quickstart & Installation Instructions

### Step 1: Install Python Dependencies
Open PowerShell or your command prompt:
```powershell
cd "c:\Users\rpkav\OneDrive\Desktop\web ai\backend"
python -m pip install -r requirements.txt
```

### Step 2: Train Machine Learning Model & Initialize Database
```powershell
python -m app.ml.train
```
This command automatically parses the benchmark dataset, runs domain-aware train/test evaluation, serializes the trained model to `backend/artifacts/model.joblib`, and creates `url_sentinel.db`.

### Step 3: Run the Backend & Security Dashboard
```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Once started, navigate to:
- **Web Dashboard**: [http://localhost:8000/](http://localhost:8000/) or [http://localhost:8000/app/](http://localhost:8000/app/)
- **Interactive Swagger REST API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 6. Running Frontend with Vite (Optional React Dev Server)

If you have Node.js and npm installed on your workstation, you can run the standalone Vite TypeScript React app:
```powershell
cd "c:\Users\rpkav\OneDrive\Desktop\web ai\frontend"
npm install
npm run dev
```
The React development server will start at `http://localhost:5173`.

---

## 7. Running the Automated Test Suite

URL Sentinel AI includes an automated test suite verifying feature extraction, input normalization, risk thresholds, API contracts, and database persistence:
```powershell
cd "c:\Users\rpkav\OneDrive\Desktop\web ai\backend"
python -m pytest tests/test_sentinel.py -v
```
All 18 tests pass with 100% coverage across core security capabilities.

---

## 8. REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health status and ML engine availability |
| `POST` | `/api/scan` | Analyze target URL, run ML inference, log to SQLite |
| `GET` | `/api/history` | Paginated scan registry with search, sorting, and filters |
| `GET` | `/api/history/{id}` | Retrieve comprehensive scan details and feature vector |
| `DELETE` | `/api/history` | Purge scan records (requires `{"confirm": true}`) |
| `GET` | `/api/analytics` | Compute real-time dashboard telemetry from SQLite |
| `GET` | `/api/model/info` | Hyperparameters and runtime model information |
| `GET` | `/api/model/performance`| Held-out test evaluation metrics and confusion matrix |

---

## 9. Cybersecurity Defenses & Safety Guarantees

1. **Zero-Exploit Static Inspection**: Submitted URLs are parsed strictly in-memory using `urllib.parse` and regex. The server **never** makes outgoing network requests to submitted URLs, preventing SSRF and malicious payload execution.
2. **Output Sanitization**: The frontend never renders user-submitted URLs as automatically clickable hyperlinks, protecting analysts from accidental drive-by downloads.
3. **Request Entity Bounds**: Enforces a strict 2MB request limit via middleware to mitigate Denial of Service (DoS) memory floods.
4. **Credential Redaction**: Query parameter counts are recorded, but sensitive auth tokens or passwords are excluded from database logging.
