const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

// Apply protection to all routes: only Admins can manage subjects
router.use(authenticateUser);
router.use(authorizeRoles(ROLES.ADMIN));

router
    .route('/')
    .get(subjectController.getSubjects)
    .post(subjectController.createSubject);

router
    .route('/:id')
    .get(subjectController.getSubjectById)
    .put(subjectController.updateSubject)
    .delete(subjectController.deleteSubject);

module.exports = router;
