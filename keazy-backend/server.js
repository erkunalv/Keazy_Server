const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const { getIntentPrediction } = require("./services/intentModel");

const app = express();
app.use(bodyParser.json());

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "keazy";

let db;
async function initDb() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(DB_NAME);
  console.log("✅ Connected to MongoDB");
}

app.post("/classify", async (req, res) => {
  try {
    const { query_text, urgency = "normal" } = req.body;

    // Basic validation
    if (!query_text || typeof query_text !== "string") {
      return res.status(400).json({ error: "query_text is required" });
    }

    // Call ML microservice
    const { predicted_service, confidence } = await getIntentPrediction(query_text, urgency);

    // Log to MongoDB
    const logDoc = {
      query_text,
      urgency,
      predicted_service,
      confidence,
      approved_for_training: true, // default; later flip via admin
      created_at: new Date()
    };
    await db.collection("query_logs").insertOne(logDoc);

    // Respond to client
    res.json({ predicted_service, confidence });
  } catch (err) {
    if (err.message === "ML_SERVICE_UNAVAILABLE") {
      return res.status(503).json({ error: "ML service unavailable" });
    }
    console.error("Error in /classify:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Optional: health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
initDb()
  .then(() => app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`)))
  .catch(err => {
    console.error("Failed to init DB:", err);
    process.exit(1);
  });