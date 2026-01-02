/**
 * @fileoverview Express Application Entry Point
 * 
 * Main server configuration including:
 * - Security middleware (helmet, xss-clean, mongo-sanitize)
 * - Rate limiting for API protection
 * - CORS configuration
 * - Prometheus metrics endpoint
 * - Route mounting
 * - Global error handling
 * 
 * Environment Variables:
 *   PORT - Server port (default: 3000)
 *   CORS_ORIGIN - Allowed origins for CORS
 *   NODE_ENV - Environment mode (development/production)
 *   MONGO_URI - MongoDB connection string
 * 
 * @module server
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");
const logger = require("./utils/logger");
const client = require("prom-client");
const connectDB = require("./db/connect");

const app = express();

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Parse JSON bodies with size limit to prevent payload attacks
app.use(express.json({ limit: "10kb" }));

// Set security headers (CSP, HSTS, etc.)
app.use(helmet());

// Sanitize user input to prevent XSS attacks
app.use(xss());

// Sanitize MongoDB queries to prevent NoSQL injection
app.use(mongoSanitize());

// ============================================================================
// OBSERVABILITY - Prometheus Metrics
// ============================================================================

// Collect default Node.js metrics (CPU, memory, event loop, etc.)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: "keazy_backend_" });

/**
 * GET /metrics - Prometheus metrics endpoint
 * Used by Prometheus for scraping application metrics
 */
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,  // Whitelist origins from env
    credentials: true,                 // Allow cookies/auth headers
  })
);

// ============================================================================
// RATE LIMITING
// Protects API from brute force and DDoS attacks
// ============================================================================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minute window
  max: 100,                   // 100 requests per window per IP
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);  // Apply to /api routes only

// ============================================================================
// REQUEST LOGGING
// Morgan logs HTTP requests, pipes to Winston for unified logging
// ============================================================================

app.use(
  morgan("combined", {
    stream: logger.stream,
  })
);

// ============================================================================
// ROUTE MOUNTING
// ============================================================================

// Core query processing (service detection, booking)
app.use("/query", require("./routes/query"));

// Legacy classification endpoint
app.use("/classify", require("./routes/classify"));

// Admin dashboard (logs, stats, CRUD)
app.use("/dashboard", require("./routes/dashboard"));

// Provider management
app.use("/providers", require("./routes/providers"));

// Background job management
app.use("/jobs", require("./routes/jobs"));

// Event tracking
app.use("/events", require("./routes/events"));

// Health check for container orchestration
app.use("/health", require("./routes/health"));

// Admin API routes
app.use("/api/admin", require("./routes/admin"));

// ML service proxy routes
app.use("/api/admin/ml", require("./routes/ml"));

// ============================================================================
// GLOBAL ERROR HANDLER
// Catches unhandled errors from async routes
// ============================================================================

app.use((err, req, res, next) => {
  logger.error("Unhandled error", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });
  res.status(500).json({ error: "Internal Server Error" });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3000;

/**
 * Initializes database connection and starts HTTP server.
 * Exits process on connection failure for container restart.
 * 
 * @async
 */
async function startServer() {
  try {
    // Establish MongoDB connection before accepting requests
    await connectDB();
    
    app.listen(PORT, () => {
      logger.info(`Backend running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);  // Exit for container orchestration to restart
  }
}

startServer();
