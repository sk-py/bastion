import APIError from './api-error.js';
import { StatusCodes } from 'http-status-codes';

class UnauthenticatedError extends APIError {
  constructor(message: string = 'Unauthenticated Error') {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

export default UnauthenticatedError;