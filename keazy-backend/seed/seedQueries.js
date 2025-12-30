const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Query = require("../models/query");

async function seed() {
  let connection;
  try {
    console.log("🔄 Connecting to MongoDB...");
    console.log("   MONGO_URI:", process.env.MONGO_URI);
    
    connection = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "keazy"
    });
    console.log("✅ Connected successfully");

    const sampleQueries = [
      // Cobbler (10 samples)
      { user_id: "seed-user", query_text: "fix shoes", normalized_service: "cobbler", urgency: "normal" },
      { user_id: "seed-user", query_text: "repair sandals", normalized_service: "cobbler", urgency: "high" },
      { user_id: "seed-user", query_text: "shoe sole repair", normalized_service: "cobbler", urgency: "normal" },
      { user_id: "seed-user", query_text: "heel replacement", normalized_service: "cobbler", urgency: "low" },
      { user_id: "seed-user", query_text: "jute repair karna", normalized_service: "cobbler", urgency: "normal" },
      { user_id: "seed-user", query_text: "chappal thik karna", normalized_service: "cobbler", urgency: "high" },
      { user_id: "seed-user", query_text: "polish shoes", normalized_service: "cobbler", urgency: "low" },
      { user_id: "seed-user", query_text: "boot stitching", normalized_service: "cobbler", urgency: "normal" },
      { user_id: "seed-user", query_text: "sandals ka strap thik karo", normalized_service: "cobbler", urgency: "normal" },
      { user_id: "seed-user", query_text: "repair leather shoes", normalized_service: "cobbler", urgency: "high" },

      // Pharmacy (10 samples)
      { user_id: "seed-user", query_text: "buy medicine", normalized_service: "pharmacy", urgency: "normal" },
      { user_id: "seed-user", query_text: "get tablets", normalized_service: "pharmacy", urgency: "low" },
      { user_id: "seed-user", query_text: "purchase vitamins", normalized_service: "pharmacy", urgency: "normal" },
      { user_id: "seed-user", query_text: "buy antibiotics", normalized_service: "pharmacy", urgency: "high" },
      { user_id: "seed-user", query_text: "dawa lena hai", normalized_service: "pharmacy", urgency: "normal" },
      { user_id: "seed-user", query_text: "medicine shop nearby", normalized_service: "pharmacy", urgency: "normal" },
      { user_id: "seed-user", query_text: "painkiller kharidna", normalized_service: "pharmacy", urgency: "high" },
      { user_id: "seed-user", query_text: "get syrup", normalized_service: "pharmacy", urgency: "low" },
      { user_id: "seed-user", query_text: "pharmacy se dawa", normalized_service: "pharmacy", urgency: "normal" },
      { user_id: "seed-user", query_text: "buy paracetamol", normalized_service: "pharmacy", urgency: "high" },

      // Plumber (10 samples)
      { user_id: "seed-user", query_text: "fix leaking pipe", normalized_service: "plumber", urgency: "high" },
      { user_id: "seed-user", query_text: "install tap", normalized_service: "plumber", urgency: "normal" },
      { user_id: "seed-user", query_text: "repair bathroom leak", normalized_service: "plumber", urgency: "high" },
      { user_id: "seed-user", query_text: "install shower", normalized_service: "plumber", urgency: "normal" },
      { user_id: "seed-user", query_text: "pipe burst repair", normalized_service: "plumber", urgency: "high" },
      { user_id: "seed-user", query_text: "nali saaf karna", normalized_service: "plumber", urgency: "normal" },
      { user_id: "seed-user", query_text: "kitchen sink repair", normalized_service: "plumber", urgency: "low" },
      { user_id: "seed-user", query_text: "tap leakage", normalized_service: "plumber", urgency: "normal" },
      { user_id: "seed-user", query_text: "bathroom fitting", normalized_service: "plumber", urgency: "normal" },
      { user_id: "seed-user", query_text: "water line thik karna", normalized_service: "plumber", urgency: "high" },

      // Electrician (10 samples)
      { user_id: "seed-user", query_text: "repair fan", normalized_service: "electrician", urgency: "normal" },
      { user_id: "seed-user", query_text: "install light", normalized_service: "electrician", urgency: "low" },
      { user_id: "seed-user", query_text: "repair wiring", normalized_service: "electrician", urgency: "high" },
      { user_id: "seed-user", query_text: "install socket", normalized_service: "electrician", urgency: "normal" },
      { user_id: "seed-user", query_text: "fan ka switch thik karo", normalized_service: "electrician", urgency: "normal" },
      { user_id: "seed-user", query_text: "tube light repair", normalized_service: "electrician", urgency: "high" },
      { user_id: "seed-user", query_text: "electric board fitting", normalized_service: "electrician", urgency: "normal" },
      { user_id: "seed-user", query_text: "short circuit fix", normalized_service: "electrician", urgency: "high" },
      { user_id: "seed-user", query_text: "wiring karna hai", normalized_service: "electrician", urgency: "normal" },
      { user_id: "seed-user", query_text: "install inverter", normalized_service: "electrician", urgency: "low" }
    ];

    // Validate all have user_id
    console.log("\n🔍 Validating queries...");
    let valid = true;
    sampleQueries.forEach((q, i) => {
      if (!q.user_id || q.user_id.trim() === "") {
        console.error(`   ❌ Query ${i} missing user_id:`, q);
        valid = false;
      }
      if (!q.query_text || q.query_text.trim() === "") {
        console.error(`   ❌ Query ${i} missing query_text:`, q);
        valid = false;
      }
    });

    if (!valid) {
      throw new Error("Validation failed: some queries are missing required fields");
    }
    console.log("✅ All queries valid");

    // Clear and insert
    console.log("\n🔄 Clearing existing queries...");
    const deleted = await Query.deleteMany({});
    console.log(`✅ Deleted ${deleted.deletedCount} old queries`);

    console.log("\n🔄 Inserting new queries...");
    const inserted = await Query.insertMany(sampleQueries);
    console.log(`✅ Successfully inserted ${inserted.length} queries`);

    // Verify
    console.log("\n🔍 Verifying insertion...");
    const count = await Query.countDocuments({});
    console.log(`✅ Database now has ${count} queries`);

    console.log("\n✅ Seeding completed successfully!");

  } catch (err) {
    console.error("\n❌ Seeding failed:");
    console.error("   Error message:", err.message);
    if (err.errors) {
      console.error("   Validation errors:", err.errors);
    }
    console.error("   Full error:", err);
    process.exit(1);

  } finally {
    console.log("\n🔄 Disconnecting from MongoDB...");
    try {
      if (connection) {
        await mongoose.disconnect();
      }
    } catch (disconnectErr) {
      console.error("❌ Error during disconnect:", disconnectErr.message);
    }
  }
}

seed();
