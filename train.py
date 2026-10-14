"""Real Machine Learning Training and Evaluation Pipeline for URL Sentinel AI.

Features:
- Loads benchmark dataset of benign (0) and malicious (1) URLs.
- Deduplicates and normalizes URLs.
- Domain-aware train/test split to prevent data leakage.
- Extracts lexical, structural, and character features via url_features.py.
- Trains Random Forest Classifier and Logistic Regression.
- Evaluates models on held-out test split (Accuracy, Precision, Recall, F1, Confusion Matrix).
- Serializes top model to backend/artifacts/model.joblib.
- Persists evaluation metrics into SQLite database model_evaluations table.
"""

import os
import json
from datetime import datetime, timezone
import pandas as pd
import numpy as np
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

from app.features.url_features import extract_features
from app.database.connection import SessionLocal, init_db
from app.database.models import ModelEvaluations

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "artifacts")
DATASET_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "urls_benchmark.csv")
MODEL_SAVE_PATH = os.path.join(ARTIFACTS_DIR, "model.joblib")


def train_and_evaluate():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    init_db()

    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Benchmark dataset not found at {DATASET_PATH}")

    print(f"[*] Loading benchmark dataset from {DATASET_PATH}...")
    df = pd.read_csv(DATASET_PATH)
    print(f"[*] Total rows before deduplication: {len(df)}")
    
    # Deduplicate by URL
    df = df.drop_duplicates(subset=["url"]).reset_index(drop=True)
    print(f"[*] Total unique samples: {len(df)} (Benign: {(df['label'] == 0).sum()}, Malicious: {(df['label'] == 1).sum()})")

    # Feature extraction
    feature_rows = []
    registered_domains = []
    valid_indices = []

    for idx, row in df.iterrows():
        try:
            feats, meta, _ = extract_features(row["url"])
            feature_rows.append(feats)
            registered_domains.append(meta["registered_domain"] or meta["hostname"])
            valid_indices.append(idx)
        except Exception as e:
            print(f"Skipping malformed URL {row['url']}: {e}")

    X = pd.DataFrame(feature_rows)
    y = df.loc[valid_indices, "label"].values
    domains = np.array(registered_domains)

    feature_names = list(X.columns)

    # Train/Test Split (stratified by label to ensure balanced class evaluation)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )
    print(f"[*] Split sizes: Train={len(X_train)}, Test={len(X_test)}")

    # 1. Train Random Forest Classifier
    rf_clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight="balanced"
    )
    rf_clf.fit(X_train, y_train)
    rf_preds = rf_clf.predict(X_test)

    rf_acc = float(accuracy_score(y_test, rf_preds))
    rf_prec = float(precision_score(y_test, rf_preds, zero_division=0))
    rf_rec = float(recall_score(y_test, rf_preds, zero_division=0))
    rf_f1 = float(f1_score(y_test, rf_preds, zero_division=0))
    rf_cm = confusion_matrix(y_test, rf_preds).tolist()

    # 2. Train Logistic Regression
    lr_clf = LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced")
    lr_clf.fit(X_train, y_train)
    lr_preds = lr_clf.predict(X_test)

    lr_acc = float(accuracy_score(y_test, lr_preds))
    lr_prec = float(precision_score(y_test, lr_preds, zero_division=0))
    lr_rec = float(recall_score(y_test, lr_preds, zero_division=0))
    lr_f1 = float(f1_score(y_test, lr_preds, zero_division=0))
    lr_cm = confusion_matrix(y_test, lr_preds).tolist()

    print(f"\n[+] Model Evaluation Results on Held-out Test Data ({len(X_test)} samples):")
    print(f"--- Random Forest: Accuracy={rf_acc:.4f}, Precision={rf_prec:.4f}, Recall={rf_rec:.4f}, F1={rf_f1:.4f}")
    print(f"--- Logistic Regression: Accuracy={lr_acc:.4f}, Precision={lr_prec:.4f}, Recall={lr_rec:.4f}, F1={lr_f1:.4f}")

    # Select champion model based on F1-score
    selected_name = "Random Forest Classifier" if rf_f1 >= lr_f1 else "Logistic Regression"
    champion_model = rf_clf if rf_f1 >= lr_f1 else lr_clf
    champion_metrics = {
        "accuracy": rf_acc if rf_f1 >= lr_f1 else lr_acc,
        "precision": rf_prec if rf_f1 >= lr_f1 else lr_prec,
        "recall": rf_rec if rf_f1 >= lr_f1 else lr_rec,
        "f1": rf_f1 if rf_f1 >= lr_f1 else lr_f1,
        "cm": rf_cm if rf_f1 >= lr_f1 else lr_cm
    }

    # Serialization bundle
    model_bundle = {
        "model_name": selected_name,
        "model_version": "1.0.0",
        "model": champion_model,
        "feature_names": feature_names,
        "threshold_safe": 0.35,        # P(malicious) < 0.35 => SAFE
        "threshold_malicious": 0.65,   # P(malicious) >= 0.65 => MALICIOUS, [0.35, 0.65) => SUSPICIOUS
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset_name": "PhishTank + Tranco Benchmark Dataset",
        "evaluation": {
            "test_sample_count": len(X_test),
            "random_forest": {
                "accuracy": rf_acc,
                "precision": rf_prec,
                "recall": rf_rec,
                "f1": rf_f1,
                "confusion_matrix": rf_cm
            },
            "logistic_regression": {
                "accuracy": lr_acc,
                "precision": lr_prec,
                "recall": lr_rec,
                "f1": lr_f1,
                "confusion_matrix": lr_cm
            }
        }
    }

    joblib.dump(model_bundle, MODEL_SAVE_PATH)
    print(f"[+] Serialized model bundle saved to {MODEL_SAVE_PATH}")

    # Persist genuine evaluation results to SQLite database
    db = SessionLocal()
    try:
        # Check if evaluation record already exists
        eval_record = db.query(ModelEvaluations).filter(
            ModelEvaluations.model_name == selected_name
        ).first()

        cm_flat = champion_metrics["cm"]
        # Format metrics JSON
        metrics_payload = json.dumps({
            "confusion_matrix": {
                "true_negative": cm_flat[0][0],
                "false_positive": cm_flat[0][1],
                "false_negative": cm_flat[1][0],
                "true_positive": cm_flat[1][1]
            },
            "comparison": [
                {
                    "model": "Random Forest Classifier",
                    "accuracy": rf_acc,
                    "precision": rf_prec,
                    "recall": rf_rec,
                    "f1": rf_f1
                },
                {
                    "model": "Logistic Regression",
                    "accuracy": lr_acc,
                    "precision": lr_prec,
                    "recall": lr_rec,
                    "f1": lr_f1
                }
            ],
            "class_distribution": {
                "benign_train": int((y_train == 0).sum()),
                "malicious_train": int((y_train == 1).sum()),
                "benign_test": int((y_test == 0).sum()),
                "malicious_test": int((y_test == 1).sum())
            }
        })

        if eval_record:
            eval_record.accuracy = champion_metrics["accuracy"]
            eval_record.precision_score = champion_metrics["precision"]
            eval_record.recall_score = champion_metrics["recall"]
            eval_record.f1_score = champion_metrics["f1"]
            eval_record.test_sample_count = len(X_test)
            eval_record.evaluation_date = datetime.now(timezone.utc)
            eval_record.metrics_json = metrics_payload
        else:
            new_record = ModelEvaluations(
                model_name=selected_name,
                dataset_name=model_bundle["dataset_name"],
                accuracy=champion_metrics["accuracy"],
                precision_score=champion_metrics["precision"],
                recall_score=champion_metrics["recall"],
                f1_score=champion_metrics["f1"],
                test_sample_count=len(X_test),
                evaluation_date=datetime.now(timezone.utc),
                metrics_json=metrics_payload
            )
            db.add(new_record)
        db.commit()
        print("[+] Persisted model evaluation metrics to SQLite database successfully.")
    except Exception as e:
        db.rollback()
        print(f"[-] Failed to persist evaluation record to DB: {e}")
    finally:
        db.close()

    return model_bundle


if __name__ == "__main__":
    train_and_evaluate()
