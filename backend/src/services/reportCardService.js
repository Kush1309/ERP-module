const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const ParentProfile = require('../models/ParentProfile');
const { Attendance } = require('../models/Attendance');
const AppError = require('../utils/AppError');
const { assertObjectId } = require('../utils/queryHelpers');
const { getSettings } = require('./settingsService');

const GRADE_ORDER = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'];
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

// Same grade bands as the Result model
const gradeFor = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
};

const studentsInExamScope = (exam) => {
    const filter = { class: exam.class };
    if (exam.section) filter.section = exam.section;
    return Student.find(filter).select('studentId firstName lastName rollNumber class section').lean();
};

// Totals per student for ranking
const computeStandings = (results) => {
    const byStudent = new Map();
    results.forEach((r) => {
        const key = String(r.student?._id || r.student);
        const row = byStudent.get(key) || { student: r.student, obtained: 0, maximum: 0, failedSubjects: 0, subjects: 0 };
        row.obtained += r.obtainedMarks;
        row.maximum += r.maximumMarks;
        row.subjects += 1;
        if (r.status === 'FAIL') row.failedSubjects += 1;
        byStudent.set(key, row);
    });
    const rows = [...byStudent.values()].map((row) => {
        const percentage = row.maximum ? round((row.obtained / row.maximum) * 100) : 0;
        return { ...row, percentage, grade: gradeFor(percentage), result: row.failedSubjects ? 'FAIL' : 'PASS' };
    });
    rows.sort((a, b) => b.percentage - a.percentage);
    // Competition ranking: equal percentages share a rank
    rows.forEach((row, index) => {
        row.rank = index > 0 && rows[index - 1].percentage === row.percentage ? rows[index - 1].rank : index + 1;
    });
    return rows;
};

const assertCanViewStudent = async (user, exam, student) => {
    if (user.role === 'ADMIN') return;
    if (user.role === 'TEACHER') {
        const teacher = await Teacher.findOne({ user: user._id }).lean();
        if (teacher && teacher.assignedClass === student.class && teacher.assignedSection === student.section) return;
        throw new AppError('You can only view report cards for students of your class', 403);
    }
    if (exam.status !== 'PUBLISHED') throw new AppError('Results for this exam are not published yet', 404);
    if (user.role === 'STUDENT') {
        const own = await Student.exists({ _id: student._id, user: user._id });
        if (own) return;
    }
    if (user.role === 'PARENT') {
        const linked = await ParentProfile.exists({ user: user._id, students: student._id });
        if (linked) return;
    }
    throw new AppError('You are not allowed to view this report card', 403);
};

const buildReportCard = async (user, examId, studentId) => {
    assertObjectId(examId, 'exam ID');
    assertObjectId(studentId, 'student ID');
    const [exam, student] = await Promise.all([
        Exam.findById(examId).lean(),
        Student.findById(studentId).populate('user', 'loginId').lean(),
    ]);
    if (!exam) throw new AppError('Exam not found', 404);
    if (!student) throw new AppError('Student not found', 404);
    await assertCanViewStudent(user, exam, student);

    const [results, classResults, school] = await Promise.all([
        Result.find({ exam: exam._id, student: student._id }).populate('subject', 'name code maximumMarks passingMarks').lean(),
        Result.find({ exam: exam._id }).select('student obtainedMarks maximumMarks status').lean(),
        getSettings(),
    ]);
    if (!results.length) throw new AppError('No marks have been recorded for this student in this exam', 404);

    const standings = computeStandings(classResults);
    const mine = standings.find((row) => String(row.student) === String(student._id));

    // Attendance over the academic year up to the end of the exam
    const attendance = await Attendance.find({ student: student._id, date: { $lte: exam.endDate } }).select('status').lean();
    const present = attendance.filter((a) => a.status === 'PRESENT').length;

    const subjects = results
        .map((r) => ({
            subject: r.subject?.name || 'Subject',
            code: r.subject?.code || '',
            obtainedMarks: r.obtainedMarks,
            maximumMarks: r.maximumMarks,
            passingMarks: r.passingMarks ?? r.subject?.passingMarks ?? null,
            percentage: r.percentage,
            grade: r.grade,
            status: r.status,
        }))
        .sort((a, b) => a.subject.localeCompare(b.subject));

    return {
        school: { name: school.schoolName, address: school.address, phone: school.phone, email: school.email, principalName: school.principalName },
        exam: { _id: exam._id, name: exam.name, type: exam.type, academicSession: exam.academicSession, startDate: exam.startDate, endDate: exam.endDate, status: exam.status },
        student: {
            _id: student._id, studentId: student.studentId, name: `${student.firstName} ${student.lastName}`,
            class: student.class, section: student.section, rollNumber: student.rollNumber, admissionNumber: student.admissionNumber,
        },
        subjects,
        summary: {
            obtained: mine.obtained,
            maximum: mine.maximum,
            percentage: mine.percentage,
            grade: mine.grade,
            result: mine.result,
            rank: mine.rank,
            classSize: standings.length,
        },
        attendance: { present, total: attendance.length, percentage: attendance.length ? round((present / attendance.length) * 100, 1) : null },
        generatedAt: new Date(),
    };
};

