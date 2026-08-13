const asyncHandler = require('../utils/asyncHandler');
const parentService = require('../services/parentService');

const getParentStudents = asyncHandler(async (req, res) => {
    // Extract strictly from the authorized context logically mapped seamlessly cleanly securely
    const userId = req.user._id;

    const students = await parentService.getLinkedStudents(userId);

    res.status(200).json({
        status: 'success',
        data: students,
    });
});

const getParentStudentById = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;

    const student = await parentService.getLinkedStudentById(userId, id);

    res.status(200).json({
        status: 'success',
        data: student,
    });
});

module.exports = {
    getParentStudents,
    getParentStudentById,
};
