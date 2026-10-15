const SubjectAllocation = require('../models/SubjectAllocation');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Timetable = require('../models/Timetable');
const AcademicYear = require('../models/AcademicYear');
const AppError = require('../utils/AppError');
const { assertObjectId, pick } = require('../utils/queryHelpers');
const { getSettings } = require('./settingsService');

const FIELDS = ['academicSession', 'className', 'section', 'subject', 'teacher', 'periodsPerWeek', 'notes'];
const SESSION_RE = /^\d{4}-\d{4}$/;
const byClass = (a, b) => String(a.className).localeCompare(String(b.className), undefined, { numeric: true }) || String(a.section).localeCompare(String(b.section));

// Requested session, else the current academic year
const resolveSession = async (session) => {
    if (session) {
        if (!SESSION_RE.test(String(session))) throw new AppError('academicSession must look like 2026-2027', 400);
        return String(session);
    }
    const current = await AcademicYear.findOne({ isCurrent: true }).select('name').lean();
    if (!current) throw new AppError('No current academic year is set. Choose a session or set one under Academic Setup.', 400);
    return current.name;
};

const populate = (q) => q
    .populate('subject', 'name code')
    .populate('teacher', 'firstName lastName assignedClass assignedSection department');

const validateRefs = async ({ subject, teacher, className, section }) => {
    assertObjectId(subject, 'subject');
    assertObjectId(teacher, 'teacher');
    const [subjectDoc, teacherDoc] = await Promise.all([
        Subject.exists({ _id: subject }),
        Teacher.findById(teacher).populate('user', 'isActive').lean(),
    ]);
    if (!subjectDoc) throw new AppError('Subject not found', 400);
    if (!teacherDoc) throw new AppError('Teacher not found', 400);
    if (teacherDoc.user && teacherDoc.user.isActive === false) throw new AppError('This teacher account is inactive', 400);
    await require('./academicService').assertClassSectionAvailable(className, section, { adding: 0 });
};

const duplicateError = (error) => {
    if (error.code === 11000) throw new AppError('This subject is already allocated for that class and session. Edit the existing allocation instead.', 409);
    throw error;
};

const list = async (user, query = {}) => {
    const filter = { academicSession: await resolveSession(query.academicSession) };
    if (query.className) filter.className = String(query.className);
    if (query.section) filter.section = String(query.section).toUpperCase();
    if (query.subject) { assertObjectId(query.subject, 'subject'); filter.subject = query.subject; }
    if (user.role === 'TEACHER') {
        const me = await Teacher.findOne({ user: user._id }).select('_id').lean();
        filter.teacher = me ? me._id : null;
    } else if (query.teacher) {
        assertObjectId(query.teacher, 'teacher');
        filter.teacher = query.teacher;
    }
    const rows = await populate(SubjectAllocation.find(filter)).lean();
    return { academicSession: filter.academicSession, allocations: rows.sort(byClass) };
};

const create = async (data) => {
    const payload = pick(data, FIELDS);
    payload.academicSession = await resolveSession(payload.academicSession);
    payload.section = String(payload.section || '').toUpperCase();
    await validateRefs(payload);
    try {
        const created = await SubjectAllocation.create(payload);
        return populate(SubjectAllocation.findById(created._id)).lean();
    } catch (error) {
        return duplicateError(error);
    }
};

const update = async (id, data) => {
    assertObjectId(id, 'allocation ID');
    const allocation = await SubjectAllocation.findById(id);
    if (!allocation) throw new AppError('Allocation not found', 404);
    const updates = pick(data, ['teacher', 'periodsPerWeek', 'notes']);
    if (updates.teacher) await validateRefs({ subject: allocation.subject, teacher: updates.teacher, className: allocation.className, section: allocation.section });
    Object.assign(allocation, updates);
    await allocation.save();
    return populate(SubjectAllocation.findById(id)).lean();
};

const remove = async (id) => {
    assertObjectId(id, 'allocation ID');
    const allocation = await SubjectAllocation.findById(id).lean();
    if (!allocation) throw new AppError('Allocation not found', 404);
    const scheduled = await Timetable.countDocuments({
        academicSession: allocation.academicSession, class: allocation.className,
        section: { $in: [allocation.section, allocation.section.toLowerCase()] }, subject: allocation.subject, status: 'ACTIVE',
    });
    if (scheduled) throw new AppError(`${scheduled} timetable period(s) use this allocation. Remove them from the timetable first.`, 409);
    await SubjectAllocation.deleteOne({ _id: id });
    return { deleted: true };
};

