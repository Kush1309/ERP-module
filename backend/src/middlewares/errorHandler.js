const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((value) => value.message)
      .join(', ');
  }

  if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyValue || err.keyPattern || {})[0];
    message = duplicateField ? `Duplicate value entered for ${duplicateField}` : 'Duplicate value entered';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path || 'identifier'}`;
  }

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON request body';
  }

  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
  }

  // Never leak internal error details (driver messages, stack traces) in production
  if (statusCode >= 500 && !err.isOperational && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
  }

  if (process.env.NODE_ENV === 'development' || statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
