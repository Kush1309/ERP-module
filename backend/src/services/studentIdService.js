const Counter = require('../models/Counter');
const AppError = require('../utils/AppError');
const { ROLES } = require('../constants/roles');

const STUDENT_ID_PREFIX = 'STU';

const formatSequence = (seq) => String(seq).padStart(6, '0');

/**
 * Generates unique student profile IDs:
 * STU2026000001, STU2026000002, ...
 *
 * Format: STU + YEAR + 6 DIGITS
 * Uses an atomic counter (separate key from login ID counters) with uniqueness retry.
 */
const generateStudentId = async (maxAttempts = 5) => {
  const year = new Date().getFullYear();
  const counterKey = `STUDENT_ID:${year}`;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const counter = await Counter.findOneAndUpdate(
      { key: counterKey },
      {
        $inc: { seq: 1 },
        $setOnInsert: { role: ROLES.STUDENT, year },
      },
      {
        new: true,
        upsert: true,
      }
    );

    const studentId = `${STUDENT_ID_PREFIX}${year}${formatSequence(counter.seq)}`;

    // Lazy require avoids circular dependency with Student model.
    const Student = require('../models/Student');
    const existing = await Student.exists({ studentId });

    if (!existing) {
      return studentId;
    }
  }

  throw new AppError('Unable to generate a unique student ID. Please try again.', 500);
};

module.exports = {
  generateStudentId,
  formatSequence,
  STUDENT_ID_PREFIX,
};
