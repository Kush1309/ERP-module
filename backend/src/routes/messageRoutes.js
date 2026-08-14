const express = require('express');
const { authenticateUser } = require('../middlewares/auth');
const messageController = require('../controllers/messageController');

const router = express.Router();

router.use(authenticateUser);

router.get('/conversations', messageController.getConversations);
router.post('/conversations', messageController.createConversation);

router.get('/conversations/:id', messageController.getConversationById);
router.post('/conversations/:id', messageController.sendMessage);

router.patch('/:id/read', messageController.markMessageRead);

module.exports = router;
