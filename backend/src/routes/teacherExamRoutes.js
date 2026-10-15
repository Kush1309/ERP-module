const express = require('express');
const router = express.Router();
const teacherExamController = require('../controllers/teacherExamController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

router.use(authenticateUser);
router.use(authorizeRoles(ROLES.TEACHER));

router.get('/', teacherExamController.getTeacherExams);
router.get('/subjects', teacherExamController.getTeacherSubjects);
router.get('/:id', teacherExamController.getTeacherExamById);
router.get('/:id/students', teacherExamController.getTeacherExamStudents);
router.get('/:id/results', teacherExamController.getTeacherExamResults);
router.post('/:examId/results', teacherExamController.createTeacherResult);
router.put('/results/:resultId', teacherExamController.updateTeacherResult);

module.exports = router;
