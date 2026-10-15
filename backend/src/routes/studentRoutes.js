const express = require('express');
const { createStudent, getStudents, getStudentById, updateStudent, activateStudentAccount, deactivateStudentAccount, getCurrentStudent, exportAdminStudents, bulkActivateStudents, bulkDeactivateStudents, importAdminStudents } = require('../controllers/studentController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.post('/', authenticateUser, authorizeRoles(ROLES.ADMIN), createStudent);
router.get('/', authenticateUser, authorizeRoles(ROLES.ADMIN), getStudents);
router.post('/admin/import', authenticateUser, authorizeRoles(ROLES.ADMIN), importAdminStudents);
router.get('/admin/export', authenticateUser, authorizeRoles(ROLES.ADMIN), exportAdminStudents);
router.patch('/bulk/activate', authenticateUser, authorizeRoles(ROLES.ADMIN), bulkActivateStudents);
router.patch('/bulk/deactivate', authenticateUser, authorizeRoles(ROLES.ADMIN), bulkDeactivateStudents);
const asyncHandler = require('../utils/asyncHandler');
const studentService = require('../services/studentService');
router.post('/promote', authenticateUser, authorizeRoles(ROLES.ADMIN), asyncHandler(async (req, res) => {
    const data = await studentService.promoteStudents(req.body);
    res.json({ success: true, message: `${data.affected} student(s) updated`, data });
}));
router.patch('/:id/status', authenticateUser, authorizeRoles(ROLES.ADMIN), asyncHandler(async (req, res) => {
    const data = await studentService.setStudentLifecycleStatus(req.params.id, String(req.body.status || '').toUpperCase());
    res.json({ success: true, message: 'Student status updated', data });
}));
router.get('/me', authenticateUser, authorizeRoles(ROLES.STUDENT), getCurrentStudent);
router.get('/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), getStudentById);
router.put('/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), updateStudent);
router.patch('/:id/activate', authenticateUser, authorizeRoles(ROLES.ADMIN), activateStudentAccount);
router.patch('/:id/deactivate', authenticateUser, authorizeRoles(ROLES.ADMIN), deactivateStudentAccount);

module.exports = router;
