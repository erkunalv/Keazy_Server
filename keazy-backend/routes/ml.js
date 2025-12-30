const express = require("express");
const axios = require("axios");
const { MongoClient, ObjectId } = require("mongodb");

const router = express.Router();

// MongoDB connection
const client = new MongoClient(process.env.MONGO_URI);
let mlLogsCol;

async function initDb() {
  if (!mlLogsCol) {
    await client.connect();
    const db = client.db("keazy");
    mlLogsCol = db.collection("ml_logs");
  }
}

// ML prediction + save to Mongo
router.post("/predict", async (req, res) => {
  try {
    await initDb();

    const response = await axios.post("http://mlservice:5000/predict", req.body, {
      headers: { "X-API-Key": process.env.ML_API_KEY }
    });

    const prediction = response.data;

    // Insert into MongoDB
    const logDoc = {
      query_text: req.body.query_text,
      urgency: req.body.urgency,
      predicted_service: prediction.predicted_service,
      confidence: prediction.confidence,
      created_at: new Date()
    };

    const result = await mlLogsCol.insertOne(logDoc);
    console.log("Inserted log into Mongo:", result.insertedId, logDoc);

    // Return prediction + id
    res.json({
      id: result.insertedId,
      predicted_service: prediction.predicted_service,
      confidence: prediction.confidence
    });
  } catch (err) {
    console.error("Error in /ml/predict:", err.message);
    res.status(500).json({ error: "ML service unavailable" });
  }
});

// Proxy retrain
router.post("/retrain", async (req, res) => {
  try {
    const response = await axios.post("http://mlservice:5000/retrain", {}, {
      headers: { "X-API-Key": process.env.ML_API_KEY }
    });
    res.json(response.data);
  } catch (err) {
    console.error("Error in /ml/retrain:", err.message);
    res.status(500).json({ error: "Retrain failed" });
  }
});

// Fetch prediction logs
router.get("/logs", async (req, res) => {
  try {
    await initDb();
    const logs = await mlLogsCol.find({}).sort({ created_at: -1 }).limit(50).toArray();
    res.json(logs.map(log => ({
      id: log._id,
      query_text: log.query_text,
      predicted_service: log.predicted_service,
      confidence: log.confidence,
      assigned_service: log.assigned_service,
      user_feedback: log.user_feedback,
      created_at: log.created_at
    })));
  } catch (err) {
    console.error("Error in /ml/logs:", err.message);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// Admin correction route
router.post("/logs/:id/correct", async (req, res) => {
  try {
    await initDb();
    const { id } = req.params;
    const { assigned_service } = req.body;

    const result = await mlLogsCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { assigned_service } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Log not found" });
    }

    res.json({ message: "Correction saved", id, assigned_service });
  } catch (err) {
    console.error("Error in /logs/:id/correct:", err.message);
    res.status(500).json({ error: "Failed to save correction" });
  }
});

// User feedback route
router.post("/logs/:id/feedback", async (req, res) => {
  try {
    await initDb();
    const { id } = req.params;
    const { user_feedback } = req.body;

    const result = await mlLogsCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { user_feedback } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Log not found" });
    }

    res.json({ message: "Feedback saved", id, user_feedback });
  } catch (err) {
    console.error("Error in /logs/:id/feedback:", err.message);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

module.exports = router;
