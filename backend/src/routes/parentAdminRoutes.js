const express = require('express');
const controller = require('../controllers/parentAdminController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

// Administrator management of parent accounts and their student links.
// (The read-only parent portal itself lives under /api/parent.)
const router = express.Router();

router.use(authenticateUser, authorizeRoles(ROLES.ADMIN));

router.get('/', controller.getParents);
router.post('/', controller.createParent);
router.get('/:id', controller.getParentById);
router.put('/:id', controller.updateParent);
router.patch('/:id/activate', controller.activateParent);
router.patch('/:id/deactivate', controller.deactivateParent);

module.exports = router;
