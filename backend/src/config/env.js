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

  // The placeholder from .env.example / docker-compose must never reach production
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.startsWith('change_this')) {
    throw new Error('JWT_SECRET is still the example placeholder. Set a long random secret for production.');
  }
};

module.exports = { validateEnv };
