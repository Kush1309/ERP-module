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

const getTeacherAttendanceHistory = async (userId, queryOpts = {}) => {
    const { page = 1, limit = 10, date, student, status } = queryOpts;

    // 1. Resolve teacher identity and authorized roster mapping based on class/section
    const teacher = await Teacher.findOne({ user: userId }).lean();
    if (!teacher) {
        throw new AppError('Teacher profile not found', 403);
    }

    const studentQuery = { class: teacher.assignedClass, section: teacher.assignedSection };

    if (student) {
        // Very safe simple escape for basic Regex
        const searchRegex = new RegExp(student.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
        studentQuery.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { rollNumber: searchRegex },
            { studentId: searchRegex }
        ];
    }

    const authorizedStudents = await Student.find(studentQuery, '_id').lean();
    const authorizedStudentIds = authorizedStudents.map(s => String(s._id));

    // 2. Base filter constrained to ONLY authorized students
    const filter = {
        student: { $in: authorizedStudentIds }
    };

    if (status && (status === 'PRESENT' || status === 'ABSENT')) {
        filter.status = status;
    }

    if (date) {
        const queryDate = new Date(date);
        if (isNaN(queryDate)) throw new AppError('Invalid date format', 400);
        queryDate.setUTCHours(0, 0, 0, 0);
        filter.date = queryDate;
    }

    // 3. Pagination values
    const safePage = Math.max(parseInt(page) || 1, 1);
    let safeLimit = parseInt(limit) || 10;
    if (safeLimit < 1) safeLimit = 10;
    if (safeLimit > 100) safeLimit = 100;
    const skip = (safePage - 1) * safeLimit;

    // 4. Fetch Paginated Records and Total Count concurrently
    const [attendances, total] = await Promise.all([
        Attendance.find(filter)
            .populate('student', 'firstName lastName studentId class section rollNumber')
            .skip(skip)
            .limit(safeLimit)
            .sort({ date: -1 })
            .lean(),
        Attendance.countDocuments(filter)
    ]);

    // 5. Build Aggregation Pipeline for Summary
    // Note: The summary counts EVERYTHING matching the filter within the Teacher's scope, ignoring skip/limit.
    const summaryAgg = await Attendance.aggregate([
        { $match: filter },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
                absent: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } }
            }
        }
    ]);

    const summaryRaw = summaryAgg.length > 0 ? summaryAgg[0] : { total: 0, present: 0, absent: 0 };
    const percentage = summaryRaw.total > 0 ? Math.round((summaryRaw.present / summaryRaw.total) * 100) : 0;

    const summary = {
        total: summaryRaw.total,
        present: summaryRaw.present,
        absent: summaryRaw.absent,
        percentage
    };

    return {
        attendances,
        summary,
        pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            pages: Math.ceil(total / safeLimit)
        }
    };
};

