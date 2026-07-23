import APIError from './api-error.js';
import { StatusCodes } from 'http-status-codes';

class ForbiddenError extends APIError {
  constructor(message: string = 'Forbidden Error') {
    super(message, StatusCodes.FORBIDDEN);
  }
}

export default ForbiddenError;