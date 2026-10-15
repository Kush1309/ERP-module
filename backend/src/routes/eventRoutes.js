const express = require('express');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// All event routes require authentication
router.use(authenticateUser);

// List and view events – accessible to all authenticated roles
router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT, ROLES.ACCOUNTANT, ROLES.LIBRARIAN), getEvents);
router.get('/:id', authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT, ROLES.ACCOUNTANT, ROLES.LIBRARIAN), getEventById);

// Mutations – ADMIN only
router.post('/', authorizeRoles(ROLES.ADMIN), createEvent);
router.put('/:id', authorizeRoles(ROLES.ADMIN), updateEvent);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), deleteEvent);

module.exports = router;
