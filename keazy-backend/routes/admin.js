const express = require('express');
const router = express.Router();
const Query = require('../models/query');
const Provider = require('../models/provider');

// GET /api/admin/queries → list recent queries
router.get('/queries', async (req, res) => {
  try {
    const queries = await Query.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    res.json(queries);
  } catch (err) {
    console.error("Error fetching queries:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/providers → list all providers
router.get('/providers', async (req, res) => {
  try {
    const providers = await Provider.find().lean();
    res.json(providers);
  } catch (err) {
    console.error("Error fetching providers:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;