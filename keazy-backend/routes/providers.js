const express = require('express');
const Provider = require('../models/provider');
const logger = require('../utils/logger');
const router = express.Router();

/**
 * ✅ Register new provider with geolocation support
 * POST /providers/register
 * Body: { 
 *   name, service, contact,           // Required
 *   state, city, area, pincode,       // Location hierarchy
 *   lat, lng,                          // Geolocation (optional)
 *   slots, voice_intro, hourly_rate    // Optional
 * }
 */
router.post('/register', async (req, res, next) => {
  try {
    const { 
      name, service, contact, 
      state, city, area, district, pincode,
      lat, lng,
      slots = [], voice_intro = '', hourly_rate
    } = req.body;

    // Validate required fields
    if (!name || !service || !contact) {
      logger.warn('Provider registration failed: missing required fields', {
        name, service, contact
      });
      return res.status(400).json({ error: 'name, service, and contact are required' });
    }

    // Build provider object
    const providerData = {
      name,
      service,
      contact,
      state: state || null,
      city: city || null,
      area: area || null,
      district: district || null,
      pincode: pincode || null,
      slots: slots || [],
      voice_intro: voice_intro || '',
      hourly_rate: hourly_rate || null,
      rating: 0,
      verified: false,
      available_now: true,
      response_time_min: 60,
      jobs_completed_30d: 0,
      updated_at: new Date()
    };

    // Add geolocation if provided
    if (lat && lng) {
      providerData.location = {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)] // GeoJSON: [longitude, latitude]
      };
      logger.info('Provider registration with geolocation', { lat, lng });
    }

    const provider = new Provider(providerData);
    const saved = await provider.save();
    
    logger.info('Provider registered successfully', {
      provider_id: saved._id,
      name: saved.name,
      service: saved.service,
      state: saved.state,
      city: saved.city,
      hasGeo: !!saved.location
    });

    res.status(201).json({
      provider_id: saved._id,
      status: 'registered',
      message: `Provider ${name} registered successfully`,
      location: saved.location ? { lat, lng } : null
    });
  } catch (err) {
    logger.error('Provider registration error', { error: err.message });
    next(err);
  }
});

/**
 * ✅ Get all providers with pagination
 * GET /providers?page=1&limit=10
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const providers = await Provider.find()
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Provider.countDocuments();

    res.json({
      providers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    logger.error('Error fetching providers', { error: err.message });
    next(err);
  }
});

/**
 * ✅ Find nearby providers using $near (simple)
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
 * ✅ Find nearby providers using $geoNear with distance calculation
 * GET /providers/nearby?lat=26.8467&lng=80.9462&radius_km=10&service=Plumber&state=UP&city=Lucknow
 * 
 * Hierarchical filtering: state → city → radius
 * Returns providers sorted by distance with distance_km field
 */
router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radius_km = 10, service, state, city, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'lat and lng are required',
        example: '/providers/nearby?lat=26.8467&lng=80.9462&radius_km=10&service=Plumber'
      });
    }

    const radiusMeters = Number(radius_km) * 1000;
    
    // Build query filter for hierarchical matching
    const query = {};
    if (service) query.service = new RegExp(`^${service}$`, 'i');
    if (state) query.state = new RegExp(`^${state}$`, 'i');
    if (city) query.city = new RegExp(`^${city}$`, 'i');

    logger.info('Nearby providers search', { lat, lng, radius_km, service, state, city });

    const providers = await Provider.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          distanceField: 'distance',
          maxDistance: radiusMeters,
          query,
          spherical: true
        }
      },
      { $limit: Number(limit) },
      {
        $project: {
          provider_id: { $ifNull: ['$provider_id', '$_id'] },
          name: 1,
          service: 1,
          rating: 1,
          verified: 1,
          available_now: 1,
          city: 1,
          state: 1,
          area: 1,
          contact: 1,
          hourly_rate: 1,
          response_time_min: 1,
          distance_m: { $round: ['$distance', 0] },
          distance_km: { $round: [{ $divide: ['$distance', 1000] }, 2] }
        }
      }
    ]);

    logger.info('Nearby providers found', { count: providers.length });

    res.json({
      success: true,
      search: {
        center: { lat: Number(lat), lng: Number(lng) },
        radius_km: Number(radius_km),
        filters: { service, state, city }
      },
      count: providers.length,
      providers
    });
  } catch (err) {
    logger.error('Nearby providers search failed', { error: err.message });
    next(err);
  }
});

/**
 * ✅ Get provider by ID
 * GET /providers/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id).lean();

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json(provider);
  } catch (err) {
    logger.error('Error fetching provider', { error: err.message, provider_id: req.params.id });
    next(err);
  }
});

/**
 * ✅ Add new provider (legacy endpoint)
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
