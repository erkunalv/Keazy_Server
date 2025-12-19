const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  user_id: { type: String, index: true },
  phone: { type: String, index: true },
  name: String,
  city: String,
  area: String,
  preferences: Object
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
