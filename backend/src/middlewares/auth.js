const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/jwt');

const authenticateUser = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  const decoded = verifyAccessToken(token);

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new AppError('Authentication required', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is inactive', 403);
  }

  req.user = {
    id: user._id.toString(),
    loginId: user.loginId,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
  };

  next();
});

const authorizeRoles = (...roles) => {
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to access this resource', 403));
    }

    return next();
  };
};

module.exports = {
  authenticateUser,
  authorizeRoles,
};
