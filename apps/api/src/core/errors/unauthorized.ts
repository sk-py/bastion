import APIError from './api-error.js';
import { StatusCodes } from 'http-status-codes';

class UnauthorizedError extends APIError {
  constructor(message: string = 'Unauthorized Error') {
    super(message, StatusCodes.FORBIDDEN);
  }
}

export default UnauthorizedError;