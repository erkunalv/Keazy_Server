function detectUrgency(queryText) {
  const text = queryText.toLowerCase();

  if (text.includes("urgent") || text.includes("abhi") || text.includes("turant") || text.includes("immediately")) {
    return "high";
  }
  if (text.includes("kal") || text.includes("tomorrow") || text.includes("later")) {
    return "low";
  }
  return "normal";
}

module.exports = { detectUrgency };