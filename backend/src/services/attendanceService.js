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

const getMyAttendanceHistory = async (userId, queryOpts = {}) => {
    const { startDate, endDate, status, page = 1, limit = 10 } = queryOpts;

    // 1. Resolve Auth Student
    const student = await Student.findOne({ user: userId }).lean();
    if (!student) {
        throw new AppError('Student profile not found based on authenticated user', 404);
    }

    // 2. Match logic
    const filter = { student: student._id };

    if (startDate || endDate) {
        filter.date = {};
        if (startDate) {
            const startD = new Date(startDate);
            if (isNaN(startD)) throw new AppError('Invalid start date', 400);
            startD.setUTCHours(0, 0, 0, 0);
            filter.date.$gte = startD;
        }
        if (endDate) {
            const endD = new Date(endDate);
            if (isNaN(endD)) throw new AppError('Invalid end date', 400);
            endD.setUTCHours(23, 59, 59, 999);
            filter.date.$lte = endD;
        }
        if (filter.date.$gte && filter.date.$lte && filter.date.$gte > filter.date.$lte) {
            throw new AppError('Start date cannot be after end date', 400);
        }
    }

    if (status) {
        if (status !== 'PRESENT' && status !== 'ABSENT') {
            throw new AppError('Invalid status filter', 400);
        }
        filter.status = status;
    }

    // 3. Pagination setup
    const safePage = Math.max(parseInt(page) || 1, 1);
    let safeLimit = parseInt(limit) || 10;
    if (safeLimit < 1) safeLimit = 10;
    if (safeLimit > 100) safeLimit = 100;
    const skip = (safePage - 1) * safeLimit;

    // 4. Data Fetching
    const [attendances, totalCount] = await Promise.all([
        Attendance.find(filter)
            .skip(skip)
            .limit(safeLimit)
            .sort({ date: -1 })
            .lean(),
        Attendance.countDocuments(filter)
    ]);

    // 5. Global Summary Aggregation
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
    const percentage = summaryRaw.total > 0 ? Number(((summaryRaw.present / summaryRaw.total) * 100).toFixed(2)) : 0;

    const summary = {
        total: summaryRaw.total,
        present: summaryRaw.present,
        absent: summaryRaw.absent,
        percentage
    };

    return {
        data: attendances.map(a => ({
            ...a,
            student: student
        })),
        summary,
        pagination: {
            total: totalCount,
            page: safePage,
            limit: safeLimit,
            pages: Math.ceil(totalCount / safeLimit)
        }
    };
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

const getAdminAttendanceReport = async (queryOpts = {}) => {
    const { startDate, endDate, status, search } = queryOpts;
    const page = parseInt(queryOpts.page, 10) || 1;
    const limit = parseInt(queryOpts.limit, 10) || 10;

    // Explicit static string conversion to prevent NoSQL object injection
    const classFilter = queryOpts.class ? String(queryOpts.class) : undefined;
    const sectionFilter = queryOpts.section ? String(queryOpts.section) : undefined;

    // 1. Resolve Students Boundary
    const studentQuery = {};
    if (classFilter) studentQuery.class = classFilter;
    if (sectionFilter) studentQuery.section = sectionFilter;

    if (search) {
        const searchRegex = new RegExp(String(search).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
        studentQuery.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { rollNumber: searchRegex },
            { studentId: searchRegex }
        ];
    }

    const totalStudents = await Student.countDocuments(studentQuery);

    const safePage = Math.max(page, 1);
    let safeLimit = limit;
    if (safeLimit < 1) safeLimit = 10;
    if (safeLimit > 100) safeLimit = 100;
    const skip = (safePage - 1) * safeLimit;

    // Get paginated target students
    const paginatedStudents = await Student.find(studentQuery)
        .select('firstName lastName studentId rollNumber class section')
        .skip(skip)
        .limit(safeLimit)
        .sort({ studentId: 1 })
        .lean();

    // Get all authorized student IDs for the global aggregations
    const allMatchingStudents = await Student.find(studentQuery, '_id').lean();
    const allStudentIds = allMatchingStudents.map(s => s._id);

    // 2. Attendance Date/Status Filter
    const attFilter = {};
    if (startDate || endDate) {
        attFilter.date = {};
        if (startDate) {
            const startD = new Date(startDate);
            if (isNaN(startD)) throw new AppError('Invalid start date', 400);
            startD.setUTCHours(0, 0, 0, 0);
            attFilter.date.$gte = startD;
        }
        if (endDate) {
            const endD = new Date(endDate);
            if (isNaN(endD)) throw new AppError('Invalid end date', 400);
            endD.setUTCHours(23, 59, 59, 999);
            attFilter.date.$lte = endD;
        }
        if (attFilter.date.$gte && attFilter.date.$lte && attFilter.date.$gte > attFilter.date.$lte) {
            throw new AppError('Start date cannot be after end date', 400);
        }
    }

    if (status) {
        if (status !== 'PRESENT' && status !== 'ABSENT') {
            throw new AppError('Invalid status filter', 400);
        }
        attFilter.status = status;
    }

    // 3. Global Summary Aggregation
    const globalFilter = { ...attFilter, student: { $in: allStudentIds } };

    const summaryAgg = await Attendance.aggregate([
        { $match: globalFilter },
        {
            $group: {
                _id: null,
                totalRecords: { $sum: 1 },
                present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
                absent: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } }
            }
        }
    ]);

    const summaryRaw = summaryAgg.length > 0 ? summaryAgg[0] : { totalRecords: 0, present: 0, absent: 0 };
    const percentage = summaryRaw.totalRecords > 0
        ? Number(((summaryRaw.present / summaryRaw.totalRecords) * 100).toFixed(2))
        : 0;

    const summary = {
        totalStudents,
        totalRecords: summaryRaw.totalRecords,
        present: summaryRaw.present,
        absent: summaryRaw.absent,
        percentage
    };

    // 4. Paginated Data Array Aggregation
    const pageStudentIds = paginatedStudents.map(s => s._id);
    const pageAttFilter = { ...attFilter, student: { $in: pageStudentIds } };

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
    pageAgg.forEach(p => { attMap[p._id.toString()] = p; });

    const data = paginatedStudents.map(st => {
        const ag = attMap[st._id.toString()] || { present: 0, absent: 0 };
        const stTotal = ag.present + ag.absent;
        const stPercentage = stTotal > 0 ? Number(((ag.present / stTotal) * 100).toFixed(2)) : 0;

        return {
            studentId: st.studentId,
            name: `${st.firstName} ${st.lastName}`,
            rollNumber: st.rollNumber,
            class: st.class,
            section: st.section,
            total: stTotal,
            present: ag.present,
            absent: ag.absent,
            percentage: stPercentage
        };
    });

    return {
        data,
        summary,
        pagination: {
            total: totalStudents,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(totalStudents / safeLimit)
        }
    };
};

