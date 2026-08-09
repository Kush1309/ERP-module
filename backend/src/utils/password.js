const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

/**
 * Password policy (Module 2):
 * - Minimum 8 characters
 * - Must not be empty or whitespace-only
 * - Must include at least one letter and one number
 */
const validatePasswordStrength = (password) => {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password must be a string' };
  }

  if (password.trim().length === 0) {
    return { valid: false, message: 'Password cannot be empty or whitespace only' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      valid: false,
      message: 'Password must include at least one letter and one number',
    };
  }

  return { valid: true, message: 'OK' };
};

const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

const comparePassword = async (plainPassword, passwordHash) => {
  return bcrypt.compare(plainPassword, passwordHash);
};

module.exports = {
  SALT_ROUNDS,
  validatePasswordStrength,
  hashPassword,
  comparePassword,
};
