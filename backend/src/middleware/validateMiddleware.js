import ApiError from '../utils/ApiError.js';

// Wraps a Zod schema into Express middleware. On success, req.body is
// replaced with the parsed (and type-coerced) data.
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
    throw new ApiError(400, 'Validation failed', errors);
  }

  req.body = result.data;
  next();
};
