import type { NextFunction, Request, Response } from "express";
import ForbiddenError from "src/core/errors/forbidden.js";
import type { UserRole } from "src/features/auth/local/auth-types.js";

export const requireRole =
  (...allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          "You do not have permission to perform this action.",
        ),
      );
    }

    next();
  };
