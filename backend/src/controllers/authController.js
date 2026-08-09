const asyncHandler = require('../utils/asyncHandler');
const {
  validateLoginInput,
  validateChangePasswordInput,
} = require('../validators/authValidators');
const authService = require('../services/authService');

const login = asyncHandler(async (req, res) => {
  const credentials = validateLoginInput(req.body);
  const result = await authService.login(credentials);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const passwords = validateChangePasswordInput(req.body);
  const user = await authService.changePassword({
    userId: req.user.id,
    ...passwords,
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    data: user,
  });
});

/**
 * Access-token-only strategy: logout is client-side token discard.
 * The server acknowledges logout; previously issued JWTs remain valid until expiry.
 */
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please discard the access token on the client.',
  });
});

module.exports = {
  login,
  getCurrentUser,
  changePassword,
  logout,
};
