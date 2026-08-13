const noticeService = require('../services/noticeService');
const asyncHandler = require('../utils/asyncHandler');

const createNotice = asyncHandler(async (req, res) => {
    const notice = await noticeService.createNotice(req.body, req.user.id);
    res.status(201).json({ success: true, data: notice });
});

const getNotices = asyncHandler(async (req, res) => {
    const result = await noticeService.getNotices(req.query);
    res.status(200).json({ success: true, data: result });
});

const getNoticeById = asyncHandler(async (req, res) => {
    const notice = await noticeService.getNoticeById(req.params.id);
    res.status(200).json({ success: true, data: notice });
});

const updateNotice = asyncHandler(async (req, res) => {
    const notice = await noticeService.updateNotice(req.params.id, req.body);
    res.status(200).json({ success: true, data: notice });
});

const deleteNotice = asyncHandler(async (req, res) => {
    await noticeService.deleteNotice(req.params.id);
    res.status(200).json({ success: true, message: 'Notice deleted successfully' });
});

const publishNotice = asyncHandler(async (req, res) => {
    const notice = await noticeService.publishNotice(req.params.id);
    res.status(200).json({ success: true, data: notice });
});

const archiveNotice = asyncHandler(async (req, res) => {
    const notice = await noticeService.archiveNotice(req.params.id);
    res.status(200).json({ success: true, data: notice });
});

module.exports = {
    createNotice,
    getNotices,
    getNoticeById,
    updateNotice,
    deleteNotice,
    publishNotice,
    archiveNotice
};
