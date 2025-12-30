const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../db/connect');
const Provider = require('../models/provider');
const Service = require('../models/service');

(async () => {
  try {
    // Connect to MongoDB using env vars
    await connectDB();

    // Load seed data
    const providers = JSON.parse(fs.readFileSync(path.join(__dirname, 'providers.json'), 'utf8'));
    const services = JSON.parse(fs.readFileSync(path.join(__dirname, 'services.json'), 'utf8'));

    // Clear collections
    await Provider.deleteMany({});
    await Service.deleteMany({});

    // Insert seed data
    await Provider.insertMany(providers);
    await Service.insertMany(services);

    console.log(`✅ Seeded: providers=${providers.length}, services=${services.length}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
})();
