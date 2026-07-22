import { Logger } from "winston";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      id: string;
      log: Logger;
    }
  }
}
