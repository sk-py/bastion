import type { NextFunction, Request, Response } from "express";
import UnAuthenticatedError from "../core/errors/unauthenticated.js";
import { authenticateUser } from "../features/auth/local/auth-service.js";

export const requireSetupAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const sessionToken = req.cookies["session"];

    if (!sessionToken) {
      throw new UnAuthenticatedError("Unauthorized");
    }

    const { user } = await authenticateUser(sessionToken);

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
