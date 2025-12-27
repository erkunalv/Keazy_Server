require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const logger = require("./utils/logger"); // Winston logger

const app = express();

// 🔹 Global middleware
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(helmet());
app.use(xss());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP
}));

// 🔹 Routes
app.use("/query", require("./routes/query"));
app.use("/classify", require("./routes/classify"));
app.use("/dashboard", require("./routes/dashboard"));
app.use("/providers", require("./routes/providers"));
app.use("/jobs", require("./routes/jobs"));
app.use("/events", require("./routes/events"));
app.use("/api/admin", require("./routes/admin"));
app.use("/health", require("./routes/health"));

// 🔹 Error handler (must be after routes)
app.use((err, req, res, next) => {
  logger.error("Unhandled error", { message: err.message, stack: err.stack });
  res.status(500).json({ error: "Internal Server Error" });
});

// 🔹 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Backend running on port ${PORT}`);
});
