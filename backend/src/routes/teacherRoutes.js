const express = require('express');
const controller = require('../controllers/teacherController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get('/', authenticateUser, authorizeRoles(ROLES.ADMIN), controller.getTeachers);
router.get('/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), controller.getTeacherById);

// Only ADMIN can create Teacher accounts
router.post('/', authenticateUser, authorizeRoles(ROLES.ADMIN), controller.createTeacher);
router.put('/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), controller.updateTeacher);

module.exports = router;
