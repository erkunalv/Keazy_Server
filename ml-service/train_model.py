import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline, FeatureUnion
import joblib
from pymongo import MongoClient
from utils import TextExtractor, UrgencyExtractor

# 🔹 Use ML_MONGO_URI first, fallback to MONGO_URI, then default to docker hostname
MONGO_URI = os.getenv("ML_MONGO_URI", os.getenv("MONGO_URI", "mongodb://mongodb:27017/keazy"))
client = MongoClient(MONGO_URI)
db = client["keazy"]
ml_logs_col = db["ml_logs"]

# 🔹 Fetch only labeled logs (assigned_service exists)
docs = list(ml_logs_col.find(
    {"assigned_service": {"$exists": True}},
    {"_id": 0, "query_text": 1, "assigned_service": 1, "urgency": 1}
))

df = pd.DataFrame(docs)

# 🔹 Require at least 10 labeled samples
if df.empty or len(df) < 10:
    print("⚠️ Not enough labeled data in ml_logs. Please seed at least 10 corrections.")
    raise SystemExit(1)

# 🔹 Clean and preprocess
df = df.dropna(subset=["query_text", "assigned_service"]).copy()
urgency_map = {"high": 2, "normal": 1, "low": 0}
df["urgency_num"] = df["urgency"].map(urgency_map).fillna(1)

X = df[["query_text", "urgency_num"]]
y = df["assigned_service"]

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
X_transformed = combined_features.fit_transform(X)
pipeline = LogisticRegression(max_iter=1000)
pipeline.fit(X_transformed, y)

print("✅ Model retrained on all labeled samples")

# 🔹 Save artifacts
os.makedirs("models", exist_ok=True)
joblib.dump(pipeline, "models/intent_model.pkl")
joblib.dump(combined_features, "models/vectorizer.pkl")