const buildExamAnalytics = async (examId, scope = {}) => {
    assertObjectId(examId, 'exam ID');
    const exam = await Exam.findById(examId).lean();
    if (!exam) throw new AppError('Exam not found', 404);

    let studentFilterIds = null;
    if (scope.className) {
        const filter = { class: scope.className };
        if (scope.section) filter.section = scope.section;
        studentFilterIds = await Student.find(filter).distinct('_id');
    }
    const resultFilter = { exam: exam._id };
    if (studentFilterIds) resultFilter.student = { $in: studentFilterIds };

    const [results, scopeStudents] = await Promise.all([
        Result.find(resultFilter)
            .populate('student', 'studentId firstName lastName rollNumber section')
            .populate('subject', 'name code')
            .lean(),
        studentsInExamScope(exam),
    ]);

    const bySubject = new Map();
    const gradeDistribution = Object.fromEntries(GRADE_ORDER.map((g) => [g, 0]));
    results.forEach((r) => {
        const key = String(r.subject?._id || r.subject);
        const s = bySubject.get(key) || { subject: r.subject?.name || 'Subject', code: r.subject?.code || '', count: 0, total: 0, highest: -Infinity, lowest: Infinity, passed: 0 };
        s.count += 1;
        s.total += r.percentage;
        s.highest = Math.max(s.highest, r.percentage);
        s.lowest = Math.min(s.lowest, r.percentage);
        if (r.status === 'PASS') s.passed += 1;
        bySubject.set(key, s);
        if (gradeDistribution[r.grade] !== undefined) gradeDistribution[r.grade] += 1;
    });

    const standings = computeStandings(results).map((row) => ({
        ...row,
        student: row.student ? { _id: row.student._id, studentId: row.student.studentId, name: `${row.student.firstName} ${row.student.lastName}`, rollNumber: row.student.rollNumber, section: row.student.section } : null,
    }));
    const passedStudents = standings.filter((s) => s.result === 'PASS').length;

    return {
        exam: { _id: exam._id, name: exam.name, class: exam.class, section: exam.section, academicSession: exam.academicSession, status: exam.status },
        overview: {
            studentsInScope: studentFilterIds ? studentFilterIds.length : scopeStudents.length,
            studentsWithResults: standings.length,
            averagePercentage: standings.length ? round(standings.reduce((a, s) => a + s.percentage, 0) / standings.length) : null,
            passRate: standings.length ? round((passedStudents / standings.length) * 100, 1) : null,
            highestPercentage: standings[0]?.percentage ?? null,
        },
        subjects: [...bySubject.values()].map((s) => ({
            subject: s.subject, code: s.code, students: s.count,
            average: round(s.total / s.count), highest: s.highest, lowest: s.lowest,
            passRate: round((s.passed / s.count) * 100, 1),
        })).sort((a, b) => a.subject.localeCompare(b.subject)),
        gradeDistribution,
        standings,
    };
};

module.exports = { buildReportCard, buildExamAnalytics, gradeFor, computeStandings };
