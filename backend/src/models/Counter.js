const mongoose = require('mongoose');
const { ROLE_VALUES } = require('../constants/roles');

/**
 * Atomic counters for login ID sequences per role + year.
 * Used to reduce race conditions when creating multiple users concurrently.
 */
const counterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    seq: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
