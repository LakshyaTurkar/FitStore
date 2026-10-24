import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

export function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';
  let details = err.details;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed.';
    details = Object.fromEntries(Object.entries(err.errors).map(([key, e]) => [key, e.message]));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}.`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists.`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON.';
  } else if (!(err instanceof ApiError) && status === 500) {
    // Unexpected error: log details on the server, hide them from the client.
    console.error('[error]', err);
    message = 'Internal server error. Please try again.';
  }

  const body = { success: false, message };
  if (details) body.details = details;
  if (!env.isProduction && status === 500 && !(err instanceof ApiError)) body.debug = err.message;

  res.status(status).json(body);
}
