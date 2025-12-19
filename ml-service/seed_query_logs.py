from pymongo import MongoClient
from datetime import datetime, UTC

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017")
db = client["keazy"]
logs = db["query_logs"]

# Expanded sample queries (≥3 per class)
sample_data = [
    # Cobbler
    {"query_text": "fix shoes", "urgency": "high", "predicted_service": "cobbler", "confidence": 0.82, "created_at": datetime.now(UTC), "approved_for_training": True},
    {"query_text": "repair sandals", "urgency": "normal", "predicted_service": "cobbler", "confidence": 0.79, "created_at": datetime.now(UTC), "approved_for_training": True},
    {"query_text": "stitch torn leather shoe", "urgency": "low", "predicted_service": "cobbler", "confidence": 0.85, "created_at": datetime.now(UTC), "approved_for_training": True},

    # Plumber
    {"query_text": "install tap", "urgency": "normal", "predicted_service": "plumber", "confidence": 0.76, "created_at": datetime.now(UTC), "approved_for_training": True},
    {"query_text": "fix leaking pipe", "urgency": "high", "predicted_service": "plumber", "confidence": 0.88, "created_at": datetime.now(UTC), "approved_for_training": True},
    {"query_text": "unclog kitchen sink", "urgency": "normal", "predicted_service": "plumber", "confidence": 0.81, "created_at": datetime.now(UTC), "approved_for_training": True},

    # Electrician
    {"query_text": "repair wiring", "urgency": "high", "predicted_service": "electrician", "confidence": 0.88, "created_at": datetime.now(UTC), "approved_for_training": True},
    {"query_text": "install ceiling fan", "urgency": "normal", "predicted_service": "electrician", "confidence": 0.83, "created_at": datetime.now(UTC), "approved_for_training": True},
    {"query_text": "fix power socket", "urgency": "low", "predicted_service": "electrician", "confidence": 0.80, "created_at": datetime.now(UTC), "approved_for_training": True},

    # Pharmacy
    {"query_text": "buy medicine", "urgency": "low", "predicted_service": "pharmacy", "confidence": 0.91, "created_at": datetime.now(UTC), "approved_for_training": True},
    {"query_text": "get cough syrup", "urgency": "normal", "predicted_service": "pharmacy", "confidence": 0.87, "created_at": datetime.now(UTC), "approved_for_training": True},
    {"query_text": "purchase painkillers", "urgency": "high", "predicted_service": "pharmacy", "confidence": 0.89, "created_at": datetime.now(UTC), "approved_for_training": True}
]

# Insert into query_logs
logs.insert_many(sample_data)
print("✅ Seeded query_logs with expanded sample data")