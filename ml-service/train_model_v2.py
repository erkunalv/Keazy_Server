"""
Model Training Script (v2)

This script retrains the service classification model using approved query logs
from MongoDB. It's called by app.py's /retrain endpoint.

Training Pipeline:
    1. Connect to MongoDB and fetch approved logs
    2. Create DataFrame with query_text, urgency, and service labels
    3. Build TF-IDF + urgency feature pipeline
    4. Train LogisticRegression with balanced class weights
    5. Save model artifacts (intent_model.pkl, vectorizer.pkl)

Data Requirements:
    - Collection: keazy.queries
    - Filter: {approved_for_training: True}
    - Required fields: query_text, normalized_service or assigned_service

Model Architecture:
    - Features: TF-IDF(query_text) + urgency_num
    - Classifier: LogisticRegression with class_weight='balanced'
    - Output: Service category (electrician, plumber, etc.)

Artifacts Saved:
    - models/intent_model.pkl: Trained classifier
    - models/vectorizer.pkl: Fitted ColumnTransformer (TF-IDF + UrgencyExtractor)

Usage:
    This script is imported and executed by app.py's /retrain endpoint.
    Running directly: python train_model_v2.py
"""

import os
import sys
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline, FeatureUnion
import joblib
from pymongo import MongoClient

print("[train_model] Starting...", file=sys.stderr, flush=True)

try:
    # Import custom transformers for feature extraction
    from utils import TextExtractor, UrgencyExtractor
    print("[train_model] Imported utils successfully", file=sys.stderr, flush=True)
    
    # =========================================================================
    # DATABASE CONNECTION
    # =========================================================================
    
    MONGO_URI = os.getenv("ML_MONGO_URI", "mongodb://mongodb:27017/keazy")
    print(f"[train_model] Connecting to {MONGO_URI}", file=sys.stderr, flush=True)
    
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client["keazy"]
    
    # Note: Mongoose model 'Query' auto-pluralizes to 'queries' collection
    query_logs_col = db["queries"]
    
    # Verify MongoDB connectivity
    client.admin.command('ping')
    print("[train_model] MongoDB connection successful", file=sys.stderr, flush=True)
    
    # =========================================================================
    # DATA FETCHING
    # Fetch only admin-approved logs for training quality
    # =========================================================================
    
    docs = list(query_logs_col.find(
        {"approved_for_training": True},
        {"_id": 0, "query_text": 1, "normalized_service": 1, "assigned_service": 1, "urgency": 1}
    ))
    
    print(f"[train_model] Found {len(docs)} approved logs", file=sys.stderr, flush=True)
    
    if not docs:
        print("[train_model] No approved logs found - exiting", file=sys.stderr, flush=True)
        raise SystemExit("No approved logs")
    
    # =========================================================================
    # DATA PREPARATION
    # =========================================================================
    
    df = pd.DataFrame(docs)
    print(f"[train_model] DataFrame shape: {df.shape}", file=sys.stderr, flush=True)
    print(f"[train_model] Columns: {list(df.columns)}", file=sys.stderr, flush=True)
    
    # Create service label: prefer admin-assigned, fall back to auto-detected
    df["service_label"] = df["assigned_service"].fillna(df["normalized_service"])
    df = df[df["service_label"].notna()]
    
    print(f"[train_model] After service_label: {len(df)} rows", file=sys.stderr, flush=True)
    
    if df.empty:
        print("[train_model] No valid service labels - exiting", file=sys.stderr, flush=True)
        raise SystemExit("No valid labels")
    
    # Remove rows with missing required fields
    df = df.dropna(subset=["query_text", "service_label"]).copy()
    print(f"[train_model] After cleanup: {len(df)} rows", file=sys.stderr, flush=True)
    
    # Convert urgency to numeric feature
    # high=2 (more weight), normal=1, low=0
    urgency_map = {"high": 2, "normal": 1, "low": 0}
    df["urgency_num"] = df["urgency"].map(urgency_map).fillna(1)
    
    # Prepare features and labels
    X = df[["query_text", "urgency_num"]]
    y = df["service_label"]
    
    # =========================================================================
    # FEATURE PIPELINE
    # Combines TF-IDF text features with urgency numeric feature
    # =========================================================================
    
    print("[train_model] Building feature pipeline", file=sys.stderr, flush=True)
    
    # Text feature extraction: query_text → TF-IDF vectors
    text_pipeline = Pipeline([
        ("extract", TextExtractor()),  # Extracts query_text column
        ("tfidf", TfidfVectorizer())   # Convert to TF-IDF features
    ])
    
    # Combine text and numeric features
    combined_features = FeatureUnion([
        ("text", text_pipeline),
        ("urgency", UrgencyExtractor())  # Extracts urgency_num column
    ])
    
    # =========================================================================
    # MODEL TRAINING
    # LogisticRegression with balanced class weights handles class imbalance
    # =========================================================================
    
    print("[train_model] Training model with balanced class weights", file=sys.stderr, flush=True)
    
    # Fit feature transformers and transform data
    X_transformed = combined_features.fit_transform(X)
    
    # Train classifier with class_weight='balanced' to handle imbalance
    # This prevents model from always predicting majority class
    pipeline = LogisticRegression(max_iter=1000, class_weight='balanced')
    pipeline.fit(X_transformed, y)
    
    # =========================================================================
    # ARTIFACT PERSISTENCE
    # Save model and vectorizer for inference
    # =========================================================================
    
    print("[train_model] Saving artifacts", file=sys.stderr, flush=True)
    os.makedirs("models", exist_ok=True)
    
    # Save trained model
    joblib.dump(pipeline, "models/intent_model.pkl")
    
    # Save fitted feature transformer (needed for consistent feature extraction)
    joblib.dump(combined_features, "models/vectorizer.pkl")
    
    print("[train_model] Training completed successfully", file=sys.stderr, flush=True)
    
except Exception as e:
    print(f"[train_model] ERROR: {str(e)}", file=sys.stderr, flush=True)
    import traceback
    traceback.print_exc(file=sys.stderr)
    raise SystemExit(f"Training failed: {str(e)}")
