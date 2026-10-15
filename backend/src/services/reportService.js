const Student = require('../models/Student');
const { Attendance } = require('../models/Attendance');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Enquiry = require('../models/Enquiry');
const AdmissionApplication = require('../models/AdmissionApplication');
const StaffAttendance = require('../models/StaffAttendance');
const Teacher = require('../models/Teacher');
const AppError = require('../utils/AppError');
const { getSettings } = require('./settingsService');
const { computeStandings } = require('./reportCardService');
const feeService = require('./feeService');

const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const classKey = (cls, sec) => `${cls}-${String(sec).toUpperCase()}`;
const byClassName = (a, b) => a.localeCompare(b, undefined, { numeric: true });

const resolveRange = (startDate, endDate) => {
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = endDate ? new Date(endDate) : new Date(now);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new AppError('Invalid date range', 400);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
    if (start > end) throw new AppError('Start date cannot be after end date', 400);
    return { start, end };
};

const studentStrength = async () => {
    const students = await Student.find({ status: 'ACTIVE' }).select('class section gender').lean();
    const rows = new Map();
    students.forEach((s) => {
        const key = classKey(s.class, s.section);
        const row = rows.get(key) || { className: s.class, section: String(s.section).toUpperCase(), total: 0, male: 0, female: 0, other: 0 };
        row.total += 1;
        row[s.gender === 'MALE' ? 'male' : s.gender === 'FEMALE' ? 'female' : 'other'] += 1;
        rows.set(key, row);
    });
    const statusCounts = (await Student.find().select('status').lean()).reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }), {});
    return {
        totalActive: students.length,
        byStatus: statusCounts,
        byClass: [...rows.values()].sort((a, b) => byClassName(a.className, b.className) || a.section.localeCompare(b.section)),
    };
};

const attendanceSummary = async (start, end, threshold) => {
    const [records, students] = await Promise.all([
        Attendance.find({ date: { $gte: start, $lte: end } }).select('student status').lean(),
        Student.find({ status: 'ACTIVE' }).select('studentId firstName lastName class section').lean(),
    ]);
    const studentById = new Map(students.map((s) => [String(s._id), s]));
    const perStudent = new Map();
    records.forEach((r) => {
        const row = perStudent.get(String(r.student)) || { present: 0, absent: 0 };
        row[r.status === 'PRESENT' ? 'present' : 'absent'] += 1;
        perStudent.set(String(r.student), row);
    });
    const byClass = new Map();
    const lowAttendance = [];
    perStudent.forEach((counts, id) => {
        const student = studentById.get(id);
        if (!student) return;
        const key = classKey(student.class, student.section);
        const row = byClass.get(key) || { className: student.class, section: String(student.section).toUpperCase(), present: 0, absent: 0 };
        row.present += counts.present; row.absent += counts.absent;
        byClass.set(key, row);
        const pct = (counts.present / (counts.present + counts.absent)) * 100;
        if (pct < threshold) {
            lowAttendance.push({ studentId: student.studentId, name: `${student.firstName} ${student.lastName}`, className: key, percentage: round(pct), present: counts.present, absent: counts.absent });
        }
    });
    const present = records.filter((r) => r.status === 'PRESENT').length;
    return {
        totalRecords: records.length,
        overallPercentage: records.length ? round((present / records.length) * 100) : null,
        threshold,
        byClass: [...byClass.values()].map((r) => ({ ...r, percentage: round((r.present / (r.present + r.absent)) * 100) }))
            .sort((a, b) => byClassName(a.className, b.className) || a.section.localeCompare(b.section)),
        lowAttendance: lowAttendance.sort((a, b) => a.percentage - b.percentage).slice(0, 50),
    };
};

const examPerformance = async (start, end) => {
    const exams = await Exam.find({ startDate: { $lte: end }, endDate: { $gte: start } }).sort({ startDate: -1 }).lean();
    const results = await Result.find({ exam: { $in: exams.map((e) => e._id) } }).select('exam student obtainedMarks maximumMarks status').lean();
    return exams.map((exam) => {
        const standings = computeStandings(results.filter((r) => String(r.exam) === String(exam._id)));
        const passed = standings.filter((s) => s.result === 'PASS').length;
        return {
            _id: exam._id,
            name: exam.name,
            className: exam.section ? `${exam.class}-${exam.section}` : exam.class,
            status: exam.status,
            students: standings.length,
            averagePercentage: standings.length ? round(standings.reduce((a, s) => a + s.percentage, 0) / standings.length) : null,
            passRate: standings.length ? round((passed / standings.length) * 100) : null,
        };
    });
};

const admissionTrends = async (start, end) => {
    const [enquiries, applications] = await Promise.all([
        Enquiry.find({ createdAt: { $gte: start, $lte: end } }).select('status source createdAt').lean(),
        AdmissionApplication.find({ createdAt: { $gte: start, $lte: end } }).select('status classApplied createdAt').lean(),
    ]);
    const countBy = (arr, fn) => arr.reduce((acc, x) => { const k = fn(x); acc[k] = (acc[k] || 0) + 1; return acc; }, {});
    const monthly = new Map();
    enquiries.forEach((e) => { const m = e.createdAt.toISOString().slice(0, 7); const row = monthly.get(m) || { month: m, enquiries: 0, applications: 0, enrolled: 0 }; row.enquiries += 1; monthly.set(m, row); });
    applications.forEach((a) => { const m = a.createdAt.toISOString().slice(0, 7); const row = monthly.get(m) || { month: m, enquiries: 0, applications: 0, enrolled: 0 }; row.applications += 1; if (a.status === 'ENROLLED') row.enrolled += 1; monthly.set(m, row); });
    return {
        enquiries: enquiries.length,
        applications: applications.length,
        enrolled: applications.filter((a) => a.status === 'ENROLLED').length,
        enquiriesByStatus: countBy(enquiries, (e) => e.status),
        enquiriesBySource: countBy(enquiries, (e) => e.source),
        applicationsByStatus: countBy(applications, (a) => a.status),
        byMonth: [...monthly.values()].sort((a, b) => a.month.localeCompare(b.month)),
    };
};

const staffSummary = async (start, end) => {
    const [teacherCount, records] = await Promise.all([
        Teacher.countDocuments(),
        StaffAttendance.find({ date: { $gte: start, $lte: end } }).select('status').lean(),
    ]);
    const counts = records.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});
    const attended = (counts.PRESENT || 0) + (counts.LATE || 0) + (counts.HALF_DAY || 0) * 0.5;
    return { teachers: teacherCount, records: records.length, byStatus: counts, attendanceRate: records.length ? round((attended / records.length) * 100) : null };
};

const getOverview = async (user, { startDate, endDate } = {}) => {
    const { start, end } = resolveRange(startDate, endDate);
    const settings = await getSettings();
    const [strength, attendance, exams, admissions, staff, fees] = await Promise.all([
        studentStrength(),
        attendanceSummary(start, end, settings.attendanceLowThreshold),
        examPerformance(start, end),
        admissionTrends(start, end),
        staffSummary(start, end),
        feeService.getFinanceSummary(user),
    ]);
    return { range: { start, end }, strength, attendance, exams, admissions, staff, fees };
};

module.exports = { getOverview };
