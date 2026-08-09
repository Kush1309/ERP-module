const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

/**
 * Temporary role-gated endpoints used to verify authorizeRoles middleware.
 * These are intentionally minimal and will be replaced by real modules later.
 */
router.get(
  '/admin',
  authenticateUser,
  authorizeRoles(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Admin access granted',
      data: { role: req.user.role, loginId: req.user.loginId },
    });
  })
);

router.get(
  '/teacher',
  authenticateUser,
  authorizeRoles(ROLES.ADMIN, ROLES.TEACHER),
  asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Teacher access granted',
      data: { role: req.user.role, loginId: req.user.loginId },
    });
  })
);

module.exports = router;
