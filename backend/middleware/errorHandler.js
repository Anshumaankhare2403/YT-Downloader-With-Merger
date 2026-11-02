/**
 * backend/middleware/errorHandler.js
 * Centralized error handler preventing information leakage.
 */

export function errorHandler(err, req, res, next) {
  console.error('[API Error]', err);

  const statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'An unexpected internal server error occurred.';

  // Mask internal absolute paths from user-facing error messages
  message = message.replace(/[A-Z]:\\[^ \t\r\n]+/gi, '[PATH]');

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_ERROR',
  });
}