const getAdminAttendanceRecords = async (queryOpts = {}) => {
    const { startDate, endDate, date, status, search } = queryOpts;
    const page = parseInt(queryOpts.page, 10) || 1;
    const limit = parseInt(queryOpts.limit, 10) || 10;

    const classFilter = queryOpts.class ? String(queryOpts.class) : undefined;
    const sectionFilter = queryOpts.section ? String(queryOpts.section) : undefined;

    const studentQuery = {};
    if (classFilter) studentQuery.class = classFilter;
    if (sectionFilter) studentQuery.section = sectionFilter;

    if (search) {
        const searchRegex = new RegExp(String(search).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
        studentQuery.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { rollNumber: searchRegex },
            { studentId: searchRegex }
        ];
    }

    let targetStudentIds = null;
    if (Object.keys(studentQuery).length > 0) {
        const students = await Student.find(studentQuery, '_id').lean();
        targetStudentIds = students.map(s => s._id);
    }

    const attFilter = {};
    if (targetStudentIds !== null) {
        if (targetStudentIds.length === 0) {
            return { records: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } };
        }
        attFilter.student = { $in: targetStudentIds };
    }

    if (date) {
        const d = new Date(date);
        if (!isNaN(d)) {
            d.setUTCHours(0, 0, 0, 0);
            attFilter.date = d;
        }
    } else if (startDate || endDate) {
        attFilter.date = {};
        if (startDate) {
            const startD = new Date(startDate);
            if (isNaN(startD)) throw new AppError('Invalid start date', 400);
            startD.setUTCHours(0, 0, 0, 0);
            attFilter.date.$gte = startD;
        }
        if (endDate) {
            const endD = new Date(endDate);
            if (isNaN(endD)) throw new AppError('Invalid end date', 400);
            endD.setUTCHours(23, 59, 59, 999);
            attFilter.date.$lte = endD;
        }
        if (attFilter.date.$gte && attFilter.date.$lte && attFilter.date.$gte > attFilter.date.$lte) {
            throw new AppError('Start date cannot be after end date', 400);
        }
    }

    if (status) {
        if (status !== 'PRESENT' && status !== 'ABSENT') {
            throw new AppError('Invalid status filter', 400);
        }
        attFilter.status = status;
    }

    const safePage = Math.max(page, 1);
    let safeLimit = limit;
    if (safeLimit < 1) safeLimit = 10;
    if (safeLimit > 100) safeLimit = 100;
    const skip = (safePage - 1) * safeLimit;

    const [records, total] = await Promise.all([
        Attendance.find(attFilter)
            .populate('student', 'firstName lastName studentId class section rollNumber')
            .skip(skip)
            .limit(safeLimit)
            .sort({ date: -1 })
            .lean(),
        Attendance.countDocuments(attFilter)
    ]);

    const formattedRecords = records.map(r => ({
        _id: r._id,
        date: r.date,
        status: r.status,
        student: {
            _id: r.student._id,
            studentId: r.student.studentId,
            firstName: r.student.firstName,
            lastName: r.student.lastName,
            rollNumber: r.student.rollNumber,
            class: r.student.class,
            section: r.student.section
        }
    }));

    return {
        records: formattedRecords,
        pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit)
        }
    };
};

