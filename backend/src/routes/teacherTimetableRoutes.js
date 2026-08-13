const express = require('express');
const {
    getTeacherTimetables,
    getTeacherTimetableById
} = require('../controllers/teacherTimetableController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get('/', authenticateUser, authorizeRoles(ROLES.TEACHER), getTeacherTimetables);
router.get('/:id', authenticateUser, authorizeRoles(ROLES.TEACHER), getTeacherTimetableById);

module.exports = router;
