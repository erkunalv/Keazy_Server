const express = require('express');
const Provider = require('../models/provider');
const router = express.Router();

/**
 * ✅ Add new provider
 * POST /providers/add
 */
router.post('/add', async (req, res, next) => {
  try {
    const {
      name,
      service,
      contact,
      hourly_rate,
      availability,
      state,
      district,
      pincode,
      lng,
      lat,
      accuracy_m
    } = req.body;

    if (
      !name || !service || !contact || !hourly_rate || !availability ||
      !state || !district || !pincode || lng === undefined || lat === undefined
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const provider = new Provider({
      name,
      service,
      contact,
      hourly_rate: Number(hourly_rate),
      availability,
      state,
      district,
      pincode,
      location: {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)] // GeoJSON [lng, lat]
      },
      geo_accuracy_m: accuracy_m ? Number(accuracy_m) : null,
      updated_at: new Date()
    });

    const saved = await provider.save();
    res.json({ provider_id: saved._id });
  } catch (err) {
    next(err);
  }
});

/**
 * ✅ Find nearby providers
 * GET /providers/near?service=Plumber&lng=80.9462&lat=26.8467&maxKm=10&limit=5
 */
router.get('/near', async (req, res, next) => {
  try {
    const { service, lng, lat, maxKm = 10, limit = 10 } = req.query;

    if (!service || !lng || !lat) {
      return res.status(400).json({ error: 'service, lng, lat are required' });
    }

    const maxDistance = Number(maxKm) * 1000;

    const providers = await Provider.find({
      service: new RegExp(`^${service}$`, 'i'),
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: maxDistance
        }
      }
    })
      .limit(Number(limit))
      .lean();

    res.json({ count: providers.length, providers });
  } catch (err) {
    next(err);
  }
});

/**
 * ✅ Toggle availability
 * PATCH /providers/:provider_id/availability
 */
router.patch('/:provider_id/availability', async (req, res, next) => {
  try {
    const { provider_id } = req.params;
    const { available_now } = req.body;

    const p = await Provider.findByIdAndUpdate(
      provider_id,
      { available_now },
      { new: true }
    );

    if (!p) return res.status(404).json({ error: 'Provider not found' });

    res.json({ provider_id: p._id, available_now: p.available_now });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
