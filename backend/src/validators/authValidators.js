const AppError = require('../utils/AppError');

const validateLoginInput = (body) => {
  const loginId = typeof body.loginId === 'string' ? body.loginId.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!loginId || !password) {
    throw new AppError('Login ID and password are required', 400);
  }

  return { loginId, password };
};

const validateChangePasswordInput = (body) => {
  const currentPassword =
    typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  return { currentPassword, newPassword };
};

module.exports = {
  validateLoginInput,
  validateChangePasswordInput,
};
