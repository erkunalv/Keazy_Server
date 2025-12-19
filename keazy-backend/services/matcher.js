const Provider = require('../models/provider');

function scoreProvider(p, area) {
  let s = 0;
  s += p.verified ? 20 : 10;
  s += (p.rating || 0) * 5;
  s += Math.min(p.jobs_completed_30d || 0, 20);
  s += p.available_now ? 10 : 0;
  s -= Math.min(p.response_time_min || 60, 60) / 6;
  if (area && p.area && p.area.toLowerCase() === area.toLowerCase()) s += 5;
  return s;
}

async function matchProviders({ intent, city, area, limit = 10 }) {
  const filter = { service: intent };
  if (city) filter.city = new RegExp(`^${city}$`, 'i');

  const providers = await Provider.find(filter).limit(200).lean();

  const ranked = providers
    .map(p => ({ ...p, _score: scoreProvider(p, area) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(p => ({
      provider_id: p.provider_id,
      name: p.name,
      rating: p.rating,
      verified: p.verified,
      available_now: p.available_now,
      area: p.area,
      city: p.city
    }));

  return ranked;
}

module.exports = { matchProviders, scoreProvider };
