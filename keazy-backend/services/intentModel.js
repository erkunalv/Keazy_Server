/**
 * @fileoverview ML Service Client
 * 
 * HTTP client for communicating with the Python ML service.
 * Used as fallback when rule-based matching fails.
 * 
 * Environment Variables:
 *   ML_URL - ML service base URL (default: http://mlservice:5000)
 *   ML_API_KEY - API key for authentication
 * 
 * @module services/intentModel
 */

const axios = require("axios");

/** @constant {string} - ML service base URL from environment */
const ML_URL = process.env.ML_URL || "http://mlservice:5000";

/** @constant {string} - API key for ML service authentication */
const ML_API_KEY = process.env.ML_API_KEY || "dev-key-placeholder";

/**
 * Calls the ML service to predict service category.
 * 
 * This function is called when rule-based matching (synonyms) fails.
 * The ML service uses TF-IDF + LogisticRegression for classification.
 * 
 * @async
 * @param {string} query_text - User's natural language query
 * @param {string} urgency - Urgency level: "low" | "normal" | "high"
 * @returns {Promise<Object>} Prediction result
 * @returns {string} returns.predicted_service - Detected service category
 * @returns {number} returns.confidence - Prediction confidence (0-1)
 * @throws {Error} ML_SERVICE_UNAVAILABLE if service unreachable or timeout
 * 
 * @example
 * const result = await getIntentPrediction("fix my ceiling fan", "normal");
 * // result: { predicted_service: "electrician", confidence: 0.87 }
 */
async function getIntentPrediction(query_text, urgency) {
  try {
    const res = await axios.post(
      `${ML_URL}/predict`, 
      { query_text, urgency }, 
      {
        timeout: 5000,  // 5 second timeout
        headers: {
          "X-API-Key": ML_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );
    return res.data; // { predicted_service, confidence }
  } catch (err) {
    console.error("Error calling ML microservice:", err.message);
    throw new Error("ML_SERVICE_UNAVAILABLE");
  }
}

module.exports = { getIntentPrediction };