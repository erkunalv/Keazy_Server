// seedLogs.js
const API_BASE = "http://localhost:3000/api/admin/ml";

// 30 diverse queries
const queries = [
  { user_id: "seed-user", query_text: "fix shoes", urgency: "high", assigned_service: "cobbler" },
  { user_id: "seed-user", query_text: "repair fridge", urgency: "medium", assigned_service: "appliance repair" },
  { user_id: "seed-user", query_text: "book doctor appointment", urgency: "low", assigned_service: "doctor" },
  { user_id: "seed-user", query_text: "find tutor", urgency: "high", assigned_service: "tutor" },
  { user_id: "seed-user", query_text: "clean sofa", urgency: "medium", assigned_service: "cleaner" },
  { user_id: "seed-user", query_text: "paint house", urgency: "high", assigned_service: "painter" },
  { user_id: "seed-user", query_text: "fix laptop", urgency: "high", assigned_service: "computer repair" },
  { user_id: "seed-user", query_text: "install AC", urgency: "medium", assigned_service: "hvac" },
  { user_id: "seed-user", query_text: "tailor clothes", urgency: "low", assigned_service: "tailor" },
  { user_id: "seed-user", query_text: "plumbing leak", urgency: "high", assigned_service: "plumber" },
  { user_id: "seed-user", query_text: "car wash", urgency: "low", assigned_service: "car wash" },
  { user_id: "seed-user", query_text: "garden maintenance", urgency: "medium", assigned_service: "gardener" },
  { user_id: "seed-user", query_text: "electric wiring", urgency: "high", assigned_service: "electrician" },
  { user_id: "seed-user", query_text: "mobile screen repair", urgency: "high", assigned_service: "mobile repair" },
  { user_id: "seed-user", query_text: "cook for party", urgency: "medium", assigned_service: "chef" },
  { user_id: "seed-user", query_text: "dog walking", urgency: "low", assigned_service: "pet care" },
  { user_id: "seed-user", query_text: "carpentry work", urgency: "medium", assigned_service: "carpenter" },
  { user_id: "seed-user", query_text: "roof leak repair", urgency: "high", assigned_service: "roofer" },
  { user_id: "seed-user", query_text: "laundry service", urgency: "low", assigned_service: "laundry" },
  { user_id: "seed-user", query_text: "move furniture", urgency: "medium", assigned_service: "mover" },
  { user_id: "seed-user", query_text: "fix TV", urgency: "high", assigned_service: "appliance repair" },
  { user_id: "seed-user", query_text: "install internet", urgency: "medium", assigned_service: "technician" },
  { user_id: "seed-user", query_text: "babysitting", urgency: "low", assigned_service: "babysitter" },
  { user_id: "seed-user", query_text: "fix bicycle", urgency: "low", assigned_service: "mechanic" },
  { user_id: "seed-user", query_text: "deep cleaning kitchen", urgency: "high", assigned_service: "cleaner" },
  { user_id: "seed-user", query_text: "fix washing machine", urgency: "high", assigned_service: "appliance repair" },
  { user_id: "seed-user", query_text: "teach guitar", urgency: "medium", assigned_service: "music tutor" },
  { user_id: "seed-user", query_text: "fix car engine", urgency: "high", assigned_service: "mechanic" },
  { user_id: "seed-user", query_text: "deliver groceries", urgency: "low", assigned_service: "delivery" },
  { user_id: "seed-user", query_text: "fix microwave", urgency: "medium", assigned_service: "appliance repair" }
];

// Helper: safe JSON parsing
async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("Non‑JSON response:", text);
    return null;
  }
}

// Helper: sleep for throttling
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function seed() {
  let successCount = 0;

  for (const q of queries) {
    try {
      // Step 1: Predict (include user_id)
      const predictRes = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: q.user_id,
          query_text: q.query_text,
          urgency: q.urgency
        })
      });
      const predictData = await safeJson(predictRes);
      if (!predictData || !predictData.id) {
        console.error("Prediction failed for:", q.query_text);
        continue;
      }
      console.log("Predicted:", predictData);

      // Step 2: Correct (include user_id for consistency)
      const correctRes = await fetch(`${API_BASE}/logs/${predictData.id}/correct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: q.user_id,
          assigned_service: q.assigned_service
        })
      });
      const correctData = await safeJson(correctRes);
      if (correctData && correctData.message === "Correction saved") {
        successCount++;
        console.log("Correction:", correctData);
      }

      // Throttle between requests
      await sleep(200);

    } catch (err) {
      console.error("Error seeding:", err.message);
    }
  }

  console.log(`✅ Seeding complete. Successfully labeled ${successCount} logs.`);
}

seed();
