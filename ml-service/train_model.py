import os
import sys
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline, FeatureUnion
import joblib
from pymongo import MongoClient
from utils import TextExtractor, UrgencyExtractor

# Force unbuffered output
sys.stdout.flush()

# 🔹 Use ML_MONGO_URI first, fallback to MONGO_URI, then default to docker hostname
try:
    print("🚀 Starting train_model.py execution", flush=True)
    MONGO_URI = os.getenv("ML_MONGO_URI", os.getenv("MONGO_URI", "mongodb://mongodb:27017/keazy"))
    print(f"📍 Connecting to MongoDB at {MONGO_URI}", flush=True)
    client = MongoClient(MONGO_URI)
    db = client["keazy"]
    query_logs_col = db["queries"]  # Mongoose auto-pluralizes Query model to 'queries'
    corrections_col = db["corrections"]

    # 🔹 Fetch approved logs for training
    docs = list(query_logs_col.find(
        {"approved_for_training": True},
        {"_id": 0, "query_text": 1, "normalized_service": 1, "assigned_service": 1, "urgency": 1}
    ))

    print(f"📊 Found {len(docs)} approved documents in queries collection", flush=True)

    # 🔹 Fetch corrections (user-corrected predictions)
    corrections = list(corrections_col.find(
        {},
        {"_id": 0, "query_text": 1, "corrected_service": 1, "confidence": 1}
    ))
    
    # Transform corrections into training format
    corrections_docs = [
        {
            "query_text": c["query_text"],
            "normalized_service": None,
            "assigned_service": c["corrected_service"],
            "urgency": "normal"  # Default urgency for corrections
        }
        for c in corrections
    ]
    
    print(f"📊 Found {len(corrections)} corrections in corrections collection", flush=True)
    
    # 🔹 Merge approved logs and corrections
    docs.extend(corrections_docs)
    print(f"📊 Total training documents (approved + corrections): {len(docs)}", flush=True)

    if not docs:
        print("⚠️ No approved training data found. Please approve logs before retraining.", flush=True)
        raise SystemExit(1)

    df = pd.DataFrame(docs)
    print(f"📋 DataFrame columns: {df.columns.tolist()}", flush=True)
    print(f"📋 DataFrame shape: {df.shape}", flush=True)
    if len(df) > 0:
        print(f"📋 First row: {df.iloc[0].to_dict()}", flush=True)

    # 🔹 Use assigned_service if available, otherwise use normalized_service
    df["service_label"] = df["assigned_service"].fillna(df["normalized_service"])
    df = df[df["service_label"].notna()]

    print(f"📋 After service_label creation: {len(df)} rows with service labels", flush=True)

    # 🔹 Require at least 1 labeled sample
    if df.empty:
        print("⚠️ Not enough labeled data. Please approve logs with valid services.", flush=True)
        raise SystemExit(1)

    # 🔹 Clean and preprocess
    df = df.dropna(subset=["query_text", "service_label"]).copy()
    print(f"📋 After dropping NaN: {len(df)} rows", flush=True)
    
    urgency_map = {"high": 2, "normal": 1, "low": 0}
    df["urgency_num"] = df["urgency"].map(urgency_map).fillna(1)

    print(f"📊 Training on {len(df)} approved logs + corrections", flush=True)

    X = df[["query_text", "urgency_num"]]
    y = df["service_label"]

    # 🔹 Text + urgency feature pipelines
    text_pipeline = Pipeline([
        ("extract", TextExtractor()),
        ("tfidf", TfidfVectorizer())
    ])

    combined_features = FeatureUnion([
        ("text", text_pipeline),
        ("urgency", UrgencyExtractor())
    ])

    # 🔹 Train logistic regression on all labeled data
    print("🔧 Transforming features...", flush=True)
    X_transformed = combined_features.fit_transform(X)
    print(f"✍️ Training model on {X_transformed.shape[0]} samples...", flush=True)
    pipeline = LogisticRegression(max_iter=1000)
    pipeline.fit(X_transformed, y)

    print("✅ Model retrained on all labeled samples (approved + corrections)", flush=True)

    # 🔹 Save artifacts
    os.makedirs("models", exist_ok=True)
    joblib.dump(pipeline, "models/intent_model.pkl")
    joblib.dump(combined_features, "models/vectorizer.pkl")
    print("💾 Model artifacts saved successfully", flush=True)

except Exception as e:
    print(f"❌ Error in train_model.py: {str(e)}", flush=True)
    import traceback
    traceback.print_exc()
    raise SystemExit(1)
