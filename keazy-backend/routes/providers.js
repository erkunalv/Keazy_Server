const express = require('express');
const Provider = require('../models/provider');
const router = express.Router();

// List providers by service/city/area
router.get('/', async (req, res, next) => {
  try {
    const { service, city, area } = req.query;
    const filter = {};
    if (service) filter.service = new RegExp(service, 'i');
    if (city) filter.city = new RegExp(`^${city}$`, 'i');
    if (area) filter.area = new RegExp(area, 'i');

    const providers = await Provider.find(filter).limit(200).lean();
    res.json(providers);
  } catch (err) {
    next(err);
  }
});

// Toggle availability (minimal admin/provider action)
router.patch('/:provider_id/availability', async (req, res, next) => {
  try {
    const { provider_id } = req.params;
    const { available_now } = req.body;
    const p = await Provider.findOneAndUpdate(
      { provider_id },
      { available_now },
      { new: true }
    );
    if (!p) return res.status(404).json({ error: 'Provider not found' });
    res.json({ provider_id: p.provider_id, available_now: p.available_now });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
