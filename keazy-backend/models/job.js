const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  job_id: { type: String, index: true },
  user_id: { type: String, index: true },
  provider_id: { type: String, index: true },
  service: { type: String, index: true },
  city: String,
  area: String,
  status: { 
    type: String, 
    enum: ['requested', 'accepted', 'in_progress', 'completed', 'canceled'], 
    default: 'requested' 
  },
  scheduled_time: Date,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
