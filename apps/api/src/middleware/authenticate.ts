import type { NextFunction, Request, Response } from "express";
import UnAuthenticatedError from "../core/errors/unauthenticated.js";
import { authenticateUser } from "../features/auth/local/auth-service.js";
import ForbiddenError from "../core/errors/forbidden.js";

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const sessionToken = req.cookies.session;

    if (!sessionToken) throw new UnAuthenticatedError("Unauthorized");

    const { user } = await authenticateUser(sessionToken);

    if (user.mustChangePassword) {
      return next(new ForbiddenError("Initial account setup is required."));
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
