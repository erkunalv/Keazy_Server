const express = require("express");
const router = express.Router();
const { getIntentPrediction } = require("../services/intentModel");
const { MongoClient } = require("mongodb");

// MongoDB connection
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const db = client.db("keazy");
const logs = db.collection("query_logs");

// POST /classify
router.post("/", async (req, res) => {
  try {
    const { query_text, urgency } = req.body;

    // Call ML microservice
    const mlResult = await getIntentPrediction(query_text, urgency);

    // Build log entry
    const logEntry = {
      query_text,
      urgency,
      predicted_service: mlResult.predicted_service,
      confidence: mlResult.confidence,
      created_at: new Date()
    };

    // Save to MongoDB
    await logs.insertOne(logEntry);

    // Respond to client
    res.json(logEntry);
  } catch (err) {
    console.error("Error in /classify route:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;