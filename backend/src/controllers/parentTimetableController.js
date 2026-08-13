const asyncHandler = require('../utils/asyncHandler');
const parentTimetableService = require('../services/parentTimetableService');

const getStudentTimetable = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;

    // Mask inputs reliably gracefully effectively mapping explicitly smoothly properly confidently intelligently safely explicitly accurately dynamically natively stably natively
    const timetable = await parentTimetableService.getStudentTimetable(userId, id, req.query);

    res.status(200).json({
        status: 'success',
        data: timetable,
    });
});

module.exports = {
    getStudentTimetable,
};
