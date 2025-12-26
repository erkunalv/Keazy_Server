const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  service: { type: String, required: true },
  contact: { type: String, required: true },
  hourly_rate: { type: Number, required: true },
  availability: { type: String, required: true },

  // Hierarchical location fields
  state: { type: String, required: true },
  district: { type: String, required: true },
  pincode: { type: String, required: true },

  // GeoJSON location
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },

  geo_accuracy_m: { type: Number },
  available_now: { type: Boolean, default: true },
  updated_at: { type: Date, default: Date.now }
});

// Geospatial + hierarchical indexes
ProviderSchema.index({ location: '2dsphere', service: 1 });
ProviderSchema.index({ state: 1, district: 1, pincode: 1 });

module.exports = mongoose.model('Provider', ProviderSchema);
