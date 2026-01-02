/**
 * @fileoverview Service Model
 * 
 * Represents service categories (electrician, plumber, etc.) with
 * associated keyword synonyms for rule-based matching.
 * 
 * Collections: services (MongoDB)
 * 
 * @module models/service
 */

const mongoose = require('mongoose');

/**
 * Service Schema
 * 
 * @property {string} service_id - Optional external identifier
 * @property {string} name - Service category name (e.g., "electrician")
 * @property {string[]} synonyms - Keywords triggering this service (e.g., ["fan", "light", "wiring"])
 * @property {string[]} tags - Additional classification tags
 * @property {string} description - Human-readable description
 * @property {number} base_price_hint - Indicative starting price
 * @property {boolean} enabled - Whether service is active for matching
 */
const ServiceSchema = new mongoose.Schema({
  service_id: { type: String, index: true },
  name: { type: String, index: true, required: true },
  synonyms: [String],                                   // Keywords for rule-based matching
  tags: [String],
  description: String,
  base_price_hint: Number,
  enabled: { type: Boolean, default: true }
}, { timestamps: true });

/**
 * Builds synonym map for rule-based service matching.
 * 
 * Aggregates all enabled services and their synonyms into a lookup map.
 * Used by entities.js for fast keyword-based service detection.
 * 
 * @static
 * @async
 * @returns {Promise<Object<string, string[]>>} Map of {serviceName: [lowercaseKeywords]}
 * 
 * @example
 * // Returns:
 * // {
 * //   "electrician": ["fan", "light", "wiring", "switch"],
 * //   "plumber": ["tap", "pipe", "leak", "drain"]
 * // }
 */
ServiceSchema.statics.getSynonymsMap = async function() {
  // Only fetch enabled services (disabled services won't match)
  const services = await this.find({ enabled: true }).lean();
  const map = {};
  
  for (const svc of services) {
    if (svc.synonyms && svc.synonyms.length > 0) {
      // Normalize keywords to lowercase for case-insensitive matching
      map[svc.name] = svc.synonyms.map(s => s.toLowerCase());
    }
  }
  
  return map;
};

module.exports = mongoose.model('Service', ServiceSchema);