const getTeacherAttendanceReport = async (userId, queryOpts = {}) => {
    const { startDate, endDate, search, status, page = 1, limit = 10 } = queryOpts;

    // 1. Resolve Teacher Identity
    const teacher = await Teacher.findOne({ user: userId }).lean();
    if (!teacher) {
        throw new AppError('Teacher profile not found', 403);
    }

    // 2. Validate Dates Safely
    let startD, endD;
    if (startDate) {
        startD = new Date(startDate);
        if (isNaN(startD)) throw new AppError('Invalid start date', 400);
        startD.setUTCHours(0, 0, 0, 0);
    }
    if (endDate) {
        endD = new Date(endDate);
        if (isNaN(endD)) throw new AppError('Invalid end date', 400);
        endD.setUTCHours(23, 59, 59, 999); // Inclusion till end of day
    }
    if (startD && endD && startD > endD) {
        throw new AppError('Start date cannot be after end date', 400);
    }

    // 3. Validate Status
    if (status && status !== 'PRESENT' && status !== 'ABSENT') {
        throw new AppError('Invalid status filter', 400);
    }

    // 4. Resolve Authorized Students Boundaries
    const studentQuery = { class: teacher.assignedClass, section: teacher.assignedSection };

    // Apply Search Inside Authorized Boundary
    if (search) {
        const searchRegex = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
        studentQuery.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { rollNumber: searchRegex },
            { studentId: searchRegex }
        ];
    }

    // Total Count of Eligible Students
    const totalStudents = await Student.countDocuments(studentQuery);

    const safePage = Math.max(parseInt(page) || 1, 1);
    let safeLimit = parseInt(limit) || 10;
    if (safeLimit < 1) safeLimit = 10;
    if (safeLimit > 100) safeLimit = 100;
    const skip = (safePage - 1) * safeLimit;

    // Paginated Core Roster
    const paginatedStudents = await Student.find(studentQuery)
        .select('firstName lastName studentId rollNumber')
        .skip(skip)
        .limit(safeLimit)
        .sort({ rollNumber: 1 })
        .lean();

    // To compute Global Summary correctly, get ALL matching authorized student IDs
    const allAuthorizedStudents = await Student.find(studentQuery, '_id').lean();
    const allStudentIds = allAuthorizedStudents.map(s => s._id);

    // 5. Shared Attendance Filters
    const attFilter = {};
    if (startD || endD) {
        attFilter.date = {};
        if (startD) attFilter.date.$gte = startD;
        if (endD) attFilter.date.$lte = endD;
    }

    // Global Aggregate
    const globalAttFilter = { ...attFilter, student: { $in: allStudentIds } };
    if (status) {
        globalAttFilter.status = status;
    }

    const summaryAgg = await Attendance.aggregate([
        { $match: globalAttFilter },
        {
            $group: {
                _id: "$student",
                presentCount: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
                absentCount: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } }
            }
        },
        {
            $group: {
                _id: null,
                studentsWithAttendance: { $sum: 1 },
                totalPresent: { $sum: "$presentCount" },
                totalAbsent: { $sum: "$absentCount" }
            }
        }
    ]);

    const summaryRaw = summaryAgg.length > 0 ? summaryAgg[0] : { studentsWithAttendance: 0, totalPresent: 0, totalAbsent: 0 };

    const sumRecords = summaryRaw.totalPresent + summaryRaw.totalAbsent;
    const overallPercentage = sumRecords > 0 ? Number(((summaryRaw.totalPresent / sumRecords) * 100).toFixed(2)) : 0;

    const summary = {
        totalStudents: allStudentIds.length,
        studentsWithAttendance: summaryRaw.studentsWithAttendance,
        totalPresent: summaryRaw.totalPresent,
        totalAbsent: summaryRaw.totalAbsent,
        overallPercentage
    };

    // 6. Page Aggregate
    const pageStudentIds = paginatedStudents.map(s => s._id);
    const pageAttFilter = { ...attFilter, student: { $in: pageStudentIds } };
    if (status) {
        pageAttFilter.status = status;
    }

    const pageAgg = await Attendance.aggregate([
        { $match: pageAttFilter },
        {
            $group: {
                _id: "$student",
                present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
                absent: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } }
            }
        }
    ]);

    const attMap = {};
    pageAgg.forEach(p => {
        attMap[p._id.toString()] = p;
    });

    // 7. Combine Matrix
    const data = paginatedStudents.map(st => {
        const ag = attMap[st._id.toString()] || { present: 0, absent: 0 };
        const present = ag.present;
        const absent = ag.absent;
        const total = present + absent;
        const percentage = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;

        return {
            student: {
                _id: st._id,
                studentId: st.studentId,
                firstName: st.firstName,
                lastName: st.lastName,
                rollNumber: st.rollNumber
            },
            total,
            present,
            absent,
            percentage
        };
    });

    return {
        data,
        summary,
        pagination: {
            total: totalStudents,
            page: safePage,
            limit: safeLimit,
            pages: Math.ceil(totalStudents / safeLimit)
        }
    };
};

const updateTeacherAttendance = async (userId, attendanceId, status) => {
    if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
        throw new AppError('Invalid attendance ID', 400);
    }

    if (status !== 'PRESENT' && status !== 'ABSENT') {
        throw new AppError('Invalid status', 400);
    }

    const teacher = await Teacher.findOne({ user: userId }).lean();
    if (!teacher) {
        throw new AppError('Teacher profile not found', 404);
    }

    // Populate student to verify ownership
    const attendance = await Attendance.findById(attendanceId).populate('student', 'class section');
    if (!attendance) {
        throw new AppError('Attendance record not found', 404);
    }

    const studentClass = attendance.student?.class;
    const studentSection = attendance.student?.section;

    if (studentClass !== teacher.assignedClass || studentSection !== teacher.assignedSection) {
        throw new AppError('You are not authorized to modify this attendance.', 403);
    }

    if (attendance.status === status) {
        return attendance; // No-op if status is unchanged
    }

    attendance.status = status;
    await attendance.save();
    return attendance;
};

module.exports = {
    createAttendance,
    getAttendances,
    getAttendanceById,
    getMyAttendance,
    updateAttendance,
    getTeacherRoster,
    createBulkAttendance,
    getTeacherAttendanceHistory,
    updateTeacherAttendance,
    getTeacherAttendanceReport
};
