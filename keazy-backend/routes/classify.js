const express = require("express");
const router = express.Router();
const { getIntentPrediction } = require("../services/intentModel");
const Query = require("../models/query");

// POST /classify → classify a query using ML model
router.post("/", async (req, res) => {
  try {
    const { user_id, query_text, urgency = "normal", location } = req.body;

    if (!query_text || typeof query_text !== "string") {
      return res.status(400).json({ error: "query_text is required" });
    }
    if (!user_id || typeof user_id !== "string" || user_id.trim() === "") {
      return res.status(400).json({ error: "user_id is required and must be non-empty" });
    }

    // Call ML microservice
    const mlResult = await getIntentPrediction(query_text, urgency);

    // Build log entry
    const logEntry = {
      user_id,
      query_text,
      urgency,
      normalized_service: mlResult.predicted_service,
      confidence: mlResult.confidence,
      approved_for_training: true,
      location,
      timestamp: new Date()
    };

    // Save to MongoDB via Mongoose
    const created = await Query.create(logEntry);

    // Respond to client
    res.json({
      predicted_service: mlResult.predicted_service,
      confidence: mlResult.confidence,
      log_id: created._id
    });
  } catch (err) {
    console.error("Error in /classify route:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
