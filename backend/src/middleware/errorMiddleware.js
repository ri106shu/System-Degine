import ApiError from '../utils/ApiError.js';

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found - ${req.method} ${req.originalUrl}`));
};

// Centralized error handler — every response the API sends on failure,
// whatever caused it, comes out in this exact shape (section 28 of the brief).
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  let message = err.message || 'Server error';
  let errors = err.errors || [];

  // Mongoose-specific errors translated into the same shape, so callers
  // never have to special-case them.
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `That ${field} is already in use`;
    errors = [{ field, message: `${field} must be unique` }];
  }

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
