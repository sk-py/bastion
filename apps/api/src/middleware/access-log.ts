import type { Request, Response, NextFunction } from "express";
import logger from "../core/logger.js";

export const accessLogMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.log = logger;

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const responseTimeMs = Number(end - start) / 1_000_000;

    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTimeMs: Number(responseTimeMs.toFixed(2)),
      userAgent: req.headers["user-agent"] || "",
      ip: req.headers["x-forwarded-for"] ?? req.ip,
    });
  });

  next();
};
