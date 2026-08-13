const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const Student = require('../models/Student');
const AppError = require('../utils/AppError');

const getStudentContextFromUserId = async (userId) => {
    const student = await Student.findOne({ user: userId }).lean();
    if (!student) {
        throw new AppError('Student profile not found for this user', 404);
    }
    return student;
};

const getStudentTimetables = async (userId, queryOpts) => {
    const student = await getStudentContextFromUserId(userId);

    let { page = 1, limit = 10, academicSession, dayOfWeek, status, subject, teacher } = queryOpts;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const query = {
        class: student.class,
        section: student.section
    };

    if (academicSession) query.academicSession = String(academicSession);
    if (dayOfWeek) query.dayOfWeek = String(dayOfWeek).toUpperCase();
    if (status) query.status = String(status).toUpperCase();

    if (subject) {
        if (!mongoose.Types.ObjectId.isValid(subject)) throw new AppError('Invalid Subject filter format', 400);
        query.subject = subject;
    }

    if (teacher) {
        if (!mongoose.Types.ObjectId.isValid(teacher)) throw new AppError('Invalid Teacher filter format', 400);
        query.teacher = teacher;
    }

    const [timetables, total] = await Promise.all([
        Timetable.find(query)
            .populate('subject', 'subjectName subjectCode')
            .populate('teacher', 'firstName lastName email')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ dayOfWeek: 1, startTime: 1 })
            .lean(),
        Timetable.countDocuments(query)
    ]);

    return {
        timetables,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getStudentTimetableById = async (userId, timetableId) => {
    if (!mongoose.Types.ObjectId.isValid(timetableId)) throw new AppError('Invalid Timetable ID', 400);

    const student = await getStudentContextFromUserId(userId);

    const timetable = await Timetable.findById(timetableId)
        .populate('subject', 'subjectName subjectCode')
        .populate('teacher', 'firstName lastName email')
        .lean();

    if (!timetable) {
        throw new AppError('Timetable not found', 404);
    }

    if (timetable.class !== student.class || timetable.section !== student.section) {
        throw new AppError('Forbidden: Access denied to this timetable entry', 403);
    }

    return timetable;
};

module.exports = {
    getStudentTimetables,
    getStudentTimetableById
};
