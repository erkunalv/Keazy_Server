/**
 * Provider Registration Simulator
 * Simulates provider registration events with random data
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

const SERVICES = [
  'Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mechanic',
  'Gardener', 'Cleaner', 'Handyman', 'Welder', 'Mason'
];

const PROVIDER_NAMES = [
  'Raj Kumar', 'Priya Singh', 'Amit Patel', 'Deepak Sharma', 'Neha Gupta',
  'Suresh Kumar', 'Anjali Verma', 'Vikram Singh', 'Pooja Nair', 'Arjun Reddy',
  'Shreya Dubey', 'Rohit Joshi', 'Divya Rao', 'Sanjay Kumar', 'Meera Sharma',
  'Rajesh Pillai', 'Anita Roy', 'Nikhil Desai', 'Simran Kaur', 'Arun Menon'
];

const VOICE_INTROS = [
  'Hello, I am your trusted service provider.',
  'Hi there! Ready to help with your needs.',
  'Welcome! Quality service is my priority.',
  'Namaste! At your service.',
  'Good day! Let\'s get your work done right.',
  'Hi! Professional and punctual, that\'s me.',
  'Hello friend! Your satisfaction is key.',
  'Hey! Expert hands for quality work.'
];

function generateRandomContact() {
  const prefix = '9' + Math.floor(Math.random() * 9) + Math.floor(Math.random() * 9);
  const remaining = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return prefix + remaining;
}

function getRandomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSlots() {
  const days = ['Mon-Fri 9AM-5PM', 'Sat-Sun Available', 'Evening 6PM-9PM', '24/7 Available'];
  return [getRandomFromArray(days)];
}

async function registerProvider() {
  try {
    const payload = {
      name: getRandomFromArray(PROVIDER_NAMES),
      service: getRandomFromArray(SERVICES),
      contact: generateRandomContact(),
      slots: generateSlots(),
      voice_intro: getRandomFromArray(VOICE_INTROS)
    };

    const response = await axios.post(`${BACKEND_URL}/providers/register`, payload);

    console.log('✅ Provider registered successfully:', {
      provider_id: response.data.provider_id,
      name: payload.name,
      service: payload.service,
      contact: payload.contact
    });

    return response.data;
  } catch (error) {
    console.error('❌ Provider registration failed:', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });
    throw error;
  }
}

async function simulateProviderRegistrations(count = 5) {
  console.log(`\n🚀 Starting provider registration simulation (${count} registrations)...\n`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 1; i <= count; i++) {
    try {
      await registerProvider();
      successCount++;
      // Small delay between registrations
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      failureCount++;
    }
  }

  console.log('\n📊 Simulation Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
  console.log(`   📈 Total: ${successCount + failureCount}\n`);

  return { successCount, failureCount, total: successCount + failureCount };
}

// CLI execution
if (require.main === module) {
  const count = parseInt(process.argv[2]) || 5;
  simulateProviderRegistrations(count)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { simulateProviderRegistrations, registerProvider };
