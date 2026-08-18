const express = require('express');
const { getAdminDashboardMetrics, getStudentDashboardMetrics } = require('../controllers/dashboardController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(authenticateUser);

router.get('/admin', authorizeRoles(ROLES.ADMIN), getAdminDashboardMetrics);
router.get('/student', authorizeRoles(ROLES.STUDENT), getStudentDashboardMetrics);

module.exports = router;
