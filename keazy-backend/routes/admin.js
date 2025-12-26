const express = require('express');
const router = express.Router();
const Query = require('../models/query');
const Provider = require('../models/provider');

router.get('/queries', async (req, res) => {
  try {
    const queries = await Query.find().sort({ timestamp: -1 }).limit(50).lean();
    res.json(queries);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/providers', async (req, res) => {
  try {
    const providers = await Provider.find().lean();
    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
