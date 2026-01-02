/**
 * @fileoverview Service Entity Matcher
 * 
 * Provides rule-based service detection using keyword synonyms.
 * Two-tier data source:
 *   1. Primary: MongoDB services collection (5-min cached)
 *   2. Fallback: JSON file (entities/synonyms.json)
 * 
 * Cache invalidation is manual via clearSynonymsCache().
 * 
 * @module services/entities
 */

const Service = require('../models/service');
const fallbackSynonyms = require('../entities/synonyms.json');

// ============================================================================
// CACHE CONFIGURATION
// In-memory cache to reduce DB queries for synonym lookups
// ============================================================================

/** @type {Object<string, string[]>|null} - Cached synonym map */
let synonymsCache = null;

/** @type {number} - Timestamp when cache was last populated */
let cacheTime = 0;

/** @constant {number} - Cache time-to-live in milliseconds (5 minutes) */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Retrieves synonym mappings with caching and fallback.
 * 
 * Data Flow:
 * 1. Check if cache is valid (within TTL)
 * 2. If valid, return cached synonyms
 * 3. If expired/empty, query MongoDB via Service.getSynonymsMap()
 * 4. If DB returns data, update cache and return
 * 5. If DB fails or empty, return fallback JSON file
 * 
 * @async
 * @returns {Promise<Object<string, string[]>>} Map of service names to keyword arrays
 * @example
 * // Returns: { "electrician": ["fan", "light", "wiring"], "plumber": ["tap", "pipe"] }
 */
async function getSynonyms() {
  const now = Date.now();
  
  // Cache hit: return cached data if still valid
  if (synonymsCache && (now - cacheTime) < CACHE_TTL) {
    return synonymsCache;
  }
  
  try {
    // Attempt to load from database (Service.getSynonymsMap aggregates enabled services)
    const dbSynonyms = await Service.getSynonymsMap();
    
    // Only use DB result if it has data
    if (Object.keys(dbSynonyms).length > 0) {
      synonymsCache = dbSynonyms;
      cacheTime = now;
      return dbSynonyms;
    }
  } catch (err) {
    console.error('Failed to load synonyms from DB, using fallback:', err.message);
  }
  
  // Fallback to static JSON file when DB unavailable or empty
  return fallbackSynonyms;
}

/**
 * Matches query text against service synonyms to detect service type.
 * 
 * Algorithm:
 * 1. Convert query to lowercase for case-insensitive matching
 * 2. Load synonyms (cached or from DB/JSON)
 * 3. Iterate through each service's keyword list
 * 4. Return first service where any keyword appears in query
 * 5. Return null if no match found (triggers ML fallback)
 * 
 * @async
 * @param {string} queryText - Natural language query from user
 * @returns {Promise<string|null>} Detected service name or null if no match
 * 
 * @example
 * // "My ceiling fan stopped working" → "electrician"
 * // "Need help with math homework" → "tutor"
 * // "Some random text" → null (triggers ML fallback)
 */
async function normalizeService(queryText) {
  const lowerQuery = queryText.toLowerCase();
  const synonyms = await getSynonyms();
  
  // Check each service's keywords for a match
  for (const [service, words] of Object.entries(synonyms)) {
    if (words.some(w => lowerQuery.includes(w))) {
      return service;
    }
  }
  
  // No rule-based match found
  return null;
}

/**
 * Invalidates the synonym cache.
 * 
 * Call this after:
 * - Creating a new service
 * - Updating service synonyms
 * - Deleting a service
 * 
 * Next getSynonyms() call will fetch fresh data from DB.
 * 
 * @returns {void}
 */
function clearSynonymsCache() {
  synonymsCache = null;
  cacheTime = 0;
}

module.exports = { normalizeService, clearSynonymsCache, getSynonyms };