// Copies allocations into a new session (existing ones in the target are left untouched)
const copySession = async ({ fromSession, toSession }) => {
    if (!SESSION_RE.test(String(fromSession || '')) || !SESSION_RE.test(String(toSession || ''))) {
        throw new AppError('fromSession and toSession must look like 2026-2027', 400);
    }
    if (fromSession === toSession) throw new AppError('Choose two different sessions', 400);
    const source = await SubjectAllocation.find({ academicSession: fromSession }).lean();
    if (!source.length) throw new AppError(`No allocations found for ${fromSession}`, 404);
    let created = 0;
    let skipped = 0;
    for (const a of source) {
        const exists = await SubjectAllocation.exists({ academicSession: toSession, className: a.className, section: a.section, subject: a.subject });
        if (exists) { skipped += 1; continue; }
        await SubjectAllocation.create({ academicSession: toSession, className: a.className, section: a.section, subject: a.subject, teacher: a.teacher, periodsPerWeek: a.periodsPerWeek, notes: a.notes });
        created += 1;
    }
    return { created, skipped };
};

// Scheduled weekly periods per teacher / per class-subject from the active timetable
const scheduledCounts = async (academicSession) => {
    const entries = await Timetable.find({ academicSession, status: 'ACTIVE' }).select('teacher subject class section').lean();
    const perTeacher = new Map();
    const perClassSubject = new Map();
    entries.forEach((e) => {
        perTeacher.set(String(e.teacher), (perTeacher.get(String(e.teacher)) || 0) + 1);
        const key = `${e.class}|${String(e.section || '').toUpperCase()}|${e.subject}`;
        perClassSubject.set(key, (perClassSubject.get(key) || 0) + 1);
    });
    return { perTeacher, perClassSubject };
};

// Teacher-wise planned vs scheduled periods, flagged against the configured weekly maximum
const workload = async (query = {}) => {
    const academicSession = await resolveSession(query.academicSession);
    const [allocations, teachers, counts, settings] = await Promise.all([
        populate(SubjectAllocation.find({ academicSession })).lean(),
        Teacher.find().select('firstName lastName department designation').populate('user', 'loginId isActive').lean(),
        scheduledCounts(academicSession),
        getSettings(),
    ]);
    const maxPeriods = settings.maxTeacherPeriodsPerWeek || 36;
    const rows = teachers
        .filter((t) => t.user?.isActive !== false)
        .map((t) => {
            const mine = allocations.filter((a) => String(a.teacher?._id) === String(t._id));
            const planned = mine.reduce((sum, a) => sum + a.periodsPerWeek, 0);
            const scheduled = counts.perTeacher.get(String(t._id)) || 0;
            return {
                teacher: { _id: t._id, name: `${t.firstName} ${t.lastName}`, loginId: t.user?.loginId, department: t.department || '', designation: t.designation || '' },
                allocations: mine.length,
                classes: [...new Set(mine.map((a) => `${a.className}-${a.section}`))],
                subjects: [...new Set(mine.map((a) => a.subject?.name).filter(Boolean))],
                plannedPeriods: planned,
                scheduledPeriods: scheduled,
                status: Math.max(planned, scheduled) > maxPeriods ? 'OVERLOADED' : planned === 0 ? 'UNASSIGNED' : 'OK',
            };
        })
        .sort((a, b) => b.plannedPeriods - a.plannedPeriods || a.teacher.name.localeCompare(b.teacher.name));
    return { academicSession, maxPeriodsPerWeek: maxPeriods, teachers: rows };
};

// Class-wise subject coverage: allocated teacher, planned vs scheduled periods
const coverage = async (query = {}) => {
    const academicSession = await resolveSession(query.academicSession);
    const [allocations, counts] = await Promise.all([
        populate(SubjectAllocation.find({ academicSession })).lean(),
        scheduledCounts(academicSession),
    ]);
    const rows = allocations.map((a) => {
        const scheduled = counts.perClassSubject.get(`${a.className}|${a.section}|${a.subject?._id}`) || 0;
        return {
            _id: a._id,
            className: a.className,
            section: a.section,
            subject: a.subject?.name || 'Subject',
            teacher: a.teacher ? `${a.teacher.firstName} ${a.teacher.lastName}` : '—',
            plannedPeriods: a.periodsPerWeek,
            scheduledPeriods: scheduled,
            gap: a.periodsPerWeek - scheduled,
        };
    }).sort(byClass);
    return { academicSession, rows };
};

/**
 * Timetable guard: when a subject is allocated for the class-section and session,
 * only the allocated teacher may be scheduled for it.
 */
const assertTimetableMatchesAllocation = async ({ academicSession, class: className, section, subject, teacher }) => {
    if (!section) return;
    const allocation = await SubjectAllocation.findOne({ academicSession, className: String(className), section: String(section).toUpperCase(), subject })
        .populate('teacher', 'firstName lastName').lean();
    if (allocation && String(allocation.teacher?._id) !== String(teacher)) {
        throw new AppError(`This subject is allocated to ${allocation.teacher.firstName} ${allocation.teacher.lastName} for ${className}-${String(section).toUpperCase()}. Change the allocation first.`, 400);
    }
};

module.exports = { list, create, update, remove, copySession, workload, coverage, assertTimetableMatchesAllocation };
