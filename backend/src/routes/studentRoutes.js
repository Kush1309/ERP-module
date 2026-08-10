const express = require('express');
const { createStudent, getStudents, getStudentById, updateStudent, activateStudentAccount, deactivateStudentAccount, getCurrentStudent } = require('../controllers/studentController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.post('/', authenticateUser, authorizeRoles(ROLES.ADMIN), createStudent);
router.get('/', authenticateUser, authorizeRoles(ROLES.ADMIN), getStudents);
router.get('/me', authenticateUser, authorizeRoles(ROLES.STUDENT), getCurrentStudent);
router.get('/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), getStudentById);
router.put('/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), updateStudent);
router.patch('/:id/activate', authenticateUser, authorizeRoles(ROLES.ADMIN), activateStudentAccount);
router.patch('/:id/deactivate', authenticateUser, authorizeRoles(ROLES.ADMIN), deactivateStudentAccount);

module.exports = router;
