const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const parentController = require('../controllers/parentController');

const router = express.Router();

// Enforce extremely tight mapping checking implicitly roles securely
router.use(authenticateUser);
router.use(authorizeRoles(ROLES.PARENT));

router.get('/students', parentController.getParentStudents);
router.get('/students/:id', parentController.getParentStudentById);

module.exports = router;
