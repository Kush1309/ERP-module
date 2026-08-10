const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const teacherService = require('../services/teacherService');

// POST /api/teachers
const createTeacher = asyncHandler(async (req, res) => {
    // Only extract expected fields. Ignore user-provided _id, role, password, etc.
    const {
        firstName,
        lastName,
        email,
        phone,
        assignedClass,
        assignedSection
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !assignedClass || !assignedSection) {
        throw new AppError('Missing required teacher fields (firstName, lastName, email, phone, assignedClass, assignedSection)', 400);
    }

    const teacherData = {
        firstName,
        lastName,
        email,
        phone,
        assignedClass,
        assignedSection
    };

    const { user, teacher, temporaryPassword } = await teacherService.createTeacherAccount(teacherData);

    // Format safe response matching project conventions
    res.status(201).json({
        success: true,
        message: 'Teacher created successfully',
        data: {
            teacher: {
                id: teacher._id,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                email: teacher.email,
                phone: teacher.phone,
                assignedClass: teacher.assignedClass,
                assignedSection: teacher.assignedSection,
                user: {
                    loginId: user.loginId,
                    role: user.role
                }
            },
            credentials: {
                loginId: user.loginId,
                temporaryPassword
            }
        }
    });
});

// GET /api/teachers
const getTeachers = asyncHandler(async (req, res) => {
    const result = await teacherService.getTeachersList(req.query);

    res.status(200).json({
        success: true,
        message: 'Teachers retrieved successfully',
        data: result
    });
});

// GET /api/teachers/:id
const getTeacherById = asyncHandler(async (req, res) => {
    const teacher = await teacherService.getTeacherById(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Teacher retrieved successfully',
        data: { teacher }
    });
});

module.exports = {
    createTeacher,
    getTeachers,
    getTeacherById
};