const getAdminAttendanceById = async (id) => {
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

const updateAdminAttendance = async (id, status) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid attendance ID', 400);
    }
    if (status !== 'PRESENT' && status !== 'ABSENT') {
        throw new AppError('Invalid status', 400);
    }
    const attendance = await Attendance.findById(id);
    if (!attendance) {
        throw new AppError('Attendance record not found', 404);
    }
    attendance.status = status;
    await attendance.save();
    return attendance;
};

const deleteAdminAttendance = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid attendance ID', 400);
    }
    const attendance = await Attendance.findById(id);
    if (!attendance) {
        throw new AppError('Attendance record not found', 404);
    }
    await Attendance.deleteOne({ _id: id });
    return { success: true };
};

const getAdminAttendanceAnalytics = async (queryOpts = {}) => {
    const { startDate, endDate } = queryOpts;
    const classFilter = queryOpts.class ? String(queryOpts.class) : undefined;
    const sectionFilter = queryOpts.section ? String(queryOpts.section) : undefined;

    // 1. Resolve Students Boundary
    const studentQuery = {};
    if (classFilter) studentQuery.class = classFilter;
    if (sectionFilter) studentQuery.section = sectionFilter;

    // We only need to resolve the IDs for attendance match
    const students = await Student.find(studentQuery, '_id').lean();
    const studentIds = students.map(s => s._id);

    // If no students match, return early with zero data
    if (studentIds.length === 0) {
        return {
            summary: { totalRecords: 0, present: 0, absent: 0, percentage: 0 },
            classSummary: [],
            sectionSummary: [],
            dailyTrend: []
        };
    }

    // 2. Attendance Date Filter
    const attFilter = { student: { $in: studentIds } };
    if (startDate || endDate) {
        attFilter.date = {};
        if (startDate) {
            const startD = new Date(startDate);
            if (isNaN(startD)) throw new AppError('Invalid start date', 400);
            startD.setUTCHours(0, 0, 0, 0);
            attFilter.date.$gte = startD;
        }
        if (endDate) {
            const endD = new Date(endDate);
            if (isNaN(endD)) throw new AppError('Invalid end date', 400);
            endD.setUTCHours(23, 59, 59, 999);
            attFilter.date.$lte = endD;
        }
        if (attFilter.date.$gte && attFilter.date.$lte && attFilter.date.$gte > attFilter.date.$lte) {
            throw new AppError('Start date cannot be after end date', 400);
        }
    }

    // Since we need class/section logic, we must do a $lookup to join the Student collection
    // in order to group by class and section.

    const pipeline = [
        { $match: attFilter },
        {
            $lookup: {
                from: 'users', // Note: In this architecture, Student might be in 'users' collection with role 'STUDENT'
                // Wait, checking previous code, Student.collection is 'students'. The schema model is 'Student'.
                // By Mongoose default, model 'Student' goes to 'students'.
                from: 'students',
                localField: 'student',
                foreignField: '_id',
                as: 'studentDoc'
            }
        },
        { $unwind: '$studentDoc' }
    ];

    const results = await Attendance.aggregate([
        ...pipeline,
        {
            $facet: {
                overall: [
                    {
                        $group: {
                            _id: null,
                            totalRecords: { $sum: 1 },
                            present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
                            absent: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } }
                        }
                    }
                ],
                byClass: [
                    {
                        $group: {
                            _id: "$studentDoc.class",
                            totalRecords: { $sum: 1 },
                            present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
                            absent: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } }
                        }
                    },
                    { $sort: { _id: 1 } }
                ],
                bySection: [
                    {
                        $group: {
                            _id: "$studentDoc.section",
                            totalRecords: { $sum: 1 },
                            present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
                            absent: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } }
                        }
                    },
                    { $sort: { _id: 1 } }
                ],
                dailyTrend: [
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                            totalRecords: { $sum: 1 },
                            present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
                            absent: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]
            }
        }
    ]);

    const facet = results[0];

    // Format Overall
    const overallRaw = facet.overall[0] || { totalRecords: 0, present: 0, absent: 0 };
    const summary = {
        totalRecords: overallRaw.totalRecords,
        present: overallRaw.present,
        absent: overallRaw.absent,
        percentage: overallRaw.totalRecords > 0 ? Number(((overallRaw.present / overallRaw.totalRecords) * 100).toFixed(2)) : 0
    };

    // Format Class
    const classSummary = facet.byClass.map(c => ({
        class: c._id || 'Unassigned',
        totalRecords: c.totalRecords,
        present: c.present,
        absent: c.absent,
        percentage: c.totalRecords > 0 ? Number(((c.present / c.totalRecords) * 100).toFixed(2)) : 0
    }));

    // Format Section
    const sectionSummary = facet.bySection.map(s => ({
        section: s._id || 'Unassigned',
        totalRecords: s.totalRecords,
        present: s.present,
        absent: s.absent,
        percentage: s.totalRecords > 0 ? Number(((s.present / s.totalRecords) * 100).toFixed(2)) : 0
    }));

    // Format Trend
    const dailyTrend = facet.dailyTrend.map(d => ({
        date: d._id,
        totalRecords: d.totalRecords,
        present: d.present,
        absent: d.absent,
        percentage: d.totalRecords > 0 ? Number(((d.present / d.totalRecords) * 100).toFixed(2)) : 0
    }));

    return {
        summary,
        classSummary,
        sectionSummary,
        dailyTrend
    };
};

