const asyncHandler = require('../utils/asyncHandler');
const parentAttendanceService = require('../services/parentAttendanceService');

const getStudentAttendance = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;

    // Safe mapping shielding internals gracefully
    const attendance = await parentAttendanceService.getStudentAttendance(userId, id, req.query);

    res.status(200).json({
        status: 'success',
        data: attendance,
    });
});

module.exports = {
    getStudentAttendance,
};
