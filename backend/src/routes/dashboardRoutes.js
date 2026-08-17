const express = require('express');
const { getAdminDashboardMetrics } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(protect);

router.get('/admin', authorize(ROLES.ADMIN), getAdminDashboardMetrics);

module.exports = router;
