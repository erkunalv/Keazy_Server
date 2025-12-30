const express = require("express");
const router = express.Router();
const { normalizeService } = require("../services/entities");
const { detectUrgency } = require("../services/urgency");
const { getIntentPrediction } = require("../services/intentModel");
const Query = require("../models/query");
const Provider = require("../models/provider");
const Slot = require("../models/slot");
const logger = require("../utils/logger"); // Winston logger

// POST /query → intake user query
router.post("/", async (req, res) => {
  try {
    logger.info("Incoming /query request", { body: req.body });

    const { user_id, query_text, location } = req.body;
    if (!query_text) {
      logger.warn("Missing query_text");
      return res.status(400).json({ error: "query_text required" });
    }
    if (!user_id) {
      logger.warn("Missing user_id");
      return res.status(400).json({ error: "user_id required" });
    }

    // Step 1: Rule-based normalization
    logger.info("Step 1: Normalizing service");
    let service = normalizeService(query_text);
    let source = "rule";

    // Step 2: ML fallback if rule fails
    if (!service) {
      logger.info("Step 2: Rule failed, falling back to ML");
      const urgency = detectUrgency(query_text);
      try {
        const mlResult = await getIntentPrediction(query_text, urgency);
        logger.info("ML result", mlResult);
        service = mlResult?.predicted_service;
        source = "ml";
      } catch (err) {
        logger.error("ML prediction failed", { error: err.message, stack: err.stack });
        return res.status(500).json({ error: "ML prediction failed" });
      }
    }

    if (!service) {
      logger.warn("No service detected");
      return res.status(400).json({ error: "Could not detect service" });
    }

    // Step 3: Match providers
    logger.info("Step 3: Looking up providers", { service, location });
    const providers = await Provider.find({ service, city: location }).lean();
    logger.info("Providers found", { count: providers.length });

    // Step 4: Log query
    logger.info("Step 4: Logging query to DB");
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
    logger.info("Query logged", { log_id: logEntry._id });

    // Step 5: Suggest slots if available
    logger.info("Step 5: Looking up slots", { service });
    const slots = await Slot.find({ service_name: service, available: true }).limit(5).lean();
    logger.info("Slots found", { count: slots.length });

    res.json({
      prediction: { service, source },
      providers,
      slots,
      log_id: logEntry._id
    });
  } catch (err) {
    logger.error("Error in /query route", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /query/feedback → user feedback on prediction
router.post("/feedback", async (req, res) => {
  try {
    logger.info("Incoming /query/feedback request", { body: req.body });
    const { log_id, feedback } = req.body;
    if (!log_id || !feedback) {
      logger.warn("Missing log_id or feedback");
      return res.status(400).json({ error: "log_id and feedback required" });
    }

    const update = { user_feedback: feedback, feedback_at: new Date() };
    const result = await Query.findByIdAndUpdate(log_id, update, { new: true });
    logger.info("Feedback saved", { log_id, updated: !!result });

    res.json({ status: "ok", log_id, feedback, updated: result ? 1 : 0 });
  } catch (err) {
    logger.error("Error saving feedback", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
