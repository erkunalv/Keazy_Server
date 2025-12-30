import os
from datetime import datetime, UTC

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import joblib
import pandas as pd
from pymongo import MongoClient
from utils import TextExtractor, UrgencyExtractor

# Load environment
load_dotenv()
PORT = int(os.getenv("ML_PORT", "5000"))
MONGO_URI = os.getenv("ML_MONGO_URI", "mongodb://localhost:27017/keazy")
API_KEY = os.getenv("ML_API_KEY", "")
CORS_ORIGIN = os.getenv("ML_CORS_ORIGIN", "*")

# Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": CORS_ORIGIN}})

# Mongo connection for logging
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["keazy"]
logs_col = db["query_logs"]
ml_logs_col = db["ml_logs"]  # new collection for prediction logs

# Load model artifacts (with safety)
MODEL_PATH = "models/intent_model.pkl"
VECT_PATH = "models/vectorizer.pkl"
model, vectorizer = None, None

def load_artifacts():
    global model, vectorizer
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECT_PATH):
        raise FileNotFoundError("Model artifacts not found in models/. Run train_model.py first.")
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECT_PATH)

load_artifacts()

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None}), 200

def check_api_key(req):
    key = req.headers.get("X-API-Key", "")
    return API_KEY and key == API_KEY

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if API_KEY and not check_api_key(request):
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json(force=True)
        query_text = data.get("query_text", "").strip()
        urgency = data.get("urgency", "normal")

        if not query_text:
            return jsonify({"error": "query_text is required"}), 400

        urgency_map = {"high": 2, "normal": 1, "low": 0}
        urgency_num = urgency_map.get(urgency, 1)

        X_input = pd.DataFrame([{
            "query_text": query_text,
            "urgency_num": urgency_num
        }])

        X_transformed = vectorizer.transform(X_input)
        prediction = model.predict(X_transformed)[0]
        proba = model.predict_proba(X_transformed)[0]
        confidence = float(max(proba))

        # Log prediction
        ml_logs_col.insert_one({
            "query_text": query_text,
            "urgency": urgency,
            "predicted_service": prediction,
            "confidence": confidence,
            "created_at": datetime.now(UTC)
        })

        return jsonify({
            "predicted_service": prediction,
            "confidence": confidence
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Minimal JSON error without leaking internals
        return jsonify({"error": "Prediction failed"}), 500

@app.route("/retrain", methods=["POST"])
def retrain():
    try:
        if API_KEY and not check_api_key(request):
            return jsonify({"error": "Unauthorized"}), 401

        # Simple retrain trigger: run training, then reload artifacts
        # In production, you'd call a job/worker; here we import and run
        from train_model import client as _client  # reuse existing connection
        import train_model  # will execute and save artifacts
        load_artifacts()
        return jsonify({"status": "retrained", "model_loaded": True}), 200
    except SystemExit:
        return jsonify({"error": "Not enough data to retrain"}), 400
    except Exception:
        return jsonify({"error": "Retrain failed"}), 500

from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from flask import Response

@app.route("/metrics")
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
