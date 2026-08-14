const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const parentAttendanceController = require('../controllers/parentAttendanceController');

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles(ROLES.PARENT));

router.get('/students/:id/attendance', parentAttendanceController.getStudentAttendance);

module.exports = router;
