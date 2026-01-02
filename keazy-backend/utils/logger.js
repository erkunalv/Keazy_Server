const fs = require("fs");
const path = require("path");
const { createLogger, transports, format } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

// 🔹 Log directory
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Pick log level from environment (default: info)
const logLevel = process.env.LOG_LEVEL || "info";
const isDevelopment = process.env.NODE_ENV !== "production";

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

// 🔹 Create transport array based on environment
const transportsList = [
  // Console output (always in dev, optional in prod)
  new transports.Console({
    format: consoleFormat,
  }),
];

if (isDevelopment) {
  // Development: simple file logging
  transportsList.push(
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),
    new transports.File({
      filename: path.join(logDir, "combined.log"),
    })
  );
} else {
  // Production: daily rotating logs
  transportsList.push(
    new DailyRotateFile({
      filename: path.join(logDir, "app-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxDays: "14d",
      level: "info",
    }),
    new DailyRotateFile({
      filename: path.join(logDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxDays: "14d",
      level: "error",
    })
  );
}

// 🔹 Create Winston logger
const logger = createLogger({
  level: logLevel,
  format: logFormat,
  transports: transportsList,
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
