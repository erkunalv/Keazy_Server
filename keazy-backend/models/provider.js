const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema({
  provider_id: { type: String, index: true },
  name: String,
  service: { type: String, index: true }, // electrician, plumber, etc.
  city: { type: String, index: true },
  area: String,
  lat: Number,
  lng: Number,
  verified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 }, // 0–5
  jobs_completed_30d: { type: Number, default: 0 },
  available_now: { type: Boolean, default: true },
  response_time_min: { type: Number, default: 30 },
  phone: String,
  last_active: Date
}, { timestamps: true });

module.exports = mongoose.model('Provider', ProviderSchema);
