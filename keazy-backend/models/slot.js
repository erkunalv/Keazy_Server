/**
 * @fileoverview Slot Model
 * 
 * Represents bookable time slots for service providers.
 * Tracks availability status, booking info, and lifecycle states.
 * 
 * Collections: slots (MongoDB)
 * 
 * Slot Lifecycle:
 *   available → booked → completed/cancelled/no-show
 * 
 * @module models/slot
 */

const mongoose = require('mongoose');

/**
 * Slot Schema
 * 
 * @property {ObjectId} provider_id - Reference to Provider document
 * @property {string} date - Date in YYYY-MM-DD format
 * @property {string} time - Time in HH:MM format (24-hour)
 * @property {number} duration_min - Slot duration in minutes
 * @property {string} service_name - Denormalized service type
 * @property {boolean} available - Quick filter for available slots
 * @property {string} booked_by - user_id of booking user
 * @property {Date} booked_at - Timestamp when booked
 * @property {string} booking_notes - User notes for booking
 * @property {string} status - Lifecycle status
 */
const SlotSchema = new mongoose.Schema({
  provider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  date: { type: String, required: true },       // Format: "2025-01-02"
  time: { type: String, required: true },       // Format: "10:00" (24-hour)
  duration_min: { type: Number, default: 60 },  // Default 1-hour slots
  service_name: String,                         // Denormalized for fast filtering
  available: { type: Boolean, default: true },
  // Booking metadata
  booked_by: { type: String },                  // user_id if booked
  booked_at: Date,
  booking_notes: String,
  // Lifecycle status
  status: { 
    type: String, 
    enum: ['available', 'booked', 'completed', 'cancelled', 'no-show'],
    default: 'available'
  },
  created_at: { type: Date, default: Date.now }
});

// ============================================================================
// INDEXES
// Compound indexes for common query patterns
// ============================================================================

// Provider's available slots by date (used in buildBusinessCards)
SlotSchema.index({ provider_id: 1, date: 1, available: 1 });

// Service type availability search (alternative lookup path)
SlotSchema.index({ service_name: 1, available: 1, date: 1 });

// User's bookings lookup
SlotSchema.index({ booked_by: 1, status: 1 });

/**
 * Atomically books an available slot.
 * 
 * Uses findOneAndUpdate with conditions to prevent race conditions:
 * - Slot must exist with given ID
 * - Slot must have available=true and status='available'
 * 
 * If conditions fail (slot already booked), returns null.
 * 
 * @static
 * @async
 * @param {string} slotId - Slot ObjectId
 * @param {string} userId - User identifier for booked_by
 * @param {string} [notes] - Optional booking notes
 * @returns {Promise<Object|null>} Updated slot with populated provider, or null
 * 
 * @example
 * const slot = await Slot.bookSlot('60f...', 'usr123', 'Please call before');
 * if (!slot) console.log('Slot already taken');
 */
SlotSchema.statics.bookSlot = async function(slotId, userId, notes) {
  const slot = await this.findOneAndUpdate(
    { 
      _id: slotId, 
      available: true, 
      status: 'available'  // Double-check status
    },
    { 
      available: false,
      booked_by: userId,
      booked_at: new Date(),
      booking_notes: notes,
      status: 'booked'
    },
    { new: true }  // Return updated document
  ).populate('provider_id');  // Include provider details in response
  
  return slot;
};

/**
 * Cancels a booking and restores slot availability.
 * 
 * Security: Only allows cancellation if:
 * - Slot exists with given ID
 * - Slot was booked by the requesting user
 * - Slot status is 'booked' (not completed/etc)
 * 
 * @static
 * @async
 * @param {string} slotId - Slot ObjectId
 * @param {string} userId - User identifier (must match booked_by)
 * @returns {Promise<Object|null>} Updated slot or null if unauthorized/not found
 * 
 * @example
 * const slot = await Slot.cancelBooking('60f...', 'usr123');
 * if (!slot) console.log('Cannot cancel - not your booking or already processed');
 */
SlotSchema.statics.cancelBooking = async function(slotId, userId) {
  const slot = await this.findOneAndUpdate(
    { 
      _id: slotId, 
      booked_by: userId,  // Security: must be the booking user
      status: 'booked'    // Can only cancel if currently booked
    },
    { 
      available: true,
      booked_by: null,
      booked_at: null,
      booking_notes: null,
      status: 'available'
    },
    { new: true }
  );
  
  return slot;
};

module.exports = mongoose.model('Slot', SlotSchema);
