const studentNoticeService = require('../services/studentNoticeService');
const asyncHandler = require('../utils/asyncHandler');

const getStudentNotices = asyncHandler(async (req, res) => {
    const result = await studentNoticeService.getStudentNotices(req.user.id, req.query);
    res.status(200).json({ success: true, data: result });
});

const getStudentNoticeById = asyncHandler(async (req, res) => {
    const notice = await studentNoticeService.getStudentNoticeById(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: notice });
});

module.exports = {
    getStudentNotices,
    getStudentNoticeById
};
