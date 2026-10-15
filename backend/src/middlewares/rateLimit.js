const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

/**
 * Brute-force protection for the login endpoint.
 *
 * - Only FAILED attempts are counted, so a whole school logging in from one
 *   shared (NAT) IP address is not locked out by successful logins.
 * - Attempts are tracked per IP + login ID, so one person mistyping a
 *   password cannot block everyone else behind the same IP.
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const loginId = typeof req.body?.loginId === 'string' ? req.body.loginId.trim().toUpperCase() : '';
    return `${ipKeyGenerator(req.ip)}:${loginId}`;
  },
  message: {
    success: false,
    message: 'Too many failed login attempts. Please try again in 15 minutes.',
  },
});

module.exports = {
  loginRateLimiter,
};
