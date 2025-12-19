import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.base import BaseEstimator, TransformerMixin
import joblib
from pymongo import MongoClient

# -----------------------------
# 1. Connect to MongoDB
# -----------------------------
client = MongoClient("mongodb://localhost:27017")
db = client["keazy"]
logs_col = db["query_logs"]

# -----------------------------
# 2. Load query logs
# -----------------------------
docs = list(logs_col.find({}, {
    "_id": 0,
    "query_text": 1,
    "predicted_service": 1,
    "urgency": 1
}))
df = pd.DataFrame(docs)

# -----------------------------
# 3. Safety check
# -----------------------------
if df.empty or len(df) < 10:
    print("⚠️ Not enough data in query_logs. Please collect or seed at least 10 queries before retraining.")
    exit()

# -----------------------------
# 4. Basic cleaning
# -----------------------------
df = df.dropna(subset=["query_text", "predicted_service"]).copy()

urgency_map = {"high": 2, "normal": 1, "low": 0}
df["urgency_num"] = df["urgency"].map(urgency_map).fillna(1)

# -----------------------------
# 5. Train/test split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    df[["query_text", "urgency_num"]],
    df["predicted_service"],
    test_size=0.2,
    random_state=42,
    stratify=df["predicted_service"]
)

# -----------------------------
# 6. Custom transformers
# -----------------------------
class TextExtractor(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None): return self
    def transform(self, X): return X["query_text"].values

class UrgencyExtractor(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None): return self
    def transform(self, X): return X[["urgency_num"]].values

# -----------------------------
# 7. Build feature union
# -----------------------------
text_pipeline = Pipeline([
    ("extract", TextExtractor()),
    ("tfidf", TfidfVectorizer())
])

combined_features = FeatureUnion([
    ("text", text_pipeline),
    ("urgency", UrgencyExtractor())
])

# -----------------------------
# 8. Transform features
# -----------------------------
X_train_transformed = combined_features.fit_transform(X_train)
X_test_transformed = combined_features.transform(X_test)

# -----------------------------
# 9. Train model
# -----------------------------
pipeline = LogisticRegression(max_iter=1000)
pipeline.fit(X_train_transformed, y_train)

# -----------------------------
# 10. Evaluate
# -----------------------------
y_pred = pipeline.predict(X_test_transformed)
print(classification_report(y_test, y_pred))

# -----------------------------
# 11. Save model + vectorizer
# -----------------------------
joblib.dump(pipeline, "intent_model.pkl")
joblib.dump(combined_features, "vectorizer.pkl")

print("✅ Model retrained and saved as intent_model.pkl + vectorizer.pkl")