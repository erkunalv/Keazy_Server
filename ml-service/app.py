"""
ML Service - Flask API for Service Classification

This service provides machine learning-based service prediction as a fallback
when rule-based matching fails. It uses:
- TF-IDF vectorization for text feature extraction
- LogisticRegression with balanced class weights for classification

Endpoints:
    GET  /health   - Health check and model status
    POST /predict  - Service prediction from query text
    POST /retrain  - Trigger model retraining from approved logs
    GET  /metrics  - Prometheus metrics endpoint

Environment Variables:
    ML_PORT       - Server port (default: 5000)
    ML_MONGO_URI  - MongoDB connection string
    ML_API_KEY    - API key for authentication (optional)
    ML_CORS_ORIGIN - CORS allowed origins (default: *)

Model Artifacts:
    models/intent_model.pkl - Trained LogisticRegression model
    models/vectorizer.pkl   - Fitted TF-IDF + ColumnTransformer pipeline
"""

import os
import time
from datetime import datetime, UTC

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import joblib
import pandas as pd
from pymongo import MongoClient
from utils import TextExtractor, UrgencyExtractor

# ============================================================================
# CONFIGURATION
# Load environment variables and set up service parameters
# ============================================================================

load_dotenv()
PORT = int(os.getenv("ML_PORT", "5000"))
MONGO_URI = os.getenv("ML_MONGO_URI", "mongodb://localhost:27017/keazy")
API_KEY = os.getenv("ML_API_KEY", "")
CORS_ORIGIN = os.getenv("ML_CORS_ORIGIN", "*")

# ============================================================================
# FLASK APP SETUP
# ============================================================================

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": CORS_ORIGIN}})

# ============================================================================
# DATABASE CONNECTION
# MongoDB client for prediction logging
# ============================================================================

mongo_client = MongoClient(MONGO_URI)
db = mongo_client["keazy"]
logs_col = db["query_logs"]      # Legacy query logs
ml_logs_col = db["ml_logs"]      # ML prediction audit logs

# ============================================================================
# MODEL ARTIFACTS
# Global model and vectorizer loaded on startup
# ============================================================================

MODEL_PATH = "models/intent_model.pkl"
VECT_PATH = "models/vectorizer.pkl"
model, vectorizer = None, None


def load_artifacts():
    """
    Loads ML model artifacts from disk into memory.
    
    Files Required:
        - models/intent_model.pkl: Trained LogisticRegression classifier
        - models/vectorizer.pkl: Fitted ColumnTransformer with TF-IDF
    
    Raises:
        FileNotFoundError: If model files don't exist (run train_model.py first)
    
    Side Effects:
        Updates global 'model' and 'vectorizer' variables
    """
    global model, vectorizer
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECT_PATH):
        raise FileNotFoundError("Model artifacts not found in models/. Run train_model.py first.")
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECT_PATH)


# Load artifacts on module import
load_artifacts()


# ============================================================================
# AUTHENTICATION
# ============================================================================

def check_api_key(req):
    """
    Validates API key from request header.
    
    Args:
        req: Flask request object
        
    Returns:
        bool: True if API key matches or no key configured, False otherwise
    """
    key = req.headers.get("X-API-Key", "")
    return API_KEY and key == API_KEY


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route("/health", methods=["GET"])
def health():
    """
    Health check endpoint for container orchestration.
    
    Returns:
        JSON: {status: "ok", model_loaded: bool}
    """
    return jsonify({"status": "ok", "model_loaded": model is not None}), 200


