const Provider = require('../models/provider');
const logger = require('../utils/logger');

/**
 * Calculate provider score for ranking
 * @param {Object} p - Provider document
 * @param {string} area - User's area for bonus scoring
 * @param {number} distance - Distance in meters (if geo search)
 */
function scoreProvider(p, area, distance = null) {
  let s = 0;
  s += p.verified ? 20 : 10;
  s += (p.rating || 0) * 5;
  s += Math.min(p.jobs_completed_30d || 0, 20);
  s += p.available_now ? 10 : 0;
  s -= Math.min(p.response_time_min || 60, 60) / 6;
  if (area && p.area && p.area.toLowerCase() === area.toLowerCase()) s += 5;
  
  // Distance bonus: closer providers get higher score (if geo search)
  if (distance !== null) {
    // Max 15 points for distance, decreasing as distance increases
    // 0m = 15pts, 5km = 10pts, 10km = 5pts, 15km+ = 0pts
    s += Math.max(0, 15 - (distance / 1000));
  }
  
  return s;
}

/**
 * Match providers using hierarchical location filtering:
 * 1. State (if provided)
 * 2. City (if provided)
 * 3. Geolocation radius (if coordinates provided)
 * 
 * @param {Object} params
 * @param {string} params.intent - Service type to match
 * @param {string} params.state - State filter (optional)
 * @param {string} params.city - City filter (optional)
 * @param {string} params.area - Area for scoring bonus (optional)
 * @param {Object} params.geo - Geolocation params (optional)
 * @param {number} params.geo.lat - Latitude
 * @param {number} params.geo.lng - Longitude
 * @param {number} params.geo.radiusKm - Search radius in kilometers (default: 10)
 * @param {number} params.limit - Max results (default: 10)
 */
async function matchProviders({ intent, state, city, area, geo, limit = 10 }) {
  logger.info('matchProviders called', { intent, state, city, area, geo, limit });
  
  // Build hierarchical filter
  const filter = { service: intent };
  
  // Level 1: State filter
  if (state) {
    filter.state = new RegExp(`^${state}$`, 'i');
    logger.debug('Added state filter', { state });
  }
  
  // Level 2: City filter
  if (city) {
    filter.city = new RegExp(`^${city}$`, 'i');
    logger.debug('Added city filter', { city });
  }

  let providers = [];
  let searchMethod = 'standard';

  // Level 3: Geolocation radius search (if coordinates provided)
  if (geo && geo.lat && geo.lng) {
    const radiusMeters = (geo.radiusKm || 10) * 1000; // Default 10km radius
    
    try {
      // Use $geoNear aggregation for distance calculation
      providers = await Provider.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [geo.lng, geo.lat] // GeoJSON: [longitude, latitude]
            },
            distanceField: 'distance', // Distance in meters
            maxDistance: radiusMeters,
            query: filter, // Apply state/city filters
            spherical: true
          }
        },
        { $limit: 200 }
      ]);
      
      searchMethod = 'geo';
      logger.info('Geo search completed', { 
        count: providers.length, 
        radiusKm: geo.radiusKm || 10,
        center: [geo.lng, geo.lat]
      });
    } catch (err) {
      // Fallback to standard search if geo fails (e.g., no 2dsphere index)
      logger.warn('Geo search failed, falling back to standard', { error: err.message });
      providers = await Provider.find(filter).limit(200).lean();
      searchMethod = 'standard-fallback';
    }
  } else {
    // Standard search without geolocation
    providers = await Provider.find(filter).limit(200).lean();
    logger.info('Standard search completed', { count: providers.length });
  }

  // Rank providers by score
  const ranked = providers
    .map(p => ({ 
      ...p, 
      _score: scoreProvider(p, area, searchMethod === 'geo' ? p.distance : null) 
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(p => ({
      _id: p._id, // Keep original _id for slot queries
      provider_id: p.provider_id || p._id,
      name: p.name,
      service: p.service,
      contact: p.contact,
      rating: p.rating,
      verified: p.verified,
      available_now: p.available_now,
      response_time_min: p.response_time_min,
      hourly_rate: p.hourly_rate,
      area: p.area,
      city: p.city,
      state: p.state,
      distance_m: p.distance ? Math.round(p.distance) : null, // Distance in meters
      distance_km: p.distance ? Math.round(p.distance / 100) / 10 : null, // Distance in km (1 decimal)
      _score: p._score
    }));

  logger.info('Provider matching complete', { 
    searchMethod, 
    totalFound: providers.length, 
    returned: ranked.length 
  });

  return { providers: ranked, searchMethod };
}

/**
 * Find nearby providers by geolocation only (no service filter)
 * Useful for "providers near me" queries
 */
async function findNearbyProviders({ lat, lng, radiusKm = 10, service = null, limit = 20 }) {
  const radiusMeters = radiusKm * 1000;
  const query = service ? { service } : {};

  try {
    const providers = await Provider.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          distanceField: 'distance',
          maxDistance: radiusMeters,
          query,
          spherical: true
        }
      },
      { $limit: limit },
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
          distance_m: { $round: ['$distance', 0] },
          distance_km: { $round: [{ $divide: ['$distance', 1000] }, 1] }
        }
      }
    ]);

    logger.info('findNearbyProviders completed', { count: providers.length, radiusKm });
    return providers;
  } catch (err) {
    logger.error('findNearbyProviders failed', { error: err.message });
    throw err;
  }
}

module.exports = { matchProviders, scoreProvider, findNearbyProviders };
