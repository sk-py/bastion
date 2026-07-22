import { createLogger, transports, format } from "winston";
import { env } from "../config.js";
import path from "path";
import fs from "fs";
import DailyRotateFile from "winston-daily-rotate-file";

let dir = env.LOG_DIR ?? "logs";

if (!dir) dir = path.resolve("logs");

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const logLevel = env.NODE_ENV === "development" ? "debug" : "warn";

const dailyRotateFile = new DailyRotateFile({
  level: logLevel,
  filename: path.join(dir, "%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  handleExceptions: true,
  maxSize: "20m",
  maxFiles: "14d",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.json(),
  ),
});

export default createLogger({
  transports: [
    new transports.Console({
      level: logLevel,
      format: format.combine(
        format.prettyPrint(),
        format.colorize({ all: true }),
        format.errors({ stack: true }),
      ),
    }),
    dailyRotateFile,
  ],
  exceptionHandlers: [dailyRotateFile],
  exitOnError: false,
});
