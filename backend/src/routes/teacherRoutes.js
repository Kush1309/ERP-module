const express = require('express');
const { createTeacher } = require('../controllers/teacherController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Only ADMIN can create Teacher accounts
router.post('/', authenticateUser, authorizeRoles(ROLES.ADMIN), createTeacher);

module.exports = router;
