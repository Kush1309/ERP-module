const express = require('express');
const router = express.Router();
const teacherExamController = require('../controllers/teacherExamController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

router.use(authenticateUser);
router.use(authorizeRoles(ROLES.TEACHER));

router.get('/', teacherExamController.getTeacherExams);
router.get('/:id', teacherExamController.getTeacherExamById);
router.post('/:examId/results', teacherExamController.createTeacherResult);
router.put('/results/:resultId', teacherExamController.updateTeacherResult);

module.exports = router;
