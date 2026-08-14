const express = require('express');
const {
    createHomework,
    getHomeworks,
    getHomeworkById,
    updateHomework,
    deleteHomework
} = require('../controllers/homeworkController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(authenticateUser);

// All authenticated roles can access LIST and GET BY ID endpoints
router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT), getHomeworks);
router.get('/:id', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT), getHomeworkById);

// Only ADMIN and TEACHER can mutate homework
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), createHomework);
router.put('/:id', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), updateHomework);
router.delete('/:id', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), deleteHomework);

module.exports = router;
