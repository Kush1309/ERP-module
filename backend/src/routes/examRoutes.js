const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const resultExamRoutes = require('./resultExamRoutes');

// Apply protection to all routes: only Admins can manage exams for now
router.use(authenticateUser);
router.use(authorizeRoles(ROLES.ADMIN));

router.use('/:examId/results', resultExamRoutes);

router
    .route('/')
    .get(examController.getExams)
    .post(examController.createExam);

router
    .route('/:id')
    .get(examController.getExamById)
    .put(examController.updateExam)
    .delete(examController.deleteExam);

module.exports = router;
