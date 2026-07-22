import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import logger from '../core/logger.js';

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const incomingRequestId = req.headers['x-request-id'] as string;
  const requestId =
    typeof incomingRequestId === 'string' ? incomingRequestId : randomUUID();
  req.id = requestId;
  req.log = logger.child({ requestId });
  res.setHeader('X-Request-Id', requestId);
  next();
};