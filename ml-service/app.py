from flask import Flask, request, jsonify
import joblib
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

# -----------------------------
# 1. Re‑define custom transformers
# -----------------------------
class TextExtractor(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None): 
        return self
    def transform(self, X): 
        return X["query_text"].values

class UrgencyExtractor(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None): 
        return self
    def transform(self, X): 
        return X[["urgency_num"]].values

# -----------------------------
# 2. Load model + vectorizer
# -----------------------------
model = joblib.load("intent_model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

# -----------------------------
# 3. Flask app setup
# -----------------------------
app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        query_text = data.get("query_text", "")
        urgency = data.get("urgency", "normal")

        # Convert urgency to numeric
        urgency_map = {"high": 2, "normal": 1, "low": 0}
        urgency_num = urgency_map.get(urgency, 1)

        # Build DataFrame for vectorizer
        X_input = pd.DataFrame([{
            "query_text": query_text,
            "urgency_num": urgency_num
        }])

        # Transform and predict
        X_transformed = vectorizer.transform(X_input)
        prediction = model.predict(X_transformed)[0]
        confidence = max(model.predict_proba(X_transformed)[0])

        return jsonify({
            "predicted_service": prediction,
            "confidence": float(confidence)
        })
    except Exception as e:
        # Log error for debugging
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)