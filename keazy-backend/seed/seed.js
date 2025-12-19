require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('../db/connect');
const Provider = require('../models/provider');
const Service = require('../models/service');

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    const providers = JSON.parse(fs.readFileSync(path.join(__dirname, 'providers.json'), 'utf8'));
    const services = JSON.parse(fs.readFileSync(path.join(__dirname, 'services.json'), 'utf8'));

    await Provider.deleteMany({});
    await Service.deleteMany({});

    await Provider.insertMany(providers);
    await Service.insertMany(services);

    console.log(`Seeded: providers=${providers.length}, services=${services.length}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
