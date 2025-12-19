const Service = require('../models/service');

function normalize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function extractIntent(text) {
  const t = normalize(text);
  const services = await Service.find({ enabled: true }).lean();

  // direct service name
  for (const s of services) {
    if (t.includes(s.name.toLowerCase())) return s.name.toLowerCase();
    if (Array.isArray(s.synonyms) && s.synonyms.some(x => t.includes(x.toLowerCase()))) {
      return s.name.toLowerCase();
    }
  }

  // fallback heuristics (Hinglish/local)
  if (/\b(bijli|wiring|switch|fan|ac)\b/.test(t)) return 'electrician';
  if (/\b(leak|pipe|tap|drain|nali|paani)\b/.test(t)) return 'plumber';
  if (/\b(teacher|tuition|coaching)\b/.test(t)) return 'tutor';
  if (/\b(salon|beautician|haircut)\b/.test(t)) return 'salon';

  return 'unknown';
}

module.exports = { extractIntent, normalize };
