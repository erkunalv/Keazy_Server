const express = require("express");
const router = express.Router();
const { normalizeService } = require("../services/entities");
const { detectUrgency } = require("../services/urgency");
const { getIntentPrediction } = require("../services/intentModel");
const Query = require("../models/query");
const Provider = require("../models/provider");
const Slot = require("../models/slot");

// POST /query → intake user query
router.post("/", async (req, res) => {
  try {
    const { user_id, query_text, location } = req.body;
    if (!query_text) return res.status(400).json({ error: "query_text required" });

    // Step 1: Rule-based normalization
    let service = normalizeService(query_text);
    let source = "rule";

    // Step 2: ML fallback if rule fails
    if (!service) {
      const urgency = detectUrgency(query_text);
      const mlResult = await getIntentPrediction(query_text, urgency);
      service = mlResult.predicted_service;
      source = "ml";
    }

    if (!service) {
      return res.status(400).json({ error: "Could not detect service" });
    }

    // Step 3: Match providers
    const providers = await Provider.find({ service, city: location }).lean();

    // Step 4: Log query
    const logEntry = await Query.create({
      user_id,
      query_text,
      normalized_service: service,
      location,
      urgency: detectUrgency(query_text),
      matched_providers: providers.map(p => p._id),
      source,
      timestamp: new Date()
    });

    // Step 5: Suggest slots if available
    const slots = await Slot.find({ service_name: service, available: true }).limit(5).lean();

    res.json({
      prediction: { service, source },
      providers,
      slots,
      log_id: logEntry._id
    });
  } catch (err) {
    console.error("Error in /query route:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /query/feedback → user feedback on prediction
router.post("/feedback", async (req, res) => {
  try {
    const { log_id, feedback } = req.body;
    if (!log_id || !feedback) return res.status(400).json({ error: "log_id and feedback required" });

    const update = { user_feedback: feedback, feedback_at: new Date() };
    const result = await Query.findByIdAndUpdate(log_id, update, { new: true });

    res.json({ status: "ok", log_id, feedback, updated: result ? 1 : 0 });
  } catch (err) {
    console.error("Error saving feedback:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
