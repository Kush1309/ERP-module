const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const Teacher = require('../models/Teacher');
const AppError = require('../utils/AppError');

const getTeacherIdFromUserId = async (userId) => {
    const teacher = await Teacher.findOne({ user: userId }).lean();
    if (!teacher) {
        throw new AppError('Teacher profile not found for this user', 404);
    }
    return teacher._id;
};

const getTeacherTimetables = async (userId, queryOpts) => {
    const teacherId = await getTeacherIdFromUserId(userId);

    let { page = 1, limit = 10, academicSession, class: className, section, dayOfWeek, status, subject } = queryOpts;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const query = { teacher: teacherId };

    if (academicSession) query.academicSession = String(academicSession);
    if (className) query.class = String(className);
    if (section) query.section = String(section);
    if (dayOfWeek) query.dayOfWeek = String(dayOfWeek).toUpperCase();
    if (status) query.status = String(status).toUpperCase();

    if (subject) {
        if (!mongoose.Types.ObjectId.isValid(subject)) throw new AppError('Invalid Subject filter format', 400);
        query.subject = subject;
    }

    const [timetables, total] = await Promise.all([
        Timetable.find(query)
            .populate('subject', 'subjectName subjectCode')
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

const getTeacherTimetableById = async (userId, timetableId) => {
    if (!mongoose.Types.ObjectId.isValid(timetableId)) throw new AppError('Invalid Timetable ID', 400);

    const teacherId = await getTeacherIdFromUserId(userId);

    const timetable = await Timetable.findById(timetableId)
        .populate('subject', 'subjectName subjectCode')
        .lean();

    if (!timetable) {
        throw new AppError('Timetable not found', 404);
    }

    if (timetable.teacher.toString() !== teacherId.toString()) {
        throw new AppError('Forbidden: Access denied to this timetable entry', 403);
    }

    return timetable;
};

module.exports = {
    getTeacherTimetables,
    getTeacherTimetableById
};
