import { redactSecrets } from '../utils/redactSecrets.js';

// 404 Not Found router interceptor
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle malformed JSON request bodies (rejected by express.json before any route runs)
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid request: the request body is not valid JSON';
  }

  // Handle a malformed record ID (Cast Error)
  if (err.name === 'CastError' && err.kind === 'ID') {
    statusCode = 400;
    message = 'Resource not found: Invalid database ID format';
  }

  // Handle MySQL Duplicate Key Error. Unique keys are named after the field
  // ("Duplicate entry 'a@b.com' for key 'users.email'" -> email).
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 400;
    const keyName = /for key '(?:[^'.]+\.)?([^']+)'/.exec(err.sqlMessage || err.message || '')?.[1] || 'value';
    message = `Duplicate field value entered: An item with this ${keyName} already exists`;
  }

  // Handle MySQL value too long for its column
  if (err.code === 'ER_DATA_TOO_LONG') {
    statusCode = 400;
    const column = /column '([^']+)'/.exec(err.sqlMessage || err.message || '')?.[1] || 'value';
    message = `The ${column.replace(/_/g, ' ')} entered is too long`;
  }

  // Handle MySQL reference to a record that does not exist (or is still in use)
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    statusCode = 400;
    message = 'Invalid reference: the linked record does not exist';
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    statusCode = 400;
    message = 'This record is still in use by other records and cannot be deleted';
  }

  // Handle Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // Handle JWT JsonWebTokenError
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid secure session token: Please login again';
  }

  // Handle JWT TokenExpiredError
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Secure session has expired: Please sign in again';
  }

  // Database errors can carry the connection string, so credentials are masked in logs and responses.
  const safeStack = redactSecrets(err.stack);
  console.error(`💥 [Error Log]: ${safeStack}`);

  res.status(statusCode).json({
    success: false,
    message: redactSecrets(message),
    stack: process.env.NODE_ENV === 'production' ? null : safeStack
  });
};
