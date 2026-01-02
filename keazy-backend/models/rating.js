const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  provider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

// Index for quick lookups
RatingSchema.index({ provider_id: 1 });
RatingSchema.index({ booking_id: 1 });
RatingSchema.index({ created_at: -1 });

module.exports = mongoose.model('Rating', RatingSchema);
