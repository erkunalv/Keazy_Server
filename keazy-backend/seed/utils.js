/**
 * Shared Utility Functions for Database and Services
 * Consolidates common patterns used across seed scripts and services
 */

const { MongoClient } = require("mongodb");

/**
 * Connect to MongoDB and return database instance
 * @param {string} mongoUri - MongoDB connection string
 * @param {string} dbName - Database name
 * @returns {Promise<Object>} - { client, db }
 */
async function connectMongo(mongoUri, dbName = "keazy") {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(dbName);
    console.log(`✅ Connected to MongoDB: ${dbName}`);
    return { client, db };
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    throw error;
  }
}

/**
 * Detect service from query text
 * Uses synonyms, service names, and basic pattern matching
 * @param {string} queryText - User query text
 * @param {Array<string>} serviceNames - List of service names
 * @param {Object} synonyms - Synonym mapping {service: [synonyms...]}
 * @returns {string|null} - Detected service or null
 */
function detectService(queryText, serviceNames, synonyms = {}) {
  const text = queryText.toLowerCase().trim();
  
  // Check exact service name matches
  for (const service of serviceNames) {
    if (text.includes(service.toLowerCase())) {
      return service;
    }
  }
  
  // Check synonym matches
  for (const [service, syns] of Object.entries(synonyms)) {
    for (const syn of syns) {
      if (text.includes(syn.toLowerCase())) {
        return service;
      }
    }
  }
  
  return null;
}

/**
 * Detect urgency level from query text
 * Returns high, normal, or low based on keywords
 * @param {string} queryText - User query text
 * @returns {string} - Urgency level: 'high', 'normal', or 'low'
 */
function detectUrgency(queryText) {
  const text = queryText.toLowerCase();
  
  const highKeywords = ["urgent", "emergency", "asap", "immediately", "critical", "now", "quickly"];
  const lowKeywords = ["whenever", "eventually", "later", "no rush", "not urgent"];
  
  if (highKeywords.some(kw => text.includes(kw))) {
    return "high";
  }
  if (lowKeywords.some(kw => text.includes(kw))) {
    return "low";
  }
  
  return "normal";
}

/**
 * Close MongoDB connection safely
 * @param {MongoClient} client - MongoDB client instance
 */
async function closeMongo(client) {
  if (client) {
    await client.close();
    console.log("✅ MongoDB Connection Closed");
  }
}

module.exports = {
  connectMongo,
  detectService,
  detectUrgency,
  closeMongo,
};
