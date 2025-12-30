// testQuery.js - Direct test of Query model
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Query = require("../models/query");

async function testQuery() {
  try {
    console.log("📋 MongoDB URI:", process.env.MONGO_URI);
    console.log("📋 DB_NAME:", process.env.DB_NAME);
    
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "keazy"
    });
    console.log("✅ Connected to MongoDB");

    // Test 1: Create a single query with all required fields
    console.log("\n🔍 Test 1: Creating single query with all fields...");
    const testQuery = {
      user_id: "test-user-123",
      query_text: "fix shoes",
      normalized_service: "cobbler",
      urgency: "normal"
    };
    
    console.log("📝 Query object:", JSON.stringify(testQuery, null, 2));
    
    const result = await Query.create(testQuery);
    console.log("✅ Success! Created:", result);

    // Test 2: Try with array
    console.log("\n🔍 Test 2: Creating multiple queries with insertMany...");
    const queries = [
      { user_id: "user-1", query_text: "repair fridge", normalized_service: "appliance", urgency: "high" },
      { user_id: "user-2", query_text: "fix shoes", normalized_service: "cobbler", urgency: "normal" }
    ];
    
    console.log("📝 Queries array:", JSON.stringify(queries, null, 2));
    
    const results = await Query.insertMany(queries);
    console.log("✅ Success! Created:", results.length, "documents");

    // Test 3: Check what's in the collection
    console.log("\n🔍 Test 3: Fetching all queries...");
    const allQueries = await Query.find({}).lean();
    console.log("✅ Total queries:", allQueries.length);
    if (allQueries.length > 0) {
      console.log("   First query:", allQueries[0]);
    }

    await mongoose.disconnect();
    console.log("\n✅ All tests passed!");
  } catch (err) {
    console.error("❌ Error:", err.message);
    if (err.errors) {
      console.error("📋 Validation errors:", err.errors);
    }
    console.error("Full error:", err);
    process.exit(1);
  }
}

testQuery();
