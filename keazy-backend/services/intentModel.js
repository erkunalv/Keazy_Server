const axios = require("axios");

const ML_URL = process.env.ML_URL || "http://127.0.0.1:5000";

async function getIntentPrediction(query_text, urgency) {
  try {
    const res = await axios.post(`${ML_URL}/predict`, { query_text, urgency }, {
      timeout: 5000
    });
    return res.data; // { predicted_service, confidence }
  } catch (err) {
    console.error("Error calling ML microservice:", err.message);
    throw new Error("ML_SERVICE_UNAVAILABLE");
  }
}

module.exports = { getIntentPrediction };