const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/keazy", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const querySchema = new mongoose.Schema({
  query_text: String,
  normalized_service: String,
  urgency: String,
});

const Query = mongoose.model("Query", querySchema);

async function seed() {
  const sampleQueries = [
    // Cobbler (10 samples)
    { query_text: "fix shoes", normalized_service: "cobbler", urgency: "normal" },
    { query_text: "repair sandals", normalized_service: "cobbler", urgency: "high" },
    { query_text: "shoe sole repair", normalized_service: "cobbler", urgency: "normal" },
    { query_text: "heel replacement", normalized_service: "cobbler", urgency: "low" },
    { query_text: "jute repair karna", normalized_service: "cobbler", urgency: "normal" },
    { query_text: "chappal thik karna", normalized_service: "cobbler", urgency: "high" },
    { query_text: "polish shoes", normalized_service: "cobbler", urgency: "low" },
    { query_text: "boot stitching", normalized_service: "cobbler", urgency: "normal" },
    { query_text: "sandals ka strap thik karo", normalized_service: "cobbler", urgency: "normal" },
    { query_text: "repair leather shoes", normalized_service: "cobbler", urgency: "high" },

    // Pharmacy (10 samples)
    { query_text: "buy medicine", normalized_service: "pharmacy", urgency: "normal" },
    { query_text: "get tablets", normalized_service: "pharmacy", urgency: "low" },
    { query_text: "purchase vitamins", normalized_service: "pharmacy", urgency: "normal" },
    { query_text: "buy antibiotics", normalized_service: "pharmacy", urgency: "high" },
    { query_text: "dawa lena hai", normalized_service: "pharmacy", urgency: "normal" },
    { query_text: "medicine shop nearby", normalized_service: "pharmacy", urgency: "normal" },
    { query_text: "painkiller kharidna", normalized_service: "pharmacy", urgency: "high" },
    { query_text: "get syrup", normalized_service: "pharmacy", urgency: "low" },
    { query_text: "pharmacy se dawa", normalized_service: "pharmacy", urgency: "normal" },
    { query_text: "buy paracetamol", normalized_service: "pharmacy", urgency: "high" },

    // Plumber (10 samples)
    { query_text: "fix leaking pipe", normalized_service: "plumber", urgency: "high" },
    { query_text: "install tap", normalized_service: "plumber", urgency: "normal" },
    { query_text: "repair bathroom leak", normalized_service: "plumber", urgency: "high" },
    { query_text: "install shower", normalized_service: "plumber", urgency: "normal" },
    { query_text: "pipe burst repair", normalized_service: "plumber", urgency: "high" },
    { query_text: "nali saaf karna", normalized_service: "plumber", urgency: "normal" },
    { query_text: "kitchen sink repair", normalized_service: "plumber", urgency: "low" },
    { query_text: "tap leakage", normalized_service: "plumber", urgency: "normal" },
    { query_text: "bathroom fitting", normalized_service: "plumber", urgency: "normal" },
    { query_text: "water line thik karna", normalized_service: "plumber", urgency: "high" },

    // Electrician (10 samples)
    { query_text: "repair fan", normalized_service: "electrician", urgency: "normal" },
    { query_text: "install light", normalized_service: "electrician", urgency: "low" },
    { query_text: "repair wiring", normalized_service: "electrician", urgency: "high" },
    { query_text: "install socket", normalized_service: "electrician", urgency: "normal" },
    { query_text: "fan ka switch thik karo", normalized_service: "electrician", urgency: "normal" },
    { query_text: "tube light repair", normalized_service: "electrician", urgency: "high" },
    { query_text: "electric board fitting", normalized_service: "electrician", urgency: "normal" },
    { query_text: "short circuit fix", normalized_service: "electrician", urgency: "high" },
    { query_text: "wiring karna hai", normalized_service: "electrician", urgency: "normal" },
    { query_text: "install inverter", normalized_service: "electrician", urgency: "low" },
  ];

  await Query.insertMany(sampleQueries);
  console.log("✅ 40 sample queries inserted (10 per service)");
  mongoose.disconnect();
}

seed().catch(err => console.error(err));