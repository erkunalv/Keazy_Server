// keazy-backend/models/query.js
const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  query_text: { type: String, required: true },
  normalized_service: { type: String },
  location: { type: String },
  urgency: { type: String, default: "normal" },

  // matching + provenance
  matched_providers: [{ type: String }],
  source: { type: String, enum: ["rule", "ml"], default: "rule" },

  // feedback + training
  confidence: { type: Number },
  approved_for_training: { type: Boolean, default: false },
  assigned_service: { type: String },
  user_feedback: { type: String, enum: ["confirm", "reject"], default: undefined },
  feedback_at: { type: Date },

  timestamp: { type: Date, default: Date.now }
}, { strict: true });

module.exports = mongoose.model('Query', querySchema);
