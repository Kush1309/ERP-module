const jwt = require('jsonwebtoken');
const AppError = require('./AppError');

const generateAccessToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  if (!secret) {
    throw new AppError('JWT configuration is missing', 500);
  }

  return jwt.sign(payload, secret, { expiresIn });
};

const verifyAccessToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError('JWT configuration is missing', 500);
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
};
