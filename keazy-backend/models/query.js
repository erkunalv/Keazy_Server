const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  query_text: { type: String, required: true },
  normalized_service: { type: String },
  location: { type: String },
  urgency: { type: String, default: "normal" }, // new field
  matched_providers: [{ type: String }],
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Query', querySchema);