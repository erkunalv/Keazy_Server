const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient, ObjectId } = require("mongodb");
const { getIntentPrediction } = require("./services/intentModel");

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
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

// ------------------- ROUTES -------------------

// Classify
app.post("/classify", async (req, res) => {
  try {
    const { query_text, urgency = "normal" } = req.body;
    if (!query_text || typeof query_text !== "string") {
      return res.status(400).json({ error: "query_text is required" });
    }
    const { predicted_service, confidence } = await getIntentPrediction(query_text, urgency);
    const logDoc = { query_text, urgency, predicted_service, confidence, approved_for_training: true, created_at: new Date() };
    await db.collection("query_logs").insertOne(logDoc);
    res.json({ predicted_service, confidence });
  } catch (err) {
    console.error("Error in /classify:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Health
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Logs
app.get("/dashboard/logs", async (_req, res) => {
  try {
    const logs = await db.collection("query_logs").find({}).sort({ created_at: -1 }).limit(50).toArray();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Services CRUD
app.get("/dashboard/services", async (_req, res) => {
  const services = await db.collection("services").find({}).sort({ name: 1 }).toArray();
  res.json(services);
});
app.post("/dashboard/services", async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const newService = { name, description, created_at: new Date() };
  await db.collection("services").insertOne(newService);
  res.json(newService);
});
app.put("/dashboard/services/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const result = await db.collection("services").updateOne({ _id: new ObjectId(id) }, { $set: { name, description } });
  res.json({ updated: result.modifiedCount });
});
app.delete("/dashboard/services/:id", async (req, res) => {
  const { id } = req.params;
  const result = await db.collection("services").deleteOne({ _id: new ObjectId(id) });
  res.json({ deleted: result.deletedCount });
});

// Slots CRUD
app.get("/dashboard/slots", async (_req, res) => {
  const slots = await db.collection("slots").find({}).sort({ date: 1 }).toArray();
  res.json(slots);
});
app.post("/dashboard/slots", async (req, res) => {
  const { date, time, available = true } = req.body;
  if (!date || !time) return res.status(400).json({ error: "date and time are required" });
  const newSlot = { date, time, available, created_at: new Date() };
  await db.collection("slots").insertOne(newSlot);
  res.json(newSlot);
});
app.put("/dashboard/slots/:id", async (req, res) => {
  const { id } = req.params;
  const { date, time, available } = req.body;
  const result = await db.collection("slots").updateOne({ _id: new ObjectId(id) }, { $set: { date, time, available } });
  res.json({ updated: result.modifiedCount });
});

// Users CRUD
app.get("/dashboard/users", async (_req, res) => {
  const users = await db.collection("users").find({}).sort({ name: 1 }).toArray();
  res.json(users);
});
app.post("/dashboard/users", async (req, res) => {
  const { name, phone, email, approved = false } = req.body;
  if (!name || !phone) return res.status(400).json({ error: "name and phone are required" });
  const newUser = { name, phone, email, approved, created_at: new Date() };
  await db.collection("users").insertOne(newUser);
  res.json(newUser);
});
app.put("/dashboard/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, approved } = req.body;
  const result = await db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set: { name, phone, email, approved } });
  res.json({ updated: result.modifiedCount });
});

// Stats
app.get("/dashboard/stats", async (_req, res) => {
  const logsCount = await db.collection("query_logs").countDocuments();
  const servicesCount = await db.collection("services").countDocuments();
  const slotsCount = await db.collection("slots").countDocuments();
  const usersCount = await db.collection("users").countDocuments();
  res.json({ logs: logsCount, services: servicesCount, slots: slotsCount, users: usersCount });
});

// Approve/Reject a log
app.put("/dashboard/logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_for_training } = req.body;
    const result = await db.collection("query_logs").updateOne(
      { _id: new ObjectId(id) },
      { $set: { approved_for_training } }
    );
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Assign a service manually
app.post("/dashboard/logs/:id/assign", async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_service } = req.body;
    const result = await db.collection("query_logs").updateOne(
      { _id: new ObjectId(id) },
      { $set: { assigned_service } }
    );
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Trigger retraining
app.post("/dashboard/retrain", async (req, res) => {
  try {
    // Fetch approved logs
    const approvedLogs = await db.collection("query_logs")
      .find({ approved_for_training: true })
      .toArray();

    // TODO: call your ML retraining function here
    // e.g., await retrainModel(approvedLogs);

    // For now, simulate retraining
    const retrainResult = {
      status: "success",
      logs_used: approvedLogs.length,
      retrained_at: new Date(),
    };

    // Optionally store retrain history
    await db.collection("retrain_history").insertOne(retrainResult);

    res.json(retrainResult);
  } catch (err) {
    console.error("Error in retrain:", err);
    res.status(500).json({ error: "Retrain failed" });
  }
});

// Get retrain history
app.get("/dashboard/retrain/history", async (_req, res) => {
  try {
    const history = await db.collection("retrain_history")
      .find({})
      .sort({ retrained_at: -1 })
      .limit(5)
      .toArray();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch retrain history" });
  }
});

app.post("/dashboard/retrain", async (req, res) => {
  try {
    // Fetch approved logs
    const approvedLogs = await db.collection("query_logs")
      .find({ approved_for_training: true })
      .toArray();

    // Simulate retraining and metrics
    const retrainResult = {
      status: "success",
      logs_used: approvedLogs.length,
      retrained_at: new Date(),
      metrics: {
        accuracy: Number(Math.random().toFixed(2)),   // convert to number
        precision: Number(Math.random().toFixed(2)),
        recall: Number(Math.random().toFixed(2)),
      }
    };

    // Store retrain history
    await db.collection("retrain_history").insertOne(retrainResult);

    res.json(retrainResult);
  } catch (err) {
    console.error("Error in retrain:", err);
    res.status(500).json({ error: "Retrain failed" });
  }
});

// Get latest model status
app.get("/dashboard/model/status", async (_req, res) => {
  try {
    const latest = await db.collection("retrain_history")
      .find({})
      .sort({ retrained_at: -1 })
      .limit(1)
      .toArray();

    if (!latest.length) {
      return res.json({ status: "No retrain yet" });
    }

    res.json(latest[0]);
  } catch (err) {
    console.error("Error fetching model status:", err);
    res.status(500).json({ error: "Failed to fetch model status" });
  }
});

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 3000;
initDb().then(() => app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`)));