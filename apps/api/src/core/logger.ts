import { createLogger, transports, format } from "winston";
import { environment, logDirectory } from "../config.js";
import path from "path";
import fs from "fs";
import DailyRotateFile from "winston-daily-rotate-file";

let dir = logDirectory ?? "logs";

if (!dir) dir = path.resolve("logs");

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const logLevel = environment === "development" ? "debug" : "warn";

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
        format.colorize({ all: true }),
        format.prettyPrint(),
        format.errors({ stack: true }),
      ),
    }),
    dailyRotateFile,
  ],
  exceptionHandlers: [dailyRotateFile],
  exitOnError: false,
});
