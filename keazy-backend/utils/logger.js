const fs = require("fs");
const path = require("path");
const { createLogger, transports, format } = require("winston");

// Ensure logs directory exists
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    // Console output
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),

    // Error logs only
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error"
    }),

    // Combined logs (info + error + warn)
    new transports.File({
      filename: path.join(logDir, "combined.log")
    })
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(logDir, "exceptions.log") })
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(logDir, "rejections.log") })
  ]
});

module.exports = logger;
