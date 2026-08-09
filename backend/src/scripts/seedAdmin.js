require('dotenv').config();

const { validateEnv } = require('../config/env');
const { connectDatabase } = require('../config/database');
const User = require('../models/User');
const { createUserAccount } = require('../services/authService');
const { ROLES } = require('../constants/roles');
const { validatePasswordStrength } = require('../utils/password');

/**
 * Development / initial-setup seed for the first ADMIN account.
 * Usage: npm run seed:admin
 *
 * Reads ADMIN_PASSWORD from environment.
 * Never prints the password.
 * Does not create a public registration endpoint.
 */
const seedAdmin = async () => {
  try {
    validateEnv();
    await connectDatabase();

    const existingAdmin = await User.findOne({ role: ROLES.ADMIN });

    if (existingAdmin) {
      console.log('Admin already exists.');
      console.log(`Login ID: ${existingAdmin.loginId}`);
      process.exit(0);
    }

    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      console.error('ADMIN_PASSWORD is required in the environment to seed an admin.');
      process.exit(1);
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      console.error(`Invalid ADMIN_PASSWORD: ${passwordCheck.message}`);
      process.exit(1);
    }

    const admin = await createUserAccount({
      role: ROLES.ADMIN,
      password,
      mustChangePassword: true,
      isActive: true,
    });

    console.log('Initial admin created successfully.');
    console.log(`Login ID: ${admin.loginId}`);
    console.log('Password was set from ADMIN_PASSWORD (not displayed).');
    console.log('Change the password after first login.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
