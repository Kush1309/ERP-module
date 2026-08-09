const express = require('express');
const {
  login,
  getCurrentUser,
  changePassword,
  logout,
} = require('../controllers/authController');
const { authenticateUser } = require('../middlewares/auth');
const { loginRateLimiter } = require('../middlewares/rateLimit');

const router = express.Router();

router.post('/login', loginRateLimiter, login);
router.get('/me', authenticateUser, getCurrentUser);
router.post('/change-password', authenticateUser, changePassword);
router.post('/logout', authenticateUser, logout);

module.exports = router;
