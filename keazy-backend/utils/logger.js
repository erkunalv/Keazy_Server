const fs = require("fs");
const path = require("path");
const { createLogger, transports, format } = require("winston");

// 🔹 Use container-mounted log directory so Promtail can scrape
const logDir = "/var/log/keazy";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Pick log level from environment (default: info)
const logLevel = process.env.LOG_LEVEL || "info";

// Define common formats
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.json()
);

const consoleFormat = format.combine(
  format.colorize(),
  format.printf(({ level, message, timestamp, stack }) => {
    return stack
      ? `${timestamp} ${level}: ${message}\n${stack}`
      : `${timestamp} ${level}: ${message}`;
  })
);

// 🔹 Create Winston logger
const logger = createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    // Console output (colorized for dev)
    new transports.Console({
      format: consoleFormat,
    }),

    // Error logs only
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),

    // Combined logs (info + error + warn)
    new transports.File({
      filename: path.join(logDir, "combined.log"),
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(logDir, "exceptions.log") }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(logDir, "rejections.log") }),
  ],
});

// 🔹 Stream interface for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
