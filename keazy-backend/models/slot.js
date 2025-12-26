// models/slot.js
const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  service_name: String,
  available: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Slot', SlotSchema);
