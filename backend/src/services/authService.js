const User = require('../models/User');
const AppError = require('../utils/AppError');
const { generateAccessToken } = require('../utils/jwt');
const {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} = require('../utils/password');
const { generateLoginId } = require('./loginIdService');
const { ROLE_VALUES } = require('../constants/roles');

const INVALID_CREDENTIALS_MESSAGE = 'Invalid login ID or password';

const createUserAccount = async ({
  role,
  password,
  mustChangePassword = true,
  isActive = true,
}) => {
  if (!ROLE_VALUES.includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.valid) {
    throw new AppError(passwordCheck.message, 400);
  }

  const loginId = await generateLoginId(role);
  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    loginId,
    password: hashedPassword,
    role,
    isActive,
    mustChangePassword,
  });

  return user;
};

const login = async ({ loginId, password }) => {
  if (!loginId || !password) {
    throw new AppError('Login ID and password are required', 400);
  }

  const normalizedLoginId = String(loginId).trim().toUpperCase();

  const user = await User.findOne({ loginId: normalizedLoginId }).select('+password');

  if (!user) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is inactive. Contact the administrator.', 403);
  }

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    loginId: user.loginId,
    role: user.role,
  });

  return {
    user: user.toSafeObject(),
    accessToken,
  };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }

  return user.toSafeObject();
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  const passwordCheck = validatePasswordStrength(newPassword);
  if (!passwordCheck.valid) {
    throw new AppError(passwordCheck.message, 400);
  }

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from the current password', 400);
  }

  const user = await User.findById(userId).select('+password');

  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }

  const isMatch = await comparePassword(currentPassword, user.password);

  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = await hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();

  return user.toSafeObject();
};

module.exports = {
  createUserAccount,
  login,
  getCurrentUser,
  changePassword,
};
