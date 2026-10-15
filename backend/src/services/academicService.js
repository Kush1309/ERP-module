const AcademicYear = require('../models/AcademicYear');
const ClassSection = require('../models/ClassSection');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const AppError = require('../utils/AppError');
const { assertObjectId, pick } = require('../utils/queryHelpers');
const { runInTransaction } = require('../utils/transaction');
const { escapeRegex } = require('../utils/queryHelpers');

// ---------------- Class configuration rules ----------------
// Enforcement starts once at least one class/section has been configured, so schools
// that have not set up Academic Setup yet keep working exactly as before.
const isClassConfigEnabled = async () => (await ClassSection.countDocuments({})) > 0;

const sectionMatcher = (section) => ({ $regex: `^${escapeRegex(section)}$`, $options: 'i' });

/**
 * Ensures className-section is a configured, active class with room for `adding` more
 * active students (students listed in excludeStudentIds are not counted).
 */
const assertClassSectionAvailable = async (className, section, { adding = 1, excludeStudentIds = [] } = {}) => {
    if (!(await isClassConfigEnabled())) return;
    const cls = String(className || '').trim();
    const sec = String(section || '').trim().toUpperCase();
    const record = await ClassSection.findOne({ className: cls, section: sec }).lean();
    if (!record) {
        throw new AppError(`Class ${cls}-${sec} is not set up. Add it under Academic Setup → Classes & Sections first.`, 400);
    }
    if (record.status !== 'ACTIVE') {
        throw new AppError(`Class ${cls}-${sec} is inactive and cannot take students or teachers.`, 400);
    }
    if (adding > 0) {
        const filter = { class: cls, section: sectionMatcher(sec), status: 'ACTIVE' };
        if (excludeStudentIds.length) filter._id = { $nin: excludeStudentIds };
        const current = await Student.countDocuments(filter);
        if (current + adding > record.capacity) {
            throw new AppError(`Class ${cls}-${sec} is full (${current}/${record.capacity} students). Increase its capacity or choose another section.`, 409);
        }
    }
};

// Groups [{ class, section }] rows into per-class counts and checks each
const assertCapacityForGroups = async (rows, options = {}) => {
    const groups = new Map();
    rows.forEach((r) => {
        const key = `${String(r.class).trim()}|${String(r.section).trim().toUpperCase()}`;
        groups.set(key, (groups.get(key) || 0) + 1);
    });
    for (const [key, count] of groups) {
        const [cls, sec] = key.split('|');
        await assertClassSectionAvailable(cls, sec, { ...options, adding: count });
    }
};

// ---------------- Academic years ----------------
const YEAR_FIELDS = ['name', 'startDate', 'endDate', 'terms'];

const listAcademicYears = () => AcademicYear.find().sort({ startDate: -1 }).lean();

const getCurrentAcademicYear = () => AcademicYear.findOne({ isCurrent: true }).lean();

const createAcademicYear = async (data) => {
    const payload = pick(data, YEAR_FIELDS);
    const hasCurrent = await AcademicYear.exists({ isCurrent: true });
    const year = await AcademicYear.create({ ...payload, isCurrent: !hasCurrent });
    if (data.isCurrent === true && hasCurrent) {
        return setCurrentAcademicYear(year._id);
    }
    return year.toObject();
};

const updateAcademicYear = async (id, data) => {
    assertObjectId(id, 'academic year ID');
    const year = await AcademicYear.findById(id);
    if (!year) throw new AppError('Academic year not found', 404);
    Object.assign(year, pick(data, YEAR_FIELDS));
    await year.save();
    return year.toObject();
};

const setCurrentAcademicYear = async (id) => {
    assertObjectId(id, 'academic year ID');
    const exists = await AcademicYear.exists({ _id: id });
    if (!exists) throw new AppError('Academic year not found', 404);
    await runInTransaction(async (session) => {
        await AcademicYear.updateMany({ _id: { $ne: id } }, { $set: { isCurrent: false } }, { session });
        await AcademicYear.updateOne({ _id: id }, { $set: { isCurrent: true } }, { session });
    });
    return AcademicYear.findById(id).lean();
};

const deleteAcademicYear = async (id) => {
    assertObjectId(id, 'academic year ID');
    const year = await AcademicYear.findById(id);
    if (!year) throw new AppError('Academic year not found', 404);
    if (year.isCurrent) throw new AppError('The current academic year cannot be deleted. Mark another year as current first.', 409);
    await year.deleteOne();
    return { deleted: true };
};

