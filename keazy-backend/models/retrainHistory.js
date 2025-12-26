// models/retrainHistory.js
const mongoose = require('mongoose');

const RetrainHistorySchema = new mongoose.Schema({
  status: String,
  logs_used: Number,
  retrained_at: { type: Date, default: Date.now },
  metrics: {
    accuracy: Number,
    precision: Number,
    recall: Number
  }
});

module.exports = mongoose.model('RetrainHistory', RetrainHistorySchema);
