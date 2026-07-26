import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import APIError from "../core/errors/api-error.js";
import type { ApiErrorResponse } from "../types/api.js";
import { env } from "../config.js";
import InternalServerError from "../core/errors/internal-server.js";
import logger from "../core/logger.js";

const errorHandlerMiddleware = (
  err: Error | APIError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (res.headersSent) {
    return next(err);
  }

  // Handle custom API errors
  if (err instanceof APIError) {
    const log = req.log ?? logger;
    log.warn(err.message, {
      requestId: req.id,
      userId: req.user?.id,
      method: req.method,
      path: req.originalUrl,
      params: req.params,
      name: err.name,
      statusCode: err.statusCode,
    });
    const apiError: ApiErrorResponse = {
      success: false,
      status: err.statusCode,
      message: err.message,
    };

    return res.status(err.statusCode).json(apiError);
  }

  // Handle validation errors (from express-validator or similar)
  if (err.name === "ValidationError") {
    const apiError: ApiErrorResponse = {
      success: false,
      status: StatusCodes.BAD_REQUEST,
      message: err.message || "Validation error",
    };

    return res.status(StatusCodes.BAD_REQUEST).json(apiError);
  }

  // if (env.NODE_ENV === "development") {
  //   console.error("Error:", {
  //     name: err.name,
  //     message: err.message,
  //     stack: err.stack,
  //   });
  // } else {
  //   console.error("Error:", {
  //     name: err.name,
  //   });
  // }

  const internalError = new InternalServerError(
    env.NODE_ENV === "production"
      ? "Something went wrong"
      : err.message || "Internal server error",
  );

  const apiError: ApiErrorResponse = {
    success: false,
    status: internalError.statusCode,
    message: internalError.message,
  };

  const log = req.log ?? logger;
  log.error("Request failed", {
    requestId: req.id,
    name: err.name,
    message: err.message,
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
  });

  res.status(internalError.statusCode).json(apiError);
};

export default errorHandlerMiddleware;
