const synonyms = require('../entities/synonyms.json');

function normalizeService(queryText) {
  const lowerQuery = queryText.toLowerCase();
  for (const [service, words] of Object.entries(synonyms)) {
    if (words.some(w => lowerQuery.includes(w))) {
      return service;
    }
  }
  return null;
}

module.exports = { normalizeService };