// ---------------- Classes & sections ----------------
const CLASS_FIELDS = ['className', 'section', 'classTeacher', 'capacity', 'room', 'status'];

const withStrength = async (classSections) => {
    const students = await Student.find({ status: 'ACTIVE' }).select('class section').lean();
    const counts = new Map();
    students.forEach((s) => {
        const key = `${s.class}|${String(s.section).toUpperCase()}`;
        counts.set(key, (counts.get(key) || 0) + 1);
    });
    return classSections.map((c) => ({ ...c, studentCount: counts.get(`${c.className}|${c.section}`) || 0 }));
};

const listClassSections = async (query = {}) => {
    const filter = {};
    if (query.status) filter.status = String(query.status).toUpperCase();
    if (query.className) filter.className = String(query.className);
    const list = await ClassSection.find(filter)
        .populate('classTeacher', 'firstName lastName')
        .lean();
    // Natural sort: class 2 before class 10
    list.sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true }) || a.section.localeCompare(b.section));
    return withStrength(list);
};

const validateClassTeacher = async (teacherId) => {
    if (!teacherId) return null;
    assertObjectId(teacherId, 'class teacher');
    const teacher = await Teacher.exists({ _id: teacherId });
    if (!teacher) throw new AppError('Selected class teacher does not exist', 400);
    return teacherId;
};

const createClassSection = async (data) => {
    const payload = pick(data, CLASS_FIELDS);
    payload.classTeacher = await validateClassTeacher(payload.classTeacher || null);
    try {
        return (await ClassSection.create(payload)).toObject();
    } catch (error) {
        if (error.code === 11000) throw new AppError('This class and section already exists', 409);
        throw error;
    }
};

const updateClassSection = async (id, data) => {
    assertObjectId(id, 'class section ID');
    const record = await ClassSection.findById(id);
    if (!record) throw new AppError('Class section not found', 404);
    const payload = pick(data, CLASS_FIELDS);
    if (payload.classTeacher !== undefined) payload.classTeacher = await validateClassTeacher(payload.classTeacher || null);
    if (payload.capacity !== undefined) {
        const enrolled = await Student.countDocuments({ class: record.className, section: sectionMatcher(record.section), status: 'ACTIVE' });
        if (Number(payload.capacity) < enrolled) {
            throw new AppError(`Capacity cannot be lower than the ${enrolled} active student(s) already in ${record.className}-${record.section}`, 400);
        }
    }
    Object.assign(record, payload);
    try {
        await record.save();
    } catch (error) {
        if (error.code === 11000) throw new AppError('This class and section already exists', 409);
        throw error;
    }
    return record.toObject();
};

const deleteClassSection = async (id) => {
    assertObjectId(id, 'class section ID');
    const record = await ClassSection.findById(id);
    if (!record) throw new AppError('Class section not found', 404);
    const studentCount = await Student.countDocuments({ class: record.className, section: record.section, status: 'ACTIVE' });
    if (studentCount > 0) {
        throw new AppError(`Cannot delete ${record.className}-${record.section}: ${studentCount} active student(s) are enrolled. Mark it inactive instead.`, 409);
    }
    await record.deleteOne();
    return { deleted: true };
};

// Registers class/sections that already exist on student records so older data appears in setup
const importExistingClassSections = async () => {
    const students = await Student.find().select('class section').lean();
    const pairs = new Map();
    students.forEach((s) => pairs.set(`${s.class}|${String(s.section).toUpperCase()}`, { className: s.class, section: String(s.section).toUpperCase() }));
    let created = 0;
    for (const pair of pairs.values()) {
        const exists = await ClassSection.exists(pair);
        if (!exists) {
            await ClassSection.create(pair);
            created += 1;
        }
    }
    return { created };
};

module.exports = {
    isClassConfigEnabled,
    assertClassSectionAvailable,
    assertCapacityForGroups,
    listAcademicYears,
    getCurrentAcademicYear,
    createAcademicYear,
    updateAcademicYear,
    setCurrentAcademicYear,
    deleteAcademicYear,
    listClassSections,
    createClassSection,
    updateClassSection,
    deleteClassSection,
    importExistingClassSections,
};
