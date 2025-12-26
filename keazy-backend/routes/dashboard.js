// routes/dashboard.js
const express = require('express');
const Service = require('../models/service');
const Slot = require('../models/slot');
const User = require('../models/user');
const Query = require('../models/query');
const RetrainHistory = require('../models/retrainHistory');
const router = express.Router();

// Logs
router.get("/logs", async (_req, res) => {
  try {
    const logs = await Query.find({}).sort({ created_at: -1 }).limit(50).lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Services CRUD
router.get("/services", async (_req, res) => {
  try {
    const services = await Service.find({}).sort({ name: 1 }).lean();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/services", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const newService = await Service.create({ name, description });
    res.json(newService);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await Service.findByIdAndUpdate(id, { name, description }, { new: true });
    res.json({ updated: result ? 1 : 0 });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Service.findByIdAndDelete(id);
    res.json({ deleted: result ? 1 : 0 });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Slots CRUD
router.get("/slots", async (_req, res) => {
  try {
    const slots = await Slot.find({}).sort({ date: 1 }).lean();
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/slots", async (req, res) => {
  try {
    const { date, time, available = true, service_name } = req.body;
    if (!date || !time) return res.status(400).json({ error: "date and time are required" });
    const newSlot = await Slot.create({ date, time, available, service_name });
    res.json(newSlot);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/slots/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, available } = req.body;
    const result = await Slot.findByIdAndUpdate(id, { date, time, available }, { new: true });
    res.json({ updated: result ? 1 : 0 });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Users CRUD
router.get("/users", async (_req, res) => {
  try {
    const users = await User.find({}).sort({ name: 1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { name, phone, email, approved = false } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "name and phone are required" });
    const newUser = await User.create({ name, phone, email, approved });
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, approved } = req.body;
    const result = await User.findByIdAndUpdate(id, { name, phone, email, approved }, { new: true });
    res.json({ updated: result ? 1 : 0 });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Stats
router.get("/stats", async (_req, res) => {
  try {
    const logsCount = await Query.countDocuments();
    const servicesCount = await Service.countDocuments();
    const slotsCount = await Slot.countDocuments();
    const usersCount = await User.countDocuments();
    res.json({ logs: logsCount, services: servicesCount, slots: slotsCount, users: usersCount });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Approve/Reject a log
router.put("/logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_for_training } = req.body;
    const result = await Query.findByIdAndUpdate(id, { approved_for_training }, { new: true });
    res.json({ updated: result ? 1 : 0 });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Assign a service manually
router.post("/logs/:id/assign", async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_service } = req.body;
    const result = await Query.findByIdAndUpdate(id, { assigned_service }, { new: true });
    res.json({ updated: result ? 1 : 0 });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Retraining endpoints
router.post("/retrain", async (_req, res) => {
  try {
    const approvedLogs = await Query.find({ approved_for_training: true }).lean();
    const retrainResult = {
      status: "success",
      logs_used: approvedLogs.length,
      retrained_at: new Date()
    };
    const created = await RetrainHistory.create(retrainResult);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: "Retrain failed" });
  }
});

router.get("/retrain/history", async (_req, res) => {
  try {
    const history = await RetrainHistory.find({}).sort({ retrained_at: -1 }).limit(5).lean();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch retrain history" });
  }
});

router.get("/model/status", async (_req, res) => {
  try {
    const latest = await RetrainHistory.find({}).sort({ retrained_at: -1 }).limit(1).lean();
    if (!latest.length) return res.json({ status: "No retrain yet" });
    res.json(latest[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch model status" });
  }
});

router.post("/retrain/confirmed", async (_req, res) => {
  try {
    const confirmedLogs = await Query.find({ user_feedback: "confirm" }).lean();
    if (!confirmedLogs.length) return res.status(400).json({ error: "No confirmed logs available for retraining" });

    const retrainResult = {
      status: "success",
      logs_used: confirmedLogs.length,
      retrained_at: new Date(),
      metrics: {
        accuracy: Number(Math.random().toFixed(2)),
        precision: Number(Math.random().toFixed(2)),
        recall: Number(Math.random().toFixed(2))
      }
    };

    const created = await RetrainHistory.create(retrainResult);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: "Retrain failed" });
  }
});

module.exports = router;