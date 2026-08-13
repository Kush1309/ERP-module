const express = require('express');
const {
    createNotice,
    getNotices,
    getNoticeById,
    updateNotice,
    deleteNotice,
    publishNotice,
    archiveNotice
} = require('../controllers/noticeController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles(ROLES.ADMIN));

router.post('/', createNotice);
router.get('/', getNotices);
router.get('/:id', getNoticeById);
router.put('/:id', updateNotice);
router.delete('/:id', deleteNotice);
router.patch('/:id/publish', publishNotice);
router.patch('/:id/archive', archiveNotice);

module.exports = router;
