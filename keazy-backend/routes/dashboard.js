// server/routes/dashboard.js
import express from "express";
const router = express.Router();

// Example: mock logs until MongoDB is wired
const mockLogs = [
  { _id: "1", query_text: "install tap", predicted_service: "plumber", confidence: 0.76, urgency: "normal", approved_for_training: true, created_at: new Date() },
  { _id: "2", query_text: "fix wiring", predicted_service: "electrician", confidence: 0.65, urgency: "high", approved_for_training: false, created_at: new Date() }
];

// GET /dashboard/logs
router.get("/logs", async (req, res) => {
  try {
    // later: replace with MongoDB query
    res.json(mockLogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// You can add similar routes for services, slots, users
// router.get("/services", ...)
// router.get("/slots", ...)
// router.get("/users", ...)

export default router;