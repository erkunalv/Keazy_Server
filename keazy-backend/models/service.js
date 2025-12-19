const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  service_id: { type: String, index: true },
  name: { type: String, index: true }, // electrician, plumber, ...
  synonyms: [String],
  tags: [String],
  base_price_hint: Number,
  enabled: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Service', ServiceSchema);
