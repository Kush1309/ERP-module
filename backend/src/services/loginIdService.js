const Counter = require('../models/Counter');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { ROLE_PREFIX, ROLE_VALUES } = require('../constants/roles');

const formatSequence = (seq) => String(seq).padStart(6, '0');

/**
 * Generates unique application login IDs:
 * ADM2026000001, TCH2026000001, STU2026000001, PAR2026000001
 *
 * Format: PREFIX + YEAR + 6 DIGITS
 * Uses an atomic counter with uniqueness retry as a safety net.
 */
const generateLoginId = async (role, maxAttempts = 5) => {
  if (!ROLE_VALUES.includes(role)) {
    throw new AppError('Invalid role for login ID generation', 400);
  }

  const year = new Date().getFullYear();
  const prefix = ROLE_PREFIX[role];
  const counterKey = `${role}:${year}`;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const counter = await Counter.findOneAndUpdate(
      { key: counterKey },
      {
        $inc: { seq: 1 },
        $setOnInsert: { role, year },
      },
      {
        new: true,
        upsert: true,
      }
    );

    const loginId = `${prefix}${year}${formatSequence(counter.seq)}`;
    const existing = await User.exists({ loginId });

    if (!existing) {
      return loginId;
    }
  }

  throw new AppError('Unable to generate a unique login ID. Please try again.', 500);
};

module.exports = {
  generateLoginId,
  formatSequence,
};
