const express = require('express');
const {
    getStudentTimetables,
    getStudentTimetableById
} = require('../controllers/studentTimetableController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get('/', authenticateUser, authorizeRoles(ROLES.STUDENT), getStudentTimetables);
router.get('/:id', authenticateUser, authorizeRoles(ROLES.STUDENT), getStudentTimetableById);

module.exports = router;
