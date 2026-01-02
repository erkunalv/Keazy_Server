/**
 * Comprehensive seed script for Keazy
 * Seeds: Services (with synonyms), Providers, Slots
 * Run: node seed/seedAll.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectMongo, closeMongo } = require('./utils');
const Service = require('../models/service');
const Provider = require('../models/provider');
const Slot = require('../models/slot');
const User = require('../models/user');

const providersData = require('./providers.json');
const synonymsData = require('../entities/synonyms.json');

// Build services from synonyms.json
function buildServicesFromSynonyms() {
  const services = [];
  for (const [name, synonyms] of Object.entries(synonymsData)) {
    services.push({
      name,
      synonyms,
      description: `${name.charAt(0).toUpperCase() + name.slice(1)} services`,
      enabled: true
    });
  }
  return services;
}

// Generate slots for next 7 days
function generateSlots(provider, daysAhead = 7) {
  const slots = [];
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  
  for (let d = 1; d <= daysAhead; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    
    // Random availability - 70% of slots available
    times.forEach(time => {
      if (Math.random() > 0.3) {
        slots.push({
          provider_id: provider._id,
          date: dateStr,
          time,
          duration_min: 60,
          service_name: provider.service,
          available: true,
          status: 'available'
        });
      }
    });
  }
  return slots;
}

async function seedAll() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/keazy';
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await Service.deleteMany({});
    await Provider.deleteMany({});
    await Slot.deleteMany({});

    // 2. Seed Services from synonyms.json
    console.log('\n📦 Seeding services with synonyms...');
    const servicesData = buildServicesFromSynonyms();
    const services = await Service.insertMany(servicesData);
    console.log(`   Inserted ${services.length} services with synonyms`);
    services.forEach(s => console.log(`   - ${s.name}: ${s.synonyms.length} keywords`));

    // 3. Seed Providers
    console.log('\n👷 Seeding providers...');
    const providers = await Provider.insertMany(providersData);
    console.log(`   Inserted ${providers.length} providers`);

    // 4. Generate and seed Slots for each provider
    console.log('\n📅 Generating slots...');
    let totalSlots = 0;
    for (const provider of providers) {
      const slots = generateSlots(provider);
      if (slots.length > 0) {
        await Slot.insertMany(slots);
        totalSlots += slots.length;
      }
    }
    console.log(`   Generated ${totalSlots} slots across ${providers.length} providers`);

    // 5. Summary
    console.log('\n✅ Seed complete!');
    console.log('─'.repeat(40));
    
    const providerSummary = await Provider.aggregate([
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log('Providers by service:');
    providerSummary.forEach(s => console.log(`   ${s._id}: ${s.count}`));

    const slotSummary = await Slot.aggregate([
      { $group: { _id: '$service_name', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log('\nSlots by service:');
    slotSummary.forEach(s => console.log(`   ${s._id}: ${s.count}`));

    const userCount = await User.countDocuments();
    console.log(`\nUsers in system: ${userCount}`);

  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seedAll();
