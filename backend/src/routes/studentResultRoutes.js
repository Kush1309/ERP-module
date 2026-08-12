const express = require('express');
const router = express.Router();
const studentResultController = require('../controllers/studentResultController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

router.use(authenticateUser);
router.use(authorizeRoles(ROLES.STUDENT));

router.get('/', studentResultController.getStudentResults);
router.get('/:examId', studentResultController.getStudentResultByExam);

module.exports = router;
