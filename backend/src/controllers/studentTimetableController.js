const studentTimetableService = require('../services/studentTimetableService');
const asyncHandler = require('../utils/asyncHandler');

const getStudentTimetables = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await studentTimetableService.getStudentTimetables(userId, req.query);

    res.status(200).json({
        success: true,
        data: result
    });
});

const getStudentTimetableById = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await studentTimetableService.getStudentTimetableById(userId, req.params.id);

    res.status(200).json({
        success: true,
        data: result
    });
});

module.exports = {
    getStudentTimetables,
    getStudentTimetableById
};
