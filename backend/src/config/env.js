const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'CLIENT_URL',
  'NODE_ENV',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
};

module.exports = { validateEnv };
