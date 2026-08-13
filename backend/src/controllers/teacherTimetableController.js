const teacherTimetableService = require('../services/teacherTimetableService');
const asyncHandler = require('../utils/asyncHandler');

const getTeacherTimetables = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await teacherTimetableService.getTeacherTimetables(userId, req.query);

    res.status(200).json({
        success: true,
        data: result
    });
});

const getTeacherTimetableById = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await teacherTimetableService.getTeacherTimetableById(userId, req.params.id);

    res.status(200).json({
        success: true,
        data: result
    });
});

module.exports = {
    getTeacherTimetables,
    getTeacherTimetableById
};
