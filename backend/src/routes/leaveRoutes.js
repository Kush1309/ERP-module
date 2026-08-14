const express = require('express');
const {
    createLeave,
    getLeaves,
    getLeaveById,
    updateLeave,
    deleteLeave,
    updateLeaveStatus
} = require('../controllers/leaveController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(authenticateUser);

router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT), getLeaves);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT), createLeave);

router.patch('/:id/status', authorizeRoles(ROLES.ADMIN), updateLeaveStatus);

router.get('/:id', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT), getLeaveById);
router.put('/:id', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT), updateLeave);
router.delete('/:id', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT), deleteLeave);

module.exports = router;
