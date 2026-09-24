// A thrown ApiError carries everything errorMiddleware needs to build the
// {success:false, message, errors} response shape used across the whole API.
export default class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
