const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Handle Mongoose Cast Errors (e.g. invalid ObjectId format)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new ApiError(message, 400);
};

/**
 * Handle Mongoose Duplicate Key Errors (e.g. unique field violations)
 */
const handleDuplicateFieldsDB = (err) => {
  // Regex to extract the duplicated value inside quotes
  const match = err.message.match(/(["'])(\\?.)*?\1/);
  const value = match ? match[0] : '';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new ApiError(message, 400);
};

/**
 * Handle Mongoose Validation Errors
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ApiError(message, 400);
};

/**
 * Send detailed error details during development
 */
const sendErrorDev = (err, req, res) => {
  console.log(err);
  logger.error('Error 💥', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
  });

  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

/**
 * Send sanitized, client-friendly error details in production
 */
const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: leak details to client safely
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  console.log(err);
  // Programming or other unknown error: log details and send generic message
  logger.error('ERROR 💥', err);

  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};

// Global error handling middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'production') {
    let error = {
      ...err,
      message: err.message,
      name: err.name,
      code: err.code,
      errors: err.errors,
    };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

    sendErrorProd(error, req, res);
  } else {
    // Default to development logging
    sendErrorDev(err, req, res);
  }
};
