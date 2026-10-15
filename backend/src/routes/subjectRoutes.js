const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

// Everyone signed in may read the subject list (names/codes are used for filters);
// only Admins can manage subjects
router.use(authenticateUser);
const admin = authorizeRoles(ROLES.ADMIN);
const readers = authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT);

router
    .route('/')
    .get(readers, subjectController.getSubjects)
    .post(admin, subjectController.createSubject);

router
    .route('/:id')
    .get(readers, subjectController.getSubjectById)
    .put(admin, subjectController.updateSubject)
    .delete(admin, subjectController.deleteSubject);

module.exports = router;