@app.route("/predict", methods=["POST"])
def predict():
    """
    Service prediction endpoint.
    
    Request Body:
        {
            "query_text": str,      # Natural language query (required)
            "urgency": str,         # "low", "normal", or "high" (optional)
            "user_id": str          # For audit logging (optional)
        }
    
    Returns:
        JSON: {
            "predicted_service": str,  # Service category (e.g., "electrician")
            "confidence": float        # Prediction probability (0-1)
        }
    
    Pipeline:
        1. Extract query text and urgency from request
        2. Convert urgency to numeric (low=0, normal=1, high=2)
        3. Build DataFrame with features
        4. Transform using fitted vectorizer (TF-IDF)
        5. Predict using LogisticRegression
        6. Log prediction to MongoDB (non-blocking)
        7. Return predicted service and confidence
    
    Authentication:
        Requires X-API-Key header if ML_API_KEY is configured
    """
    try:
        # Authentication check
        if API_KEY and not check_api_key(request):
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json(force=True)
        query_text = data.get("query_text", "").strip()
        urgency = data.get("urgency", "normal")
        user_id = data.get("user_id", "")

        if not query_text:
            return jsonify({"error": "query_text is required"}), 400

        # Convert urgency string to numeric for model input
        urgency_map = {"high": 2, "normal": 1, "low": 0}
        urgency_num = urgency_map.get(urgency, 1)

        # Prepare input DataFrame (must match training schema)
        X_input = pd.DataFrame([{
            "query_text": query_text,
            "urgency_num": urgency_num
        }])

        # Measure inference latency
        start_time = time.time()

        # Transform text features and predict
        X_transformed = vectorizer.transform(X_input)
        prediction = model.predict(X_transformed)[0]
        proba = model.predict_proba(X_transformed)[0]
        confidence = float(max(proba))

        # Calculate latency
        end_time = time.time()
        latency_ms = int((end_time - start_time) * 1000)

        # Audit logging (non-blocking - failures don't affect response)
        try:
            ml_logs_col.insert_one({
                "user_id": user_id,
                "query_text": query_text,
                "predicted_service": prediction,
                "confidence": confidence,
                "latency_ms": latency_ms,
                "timestamp": datetime.now(UTC)
            })
        except Exception as log_error:
            import traceback
            traceback.print_exc()
            # Continue - prediction response takes priority over logging

        return jsonify({
            "predicted_service": prediction,
            "confidence": confidence
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Prediction failed"}), 500


@app.route("/retrain", methods=["POST"])
def retrain():
    """
    Triggers model retraining from approved query logs.
    
    Training Flow:
        1. Count approved logs in 'queries' collection
        2. If count > 0, import and execute train_model_v2
        3. Hot-reload model artifacts after training
        4. Return training statistics
    
    Query Selection:
        Only logs with approved_for_training=True are used.
        Admins approve logs via dashboard after verifying service labels.
    
    Returns:
        JSON: {
            "status": "retrained",
            "model_loaded": bool,
            "logs_used": int
        }
    
    Errors:
        400: No approved logs to train on
        500: Training pipeline failure
    
    Note:
        This is a synchronous operation that blocks until training completes.
        For large datasets, consider implementing async training with status polling.
    """
    try:
        if API_KEY and not check_api_key(request):
            return jsonify({"error": "Unauthorized"}), 401

        print("🔄 Retrain endpoint called", flush=True)
        
        # Pre-flight check: verify approved logs exist
        from pymongo import MongoClient
        import os
        mongo_uri = os.getenv("ML_MONGO_URI", "mongodb://mongodb:27017/keazy")
        temp_client = MongoClient(mongo_uri)
        temp_db = temp_client["keazy"]
        
        # Note: Collection is 'queries' (Mongoose pluralizes 'query' model)
        approved_count = temp_db["queries"].count_documents({"approved_for_training": True})
        print(f"📊 Found {approved_count} approved logs in database", flush=True)
        
        if approved_count == 0:
            print("⚠️ No approved logs found", flush=True)
            return jsonify({"error": "No approved logs to train on", "approved_count": 0}), 400
        
        # Execute training script (saves new artifacts)
        print("📥 Importing train_model_v2 module...", flush=True)
        import train_model_v2
        
        # Hot-reload newly trained model
        print("✅ Training completed, reloading artifacts", flush=True)
        load_artifacts()
        print("🎯 Model artifacts reloaded successfully", flush=True)
        
        return jsonify({
            "status": "retrained",
            "model_loaded": True,
            "logs_used": approved_count
        }), 200
        
    except SystemExit as se:
        # train_model_v2 may call sys.exit() on validation failures
        print(f"⚠️ SystemExit: {str(se)}", flush=True)
        return jsonify({"error": "Training failed", "details": str(se)}), 400
    except Exception as e:
        print(f"❌ Retrain failed: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Retrain failed", "details": str(e)}), 500


# ============================================================================
# PROMETHEUS METRICS
# ============================================================================

from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from flask import Response


@app.route("/metrics")
def metrics():
    """
    Prometheus metrics endpoint for observability.
    
    Returns:
        Response: Prometheus-formatted metrics text
    """
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
