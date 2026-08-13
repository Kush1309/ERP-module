const teacherNoticeService = require('../services/teacherNoticeService');
const asyncHandler = require('../utils/asyncHandler');

const getTeacherNotices = asyncHandler(async (req, res) => {
    const result = await teacherNoticeService.getTeacherNotices(req.query);
    res.status(200).json({ success: true, data: result });
});

const getTeacherNoticeById = asyncHandler(async (req, res) => {
    const notice = await teacherNoticeService.getTeacherNoticeById(req.params.id);
    res.status(200).json({ success: true, data: notice });
});

module.exports = {
    getTeacherNotices,
    getTeacherNoticeById
};
