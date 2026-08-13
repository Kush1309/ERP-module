const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');
const parentNoticeController = require('../controllers/parentNoticeController');

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles(ROLES.PARENT));

router.get('/', parentNoticeController.getParentNotices);
router.get('/:id', parentNoticeController.getParentNoticeById);

module.exports = router;
