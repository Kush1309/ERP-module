const express = require('express');
const {
    createAttendance,
    getAttendances,
    getMyAttendance,
    getAttendanceById,
    updateAttendance,
    getTeacherRoster,
    createBulkAttendance,
    getTeacherAttendanceHistory,
    updateTeacherAttendance,
    getTeacherAttendanceReport,
    getMyAttendanceHistory,
    getAdminAttendanceReport,
    getAdminAttendanceRecords,
    getAdminAttendanceById,
    updateAdminAttendance,
    deleteAdminAttendance
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

router.get(
    '/me/history',
    authenticateUser,
    authorizeRoles(ROLES.STUDENT),
    getMyAttendanceHistory
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

router.get(
    '/teacher/report',
    authenticateUser,
    authorizeRoles(ROLES.TEACHER),
    getTeacherAttendanceReport
);

router.patch(
    '/teacher/:id',
    authenticateUser,
    authorizeRoles(ROLES.TEACHER),
    updateTeacherAttendance
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

router.get(
    '/admin/report',
    authenticateUser,
    authorizeRoles(ROLES.ADMIN),
    getAdminAttendanceReport
);

router.get(
    '/admin/records',
    authenticateUser,
    authorizeRoles(ROLES.ADMIN),
    getAdminAttendanceRecords
);

router.get(
    '/admin/records/:id',
    authenticateUser,
    authorizeRoles(ROLES.ADMIN),
    getAdminAttendanceById
);

router.patch(
    '/admin/records/:id',
    authenticateUser,
    authorizeRoles(ROLES.ADMIN),
    updateAdminAttendance
);

router.delete(
    '/admin/records/:id',
    authenticateUser,
    authorizeRoles(ROLES.ADMIN),
    deleteAdminAttendance
);

router.patch(
    '/:id',
    authenticateUser,
    authorizeRoles(ROLES.ADMIN),
    updateAttendance
);

module.exports = router;
