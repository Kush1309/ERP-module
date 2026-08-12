const studentService = require('../services/studentService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const createStudent = asyncHandler(async (req, res) => {
    const restrictedFields = ['studentId', 'loginId', 'password', 'passwordHash', 'role', 'refreshToken'];

    for (const field of restrictedFields) {
        if (req.body[field]) {
            throw new AppError(`Field '${field}' is not allowed in request body`, 400);
        }
    }

    const result = await studentService.createStudentAccount(req.body);

    res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: {
            student: {
                studentId: result.student.studentId,
                loginId: result.user.loginId,
                firstName: result.student.firstName,
                lastName: result.student.lastName,
                class: result.student.class,
                section: result.student.section,
                status: result.student.status,
            },
            credentials: {
                loginId: result.user.loginId,
                temporaryPassword: result.temporaryPassword,
            }
        }
    });
});

const getStudents = asyncHandler(async (req, res) => {
    const result = await studentService.getStudentsList(req.query);
    res.status(200).json({
        success: true,
        data: result
    });
});

const getStudentById = asyncHandler(async (req, res) => {
    const result = await studentService.getStudentById(req.params.id);
    res.status(200).json({
        success: true,
        data: result
    });
});

const updateStudent = asyncHandler(async (req, res) => {
    const updatedStudent = await studentService.updateStudentById(req.params.id, req.body);

    res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: {
            student: updatedStudent
        }
    });
});

const activateStudentAccount = asyncHandler(async (req, res) => {
    const result = await studentService.updateStudentStatus(req.params.id, true);
    res.status(200).json({
        success: true,
        message: 'Student activated successfully',
        data: result
    });
});

const deactivateStudentAccount = asyncHandler(async (req, res) => {
    const result = await studentService.updateStudentStatus(req.params.id, false);
    res.status(200).json({
        success: true,
        message: 'Student deactivated successfully',
        data: result
    });
});

const getCurrentStudent = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const student = await studentService.getCurrentStudent(userId);

    res.status(200).json({
        success: true,
        data: student
    });
});

const exportAdminStudents = asyncHandler(async (req, res) => {
    // Explicitly destructure only allowed filters from query
    const { search, status } = req.query;
    const classFilter = req.query.class;
    const sectionFilter = req.query.section;

    const csvData = await studentService.exportAdminStudents({
        search, status, class: classFilter, section: sectionFilter
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
    res.status(200).send(csvData);
});

module.exports = {
    createStudent,
    getStudents,
    getStudentById,
    updateStudent,
    activateStudentAccount,
    deactivateStudentAccount,
    getCurrentStudent,
    exportAdminStudents
};
