const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = connectDB;
