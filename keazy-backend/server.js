require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");
const logger = require("./utils/logger"); // Winston logger
const client = require("prom-client");

const app = express();

// 🔹 Global middleware
app.use(express.json({ limit: "10kb" }));
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());

// 🔹 Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: "keazy_backend_" });

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// 🔹 CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// 🔹 Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// 🔹 HTTP request logging with Morgan → Winston
app.use(
  morgan("combined", {
    stream: logger.stream,
  })
);

// 🔹 Routes
app.use("/query", require("./routes/query"));
app.use("/classify", require("./routes/classify"));
app.use("/dashboard", require("./routes/dashboard"));
app.use("/providers", require("./routes/providers"));
app.use("/jobs", require("./routes/jobs"));
app.use("/events", require("./routes/events"));
app.use("/health", require("./routes/health"));

app.use("/api/admin", require("./routes/admin"));
app.use("/api/admin/ml", require("./routes/ml"));

// 🔹 Error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });
  res.status(500).json({ error: "Internal Server Error" });
});

// 🔹 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Backend running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
