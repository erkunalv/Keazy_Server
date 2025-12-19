const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['query', 'view', 'book', 'cancel', 'complete', 'rating'] 
  },
  user_id: String,
  provider_id: String,
  job_id: String,
  metadata: Object
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
