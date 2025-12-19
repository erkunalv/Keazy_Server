const express = require("express");
const router = express.Router();
const { normalizeService } = require("../services/entities");
const { detectUrgency } = require("../services/urgency");
const { predictService } = require("../services/intentModel");
const Query = require("../models/query");
const Provider = require("../models/provider");

router.post("/query", async (req, res) => {
  const { user_id, query_text, location } = req.body;

  // Step 1: Rule-based normalization
  let service = normalizeService(query_text);
  let source = "rule";

  // Step 2: ML fallback if rule fails
  if (!service) {
    const urgency = detectUrgency(query_text);
    service = await predictService(query_text, urgency);
    source = "ml";
  }

  if (!service) {
    return res.status(400).json({ error: "Could not detect service" });
  }

  // Step 3: Match providers
  const providers = await Provider.find({ service, city: location }).lean();

  // Step 4: Log query
  await Query.create({
    user_id,
    query_text,
    normalized_service: service,
    location,
    urgency: detectUrgency(query_text),
    matched_providers: providers.map(p => p._id),
    source
  });

  res.json({ service, providers });
});

module.exports = router;