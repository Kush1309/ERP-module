const { Attendance } = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

const createAttendance = async (attendanceData) => {
    const { student, date, status, remarks } = attendanceData;

    if (!student || !date || !status) {
        throw new AppError('Student, Date, and Status are required', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(student)) {
        throw new AppError('Invalid student ID format', 400);
    }

    // Verify student exists
    const existingStudent = await Student.findById(student);
    if (!existingStudent) {
        throw new AppError('Student not found', 404);
    }

    // Normalize date (ensure time is stripped to 00:00:00 UTC)
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    // Create attendance
    try {
        const attendance = await Attendance.create({
            student,
            date: normalizedDate,
            status,
            remarks
        });
        return attendance;
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError('Attendance already exists for this student on this date', 409);
        }
        throw error;
    }
};

const getAttendances = async (query = {}) => {
    const { page = 1, limit = 10, student, date, status } = query;
    const skip = (page - 1) * limit;

    let filter = {};

    if (student) filter.student = student;
    if (status) filter.status = status;
    if (date) {
        const queryDate = new Date(date);
        queryDate.setUTCHours(0, 0, 0, 0);
        filter.date = queryDate;
    }

    const attendances = await Attendance.find(filter)
        .populate('student', 'firstName lastName studentId class section rollNumber')
        .skip(skip)
        .limit(Number(limit))
        .sort({ date: -1 })
        .lean();

    const total = await Attendance.countDocuments(filter);

    return {
        attendances,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / limit)
        }
    };
};

const getAttendanceById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid attendance ID', 400);
    }

    const attendance = await Attendance.findById(id)
        .populate('student', 'firstName lastName studentId class section rollNumber')
        .lean();

    if (!attendance) {
        throw new AppError('Attendance record not found', 404);
    }

    return attendance;
};

const getMyAttendance = async (userId, query = {}) => {
    // 1. Find the student document representing this authenticated user
    const student = await Student.findOne({ user: userId });

    if (!student) {
        throw new AppError('Student profile not found based on authenticated user', 404);
    }

    // 2. Modify query to enforce the student's ID
    const forcedQuery = { ...query, student: student._id.toString() };

    return await getAttendances(forcedQuery);
};

const updateAttendance = async (id, updateData) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid attendance ID', 400);
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
        throw new AppError('Attendance record not found', 404);
    }

    // Only allow specific updates
    const { status, remarks, date } = updateData;

    if (status) attendance.status = status;
    if (remarks !== undefined) attendance.remarks = remarks;

    if (date) {
        const normalizedDate = new Date(date);
        normalizedDate.setUTCHours(0, 0, 0, 0);
        attendance.date = normalizedDate;
    }

    try {
        await attendance.save();
        return attendance;
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError('Attendance already exists for this student on the updated date', 409);
        }
        throw error;
    }
};

const getTeacherRoster = async (userId) => {
    const teacher = await Teacher.findOne({ user: userId }).lean();

    if (!teacher) {
        throw new AppError('Teacher profile not found for this user', 403);
    }

    const roster = await Student.find({
        class: teacher.assignedClass,
        section: teacher.assignedSection,
        status: 'ACTIVE'
    })
        .select('studentId firstName lastName rollNumber class section')
        .sort({ rollNumber: 1 })
        .lean();

    return roster;
};

const createBulkAttendance = async (userId, bulkData) => {
    const { date, attendance } = bulkData;

    if (!date || !attendance || !Array.isArray(attendance) || attendance.length === 0) {
        throw new AppError('Date and attendance array are required', 400);
    }

    const teacher = await Teacher.findOne({ user: userId }).lean();
    if (!teacher) {
        throw new AppError('Teacher profile not found for this user', 403);
    }

    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const studentIds = attendance.map(a => a.student);
    const uniqueStudentIds = [...new Set(studentIds)];

    if (studentIds.length !== uniqueStudentIds.length) {
        throw new AppError('Duplicate student entries in payload', 400);
    }

    for (const id of uniqueStudentIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError('Invalid student ID format in payload', 400);
        }
    }

    // ID TAMPERING PROTECTION: Verify EVERY student belongs to this teacher
    const students = await Student.find({ _id: { $in: uniqueStudentIds } }).lean();

    if (students.length !== uniqueStudentIds.length) {
        throw new AppError('One or more students not found', 400);
    }

    for (const st of students) {
        if (st.class !== teacher.assignedClass || st.section !== teacher.assignedSection) {
            throw new AppError('You are not authorized to mark attendance for these students.', 403);
        }
    }

    // CHECK DUPLICATES: Atomicity constraint
    const existing = await Attendance.find({
        date: normalizedDate,
        student: { $in: uniqueStudentIds }
    }).lean();

    if (existing.length > 0) {
        throw new AppError('Attendance already exists for one or more students.', 409);
    }

    // Map insert array
    const documents = attendance.map(record => {
        if (record.status !== 'PRESENT' && record.status !== 'ABSENT') {
            throw new AppError(`Invalid status for student ${record.student}`, 400);
        }
        return {
            student: record.student,
            date: normalizedDate,
            status: record.status
        };
    });

    // Write all atomically
    const inserted = await Attendance.insertMany(documents, { ordered: true });

    return inserted;
};

module.exports = {
    createAttendance,
    getAttendances,
    getAttendanceById,
    getMyAttendance,
    updateAttendance,
    getTeacherRoster,
    createBulkAttendance
};
