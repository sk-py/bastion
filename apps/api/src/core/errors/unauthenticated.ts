import APIError from './api-error.js';
import { StatusCodes } from 'http-status-codes';

class UnAuthenticatedError extends APIError {
  constructor(message: string = 'Unauthenticated Error') {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

export default UnAuthenticatedError;