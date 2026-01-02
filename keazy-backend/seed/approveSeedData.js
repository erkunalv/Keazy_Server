const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Query = require("../models/query");

async function approveSeedData() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "keazy"
    });
    console.log("✅ Connected successfully");

    // Approve all seed queries for training
    const result = await Query.updateMany(
      { user_id: "seed-user" },
      { approved_for_training: true },
      { new: true }
    );
    
    console.log(`✅ Approved ${result.modifiedCount} seed queries for training`);
    
    // Get count by service
    const byService = await Query.aggregate([
      { $match: { approved_for_training: true } },
      { $group: { _id: "$normalized_service", count: { $sum: 1 } } }
    ]);
    
    console.log("\n📊 Training data distribution:");
    byService.forEach(s => console.log(`   ${s._id}: ${s.count} logs`));
    
    await mongoose.connection.close();
    console.log("\n✅ Done!");
    
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

approveSeedData();
