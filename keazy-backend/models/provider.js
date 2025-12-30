const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema({
  provider_id: { type: String, index: true }, // optional external ID
  name: { type: String, required: true },
  service: { type: String, required: true },

  // Contact + pricing
  contact: { type: String },
  hourly_rate: { type: Number },
  availability: { type: String },

  // Hierarchical + city/area (seed compatibility)
  state: { type: String },
  district: { type: String },
  pincode: { type: String },
  city: { type: String },
  area: { type: String },

  // Scoring fields
  rating: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  available_now: { type: Boolean, default: true },
  response_time_min: { type: Number, default: 60 },
  jobs_completed_30d: { type: Number, default: 0 },

  // GeoJSON location (optional)
  location: {
    type: { type: String, enum: ['Point'], required: false },
    coordinates: { type: [Number], required: false } // [lng, lat]
  },
  geo_accuracy_m: { type: Number },

  updated_at: { type: Date, default: Date.now }
});

// Indexes
ProviderSchema.index({ service: 1, city: 1, area: 1 });
ProviderSchema.index({ location: '2dsphere' }, { sparse: true });

module.exports = mongoose.model('Provider', ProviderSchema);
