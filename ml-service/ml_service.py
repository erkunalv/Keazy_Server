from flask import Flask, request, jsonify
import joblib
import pandas as pd
from utils import identity_func

# Load the trained model
model = joblib.load("keazy_intent_model.joblib")

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)

        # Expecting JSON like: {"query_text": "fix shoes", "urgency": "high"}
        query_text = data.get("query_text", "")
        urgency = data.get("urgency", "normal")

        # Map urgency to numeric
        urgency_map = {"high": 2, "normal": 1, "low": 0}
        urgency_num = urgency_map.get(urgency, 1)

        # Build dataframe for prediction
        X = pd.DataFrame([{"query_text": query_text, "urgency_num": urgency_num}])

        # Predict
        prediction = model.predict(X)[0]
        confidence = max(model.predict_proba(X)[0])

        return jsonify({
            "predicted_service": prediction,
            "confidence": float(confidence)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)