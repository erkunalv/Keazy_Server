/**
 * @fileoverview User Model
 * 
 * Represents end-users who submit queries and book services.
 * Tracks query/booking statistics and user preferences.
 * 
 * Collections: users (MongoDB)
 * 
 * Auto-creation: Users are created via upsert on first query.
 * 
 * @module models/user
 */

const mongoose = require('mongoose');

/**
 * User Schema
 * 
 * @property {string} user_id - Unique identifier (from external auth or generated)
 * @property {string} phone - Phone number for contact
 * @property {string} name - Display name
 * @property {string} city - Primary city (auto-updated on queries)
 * @property {string} area - Neighborhood/locality
 * @property {Object} preferences - User preferences
 * @property {string[]} preferences.preferred_services - Favorite service types
 * @property {string} preferences.language - Preferred language code
 * @property {number} total_queries - Lifetime query count
 * @property {number} total_bookings - Lifetime booking count
 * @property {Date} last_query_at - Timestamp of most recent query
 * @property {Date} last_booking_at - Timestamp of most recent booking
 * @property {boolean} verified - Phone/identity verification status
 * @property {boolean} active - Account active status
 */
const UserSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true, index: true },
  phone: { type: String, index: true },
  name: String,
  city: String,
  area: String,
  preferences: {
    preferred_services: [String],
    language: { type: String, default: 'hi' }
  },
  // Aggregate statistics
  total_queries: { type: Number, default: 0 },
  total_bookings: { type: Number, default: 0 },
  last_query_at: Date,
  last_booking_at: Date,
  // Account status
  verified: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, { timestamps: true });

/**
 * Records a user query and updates statistics.
 * 
 * Uses upsert to auto-create user on first query.
 * Increments total_queries counter and updates last_query_at.
 * Optionally updates city if provided.
 * 
 * @static
 * @async
 * @param {string} user_id - User identifier
 * @param {string} [city] - User's city (optional, updates if provided)
 * @returns {Promise<Object>} Updated user document
 * 
 * @example
 * const user = await User.recordQuery('usr123', 'Delhi');
 * console.log(user.total_queries); // 5
 */
UserSchema.statics.recordQuery = async function(user_id, city) {
  return this.findOneAndUpdate(
    { user_id },
    { 
      $inc: { total_queries: 1 },
      $set: { last_query_at: new Date(), city: city || undefined },
      $setOnInsert: { user_id }  // Set user_id only on insert
    },
    { upsert: true, new: true }  // Create if not exists, return updated doc
  );
};

/**
 * Records a booking and updates statistics.
 * 
 * Increments total_bookings counter and updates last_booking_at.
 * Should be called after successful slot booking.
 * 
 * @static
 * @async
 * @param {string} user_id - User identifier
 * @returns {Promise<Object>} Updated user document
 * 
 * @example
 * const user = await User.recordBooking('usr123');
 * console.log(user.total_bookings); // 2
 */
UserSchema.statics.recordBooking = async function(user_id) {
  return this.findOneAndUpdate(
    { user_id },
    { 
      $inc: { total_bookings: 1 },
      $set: { last_booking_at: new Date() }
    },
    { new: true }
  );
};

module.exports = mongoose.model('User', UserSchema);
