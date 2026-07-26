import { StatusCodes } from "http-status-codes";
import APIError from "../errors/api-error.js";

export class SSHAuthenticationError extends APIError {
  constructor(message = "Authentication failed.") {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY);
  }
}

export class SSHConnectionError extends APIError {
  constructor(message: string) {
    super(message, StatusCodes.BAD_GATEWAY);
  }
}

export class SSHTimeoutError extends APIError {
  constructor(message = "Connection timed out.") {
    super(message, StatusCodes.GATEWAY_TIMEOUT);
  }
}
