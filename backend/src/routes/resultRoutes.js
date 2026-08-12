const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

// Apply protection to all routes: only Admins can manage results
router.use(authenticateUser);
router.use(authorizeRoles(ROLES.ADMIN));

router
    .route('/:id')
    .get(resultController.getResultById)
    .put(resultController.updateResult);

module.exports = router;
