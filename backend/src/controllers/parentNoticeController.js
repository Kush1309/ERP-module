const asyncHandler = require('../utils/asyncHandler');
const parentNoticeService = require('../services/parentNoticeService');

const getParentNotices = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const notices = await parentNoticeService.getParentNotices(userId, req.query);

    res.status(200).json({
        status: 'success',
        results: notices.length,
        data: notices,
    });
});

const getParentNoticeById = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;

    const notice = await parentNoticeService.getParentNoticeById(userId, id);

    res.status(200).json({
        status: 'success',
        data: notice,
    });
});

module.exports = {
    getParentNotices,
    getParentNoticeById,
};
