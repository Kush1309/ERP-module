const express = require('express');
const {
    createAttendance,
    getAttendances,
    getMyAttendance,
    getAttendanceById,
    updateAttendance,
    getTeacherRoster,
    createBulkAttendance,
    getTeacherAttendanceHistory
} = require('../controllers/attendanceController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// ----------------------------------------------------
// STUDENT Routes
// ----------------------------------------------------
// Must be registered before /:id parameter to avoid "me" being parsed as ID
router.get(
    '/me',
    authenticateUser,
    authorizeRoles(ROLES.STUDENT),
    getMyAttendance
);

// ----------------------------------------------------
// TEACHER Routes
// ----------------------------------------------------
router.get(
    '/roster',
    authenticateUser,
    authorizeRoles(ROLES.TEACHER),
    getTeacherRoster
);

router.get(
    '/teacher/history',
    authenticateUser,
    authorizeRoles(ROLES.TEACHER),
    getTeacherAttendanceHistory
);

router.post(
    '/bulk',
    authenticateUser,
    authorizeRoles(ROLES.TEACHER),
    createBulkAttendance
);

// ----------------------------------------------------
// ADMIN Routes
// ----------------------------------------------------
router.post(
    '/',
    authenticateUser,
    authorizeRoles(ROLES.ADMIN),
    createAttendance
);

router.get(
    '/',
    authenticateUser,
    authorizeRoles(ROLES.ADMIN),
    getAttendances
);

router.get(
    '/:id',
    authenticateUser,
    authorizeRoles(ROLES.ADMIN),
    getAttendanceById
);

router.patch(
    '/:id',
    authenticateUser,
    authorizeRoles(ROLES.ADMIN),
    updateAttendance
);

module.exports = router;
