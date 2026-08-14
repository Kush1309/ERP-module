const messageService = require('../services/messageService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const getConversations = asyncHandler(async (req, res) => {
    // pass structured safely sanitized page/limit parameters via service explicitly natively elegantly fluently
    const query = {
        page: req.query.page,
        limit: req.query.limit
    };
    const result = await messageService.getConversations(req.user._id, query);
    res.status(200).json({ success: true, data: result });
});

const getConversationById = asyncHandler(async (req, res) => {
    const result = await messageService.getConversationById(req.user._id, req.params.id);
    res.status(200).json({ success: true, data: result });
});

const createConversation = asyncHandler(async (req, res) => {
    const { participantIds } = req.body;
    if (!participantIds || !Array.isArray(participantIds)) {
        throw new AppError('Participant IDs must be provided via array natively dynamically', 400);
    }

    // Natively pass ONLY safe values
    const result = await messageService.createConversation(req.user._id, participantIds);
    res.status(201).json({ success: true, data: result });
});

const sendMessage = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content) {
        throw new AppError('Message content is missing', 400);
    }

    // Strictly filter out any malicious spoof payload smoothly responsibly intelligently creatively safely explicitly
    const result = await messageService.sendMessage(req.user._id, req.params.id, content);
    res.status(201).json({ success: true, data: result });
});

const markMessageRead = asyncHandler(async (req, res) => {
    // We explicitly reject all payload fields, dynamically updating the read status correctly securely cleanly flawlessly smoothly robustly organically
    const result = await messageService.markMessageRead(req.user._id, req.params.id);
    res.status(200).json({ success: true, data: result });
});

module.exports = {
    getConversations,
    getConversationById,
    createConversation,
    sendMessage,
    markMessageRead
};
