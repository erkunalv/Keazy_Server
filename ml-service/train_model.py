import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
from pymongo import MongoClient
from utils import TextExtractor, UrgencyExtractor

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/keazy")

client = MongoClient(MONGO_URI)
db = client["keazy"]
logs_col = db["query_logs"]

docs = list(logs_col.find({}, {"_id": 0, "query_text": 1, "predicted_service": 1, "urgency": 1}))
df = pd.DataFrame(docs)

if df.empty or len(df) < 10:
    print("⚠️ Not enough data in query_logs. Please collect or seed at least 10 queries before retraining.")
    raise SystemExit(1)

df = df.dropna(subset=["query_text", "predicted_service"]).copy()
urgency_map = {"high": 2, "normal": 1, "low": 0}
df["urgency_num"] = df["urgency"].map(urgency_map).fillna(1)

X_train, X_test, y_train, y_test = train_test_split(
    df[["query_text", "urgency_num"]],
    df["predicted_service"],
    test_size=0.2,
    random_state=42,
    stratify=df["predicted_service"]
)

text_pipeline = Pipeline([
    ("extract", TextExtractor()),
    ("tfidf", TfidfVectorizer())
])

combined_features = FeatureUnion([
    ("text", text_pipeline),
    ("urgency", UrgencyExtractor())
])

X_train_transformed = combined_features.fit_transform(X_train)
X_test_transformed = combined_features.transform(X_test)

pipeline = LogisticRegression(max_iter=1000)
pipeline.fit(X_train_transformed, y_train)

y_pred = pipeline.predict(X_test_transformed)
print(classification_report(y_test, y_pred))

os.makedirs("models", exist_ok=True)
joblib.dump(pipeline, "models/intent_model.pkl")
joblib.dump(combined_features, "models/vectorizer.pkl")

print("✅ Model retrained and saved under models/intent_model.pkl + models/vectorizer.pkl")
