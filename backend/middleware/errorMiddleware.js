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

  // Handle Mongoose Bad ObjectId (Cast Error)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Resource not found: Invalid database ID format';
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    const duplicatedField = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: An item with this ${duplicatedField} already exists`;
  }

  // Handle Mongoose Validation Error
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

  console.error(`💥 [Error Log]: ${err.stack}`);

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
