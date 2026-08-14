const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const parentResultController = require('../controllers/parentResultController');

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles(ROLES.PARENT));

router.get('/students/:id/results', parentResultController.getStudentResults);

module.exports = router;
