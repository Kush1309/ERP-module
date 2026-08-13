const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const AppError = require('../utils/AppError');

// Helper to convert HH:MM to minutes since midnight for easy comparison
const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

const checkConflicts = async (data, excludeId = null) => {
    const { teacher, class: className, section, room, dayOfWeek, startTime, endTime, academicSession } = data;

    // Exact duplicate check
    const duplicateQuery = {
        academicSession,
        class: className,
        section: section || '',
        dayOfWeek,
        startTime,
        endTime
    };
    if (excludeId) duplicateQuery._id = { $ne: excludeId };

    const exactDuplicate = await Timetable.findOne(duplicateQuery).lean();
    if (exactDuplicate) {
        throw new AppError('An exact matching timetable entry already exists', 409);
    }

    // Conflict queries wrapper
    // Conflict condition: newStart < existingEnd AND newEnd > existingStart
    // Since everything is stored as HH:MM strings with zero-padding (e.g. 09:00), natural string comparison works identically to minutes.
    // However, to strictly follow exact math checks avoiding MongoDB string logic pitfalls on boundaries, we use $expr.

    const conflictQuery = {
        academicSession,
        dayOfWeek,
        $expr: {
            $and: [
                { $lt: [{ $toInt: { $replaceAll: { input: "$startTime", find: ":", replacement: "" } } }, timeToMinutes(endTime) * 100] }, // approximation approach: actually just use string comparison which works perfectly for HH:MM strictly
            ]
        }
    };

    // Because HH:MM string comparison works flawlessly for 24hr format:
    // "09:00" < "10:00" is true in Mongo.
    // newStart < existingEnd => startTime < existing.endTime => existing.endTime > startTime
    // newEnd > existingStart => endTime > existing.startTime => existing.startTime < endTime
    const baseConflictCondition = {
        academicSession,
        dayOfWeek,
        endTime: { $gt: startTime },
        startTime: { $lt: endTime }
    };

    if (excludeId) {
        baseConflictCondition._id = { $ne: excludeId };
    }

    // 1. Teacher Conflict
    const teacherConflict = await Timetable.findOne({
        ...baseConflictCondition,
        teacher
    }).lean();
    if (teacherConflict) {
        throw new AppError(`Teacher double-booking conflict on ${dayOfWeek} between ${teacherConflict.startTime} and ${teacherConflict.endTime}`, 409);
    }

    // 2. Class/Section Conflict
    const classConflict = await Timetable.findOne({
        ...baseConflictCondition,
        class: className,
        section: section || ''
    }).lean();
    if (classConflict) {
        throw new AppError(`Class/Section double-booking conflict on ${dayOfWeek} between ${classConflict.startTime} and ${classConflict.endTime}`, 409);
    }

    // 3. Room Conflict
    const roomConflict = await Timetable.findOne({
        ...baseConflictCondition,
        room
    }).lean();
    if (roomConflict) {
        throw new AppError(`Room double-booking conflict on ${dayOfWeek} between ${roomConflict.startTime} and ${roomConflict.endTime}`, 409);
    }
};

const createTimetable = async (data) => {
    // Basic validation
    const { teacher, subject, class: className, dayOfWeek, startTime, endTime } = data;

    if (!mongoose.Types.ObjectId.isValid(teacher)) throw new AppError('Invalid Teacher ID', 400);
    if (!mongoose.Types.ObjectId.isValid(subject)) throw new AppError('Invalid Subject ID', 400);

    const teacherExists = await Teacher.findById(teacher).lean();
    if (!teacherExists) throw new AppError('Referenced Teacher does not exist', 404);

    const subjectExists = await Subject.findById(subject).lean();
    if (!subjectExists) throw new AppError('Referenced Subject does not exist', 404);

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
        throw new AppError('Start time must strictly precede End time', 400);
    }

    await checkConflicts(data);

    const timetable = await Timetable.create(data);
    return timetable;
};

const getTimetables = async (queryOpts) => {
    let { page = 1, limit = 10, academicSession, class: className, section, teacher, subject, dayOfWeek, status } = queryOpts;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const query = {};

    if (academicSession) query.academicSession = String(academicSession);
    if (className) query.class = String(className);
    if (section) query.section = String(section);
    if (dayOfWeek) query.dayOfWeek = String(dayOfWeek).toUpperCase();
    if (status) query.status = String(status).toUpperCase();

    if (teacher) {
        if (!mongoose.Types.ObjectId.isValid(teacher)) throw new AppError('Invalid Teacher filter format', 400);
        query.teacher = teacher;
    }

    if (subject) {
        if (!mongoose.Types.ObjectId.isValid(subject)) throw new AppError('Invalid Subject filter format', 400);
        query.subject = subject;
    }

    const [timetables, total] = await Promise.all([
        Timetable.find(query)
            .populate('teacher', 'firstName lastName employeeId')
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

const getTimetableById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Timetable ID', 400);

    const timetable = await Timetable.findById(id)
        .populate('teacher', 'firstName lastName employeeId')
        .populate('subject', 'subjectName subjectCode')
        .lean();

    if (!timetable) {
        throw new AppError('Timetable not found', 404);
    }

    return timetable;
};

const updateTimetable = async (id, data) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Timetable ID', 400);

    const existing = await Timetable.findById(id).lean();
    if (!existing) {
        throw new AppError('Timetable not found', 404);
    }

    const allowedUpdates = [
        'academicSession', 'class', 'section', 'dayOfWeek',
        'startTime', 'endTime', 'subject', 'teacher', 'room', 'status'
    ];

    const safeUpdate = {};
    for (const key of allowedUpdates) {
        if (data[key] !== undefined) safeUpdate[key] = data[key];
    }

    if (Object.keys(safeUpdate).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    // Merge existing with safeUpdate to check conflicts correctly
    const mergedData = { ...existing, ...safeUpdate };

    if (safeUpdate.teacher && !mongoose.Types.ObjectId.isValid(safeUpdate.teacher)) throw new AppError('Invalid Teacher ID', 400);
    if (safeUpdate.subject && !mongoose.Types.ObjectId.isValid(safeUpdate.subject)) throw new AppError('Invalid Subject ID', 400);

    if (safeUpdate.teacher && safeUpdate.teacher.toString() !== existing.teacher.toString()) {
        const teacherExists = await Teacher.findById(safeUpdate.teacher).lean();
        if (!teacherExists) throw new AppError('Referenced Teacher does not exist', 404);
    }

    if (safeUpdate.subject && safeUpdate.subject.toString() !== existing.subject.toString()) {
        const subjectExists = await Subject.findById(safeUpdate.subject).lean();
        if (!subjectExists) throw new AppError('Referenced Subject does not exist', 404);
    }

    if (timeToMinutes(mergedData.startTime) >= timeToMinutes(mergedData.endTime)) {
        throw new AppError('Start time must strictly precede End time', 400);
    }

    await checkConflicts(mergedData, id);

    const updated = await Timetable.findByIdAndUpdate(
        id,
        { $set: safeUpdate },
        { new: true, runValidators: true }
    )
        .populate('teacher', 'firstName lastName employeeId')
        .populate('subject', 'subjectName subjectCode')
        .lean();

    return updated;
};

const deleteTimetable = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Timetable ID', 400);

    const deleted = await Timetable.findByIdAndDelete(id);
    if (!deleted) {
        throw new AppError('Timetable not found', 404);
    }

    return deleted;
};

module.exports = {
    createTimetable,
    getTimetables,
    getTimetableById,
    updateTimetable,
    deleteTimetable
};