const flattenStudentObj = (s) => `${s.firstName || ''} ${s.lastName || ''} ${s.studentId || ''} ${s.rollNumber || ''}`.toLowerCase();

const exportAdminAttendance = async (queryOpts = {}) => {
    const { startDate, endDate, status, search } = queryOpts;
    const classFilter = queryOpts.class ? String(queryOpts.class) : undefined;
    const sectionFilter = queryOpts.section ? String(queryOpts.section) : undefined;

    // 1. Resolve Students Boundary
    const studentQuery = {};
    if (classFilter) studentQuery.class = classFilter;
    if (sectionFilter) studentQuery.section = sectionFilter;

    // We fetch broader fields because we need them for CSV and for regex search (if supplied)
    const students = await Student.find(studentQuery, '_id firstName lastName studentId class section rollNumber').lean();
    let validStudents = students;

    if (search) {
        const safeSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase();
        validStudents = students.filter(s => flattenStudentObj(s).includes(safeSearch));
    }
    const studentIds = validStudents.map(s => s._id);

    // 2. Attendance Date & Status Filter
    const attFilter = { student: { $in: studentIds } };

    if (status && (status === 'PRESENT' || status === 'ABSENT')) {
        attFilter.status = status;
    }

    if (startDate || endDate) {
        attFilter.date = {};
        if (startDate) {
            const startD = new Date(startDate);
            if (isNaN(startD)) throw new AppError('Invalid start date', 400);
            startD.setUTCHours(0, 0, 0, 0);
            attFilter.date.$gte = startD;
        }
        if (endDate) {
            const endD = new Date(endDate);
            if (isNaN(endD)) throw new AppError('Invalid end date', 400);
            endD.setUTCHours(23, 59, 59, 999);
            attFilter.date.$lte = endD;
        }
        if (attFilter.date.$gte && attFilter.date.$lte && attFilter.date.$gte > attFilter.date.$lte) {
            throw new AppError('Start date cannot be after end date', 400);
        }
    }

    const records = await Attendance.find(attFilter)
        .populate('student', 'firstName lastName studentId class section rollNumber')
        .sort({ date: -1 }) // Sort date descending
        .lean();

    // Secondary sort by student firstName ascending
    records.sort((a, b) => {
        if (a.date > b.date) return -1;
        if (a.date < b.date) return 1;
        const nameA = (a.student?.firstName || '').toLowerCase();
        const nameB = (b.student?.firstName || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

    // 3. Generate CSV
    const headers = ['Attendance Date', 'Student ID', 'Student Name', 'Roll Number', 'Class', 'Section', 'Status'];

    const escapeCsvValue = (val) => {
        if (val === null || val === undefined) return '';
        let strVal = String(val);
        // Protect against spreadsheet formula injection
        if (/^[=+\-@]/.test(strVal)) {
            strVal = "'" + strVal;
        }
        // Escape quotes and wrap in quotes if there is a comma, quote or newline
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
            strVal = `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
    };

    const csvRows = [headers.join(',')];

    for (const record of records) {
        if (!record.student) continue;
        const s = record.student;
        const row = [
            escapeCsvValue(record.date ? record.date.toISOString().split('T')[0] : ''),
            escapeCsvValue(s.studentId),
            escapeCsvValue(`${s.firstName || ''} ${s.lastName || ''}`.trim()),
            escapeCsvValue(s.rollNumber),
            escapeCsvValue(s.class),
            escapeCsvValue(s.section),
            escapeCsvValue(record.status)
        ];
        csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
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
    getTeacherAttendanceReport,
    getMyAttendanceHistory,
    getAdminAttendanceReport,
    getAdminAttendanceRecords,
    getAdminAttendanceById,
    updateAdminAttendance,
    deleteAdminAttendance,
    getAdminAttendanceAnalytics,
    exportAdminAttendance
};
