/**
 * @fileoverview Urgency Detection Service
 * 
 * Detects urgency level from query text using keyword matching.
 * Supports both English and Hindi keywords.
 * 
 * Urgency Levels:
 *   - "high": Immediate attention needed
 *   - "normal": Standard priority (default)
 *   - "low": Can wait, scheduled for later
 * 
 * @module services/urgency
 */

/**
 * Detects urgency level from user query text.
 * 
 * Algorithm:
 * 1. Convert text to lowercase
 * 2. Check for high-urgency keywords (urgent, abhi, turant, immediately)
 * 3. Check for low-urgency keywords (kal, tomorrow, later)
 * 4. Default to "normal" if no keywords match
 * 
 * Keywords (Hindi translations):
 *   - "abhi" = now/immediately
 *   - "turant" = instantly/right away
 *   - "kal" = tomorrow
 * 
 * @param {string} queryText - User's natural language query
 * @returns {string} Urgency level: "high" | "normal" | "low"
 * 
 * @example
 * detectUrgency("I need help urgently")  // returns "high"
 * detectUrgency("Can you come tomorrow") // returns "low"
 * detectUrgency("Fix my tap")            // returns "normal"
 */
function detectUrgency(queryText) {
  const text = queryText.toLowerCase();

  // High urgency: immediate action required
  if (text.includes("urgent") || text.includes("abhi") || text.includes("turant") || text.includes("immediately")) {
    return "high";
  }
  
  // Low urgency: can be scheduled for later
  if (text.includes("kal") || text.includes("tomorrow") || text.includes("later")) {
    return "low";
  }
  
  // Default: normal priority
  return "normal";
}

module.exports = { detectUrgency };