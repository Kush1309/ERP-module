const SchoolSettings = require('../models/SchoolSettings');
const { DEFAULT_GRADE_SCALE, normaliseScale, usableScale } = require('../utils/grading');

const EDITABLE = [
    'schoolName', 'address', 'phone', 'email', 'website', 'principalName', 'currency',
    'libraryLoanDays', 'libraryFinePerDay', 'libraryMaxActiveIssues', 'feeLateFeePerDay', 'feeLateFeeMax', 'attendanceLowThreshold', 'maxTeacherPeriodsPerWeek',
];

// Returns the singleton settings document, creating defaults on first use
const getSettings = async () => {
    // Not lean: hydrating applies schema defaults for settings added after the document was created
    const existing = await SchoolSettings.findOne({ key: 'school' });
    if (existing) return existing.toObject();
    try {
        return (await SchoolSettings.create({ key: 'school' })).toObject();
    } catch (error) {
        if (error.code === 11000) return SchoolSettings.findOne({ key: 'school' }).lean();
        throw error;
    }
};

const updateSettings = async (data = {}) => {
    await getSettings();
    const updates = {};
    EDITABLE.forEach((field) => {
        if (data[field] !== undefined) updates[field] = data[field];
    });
    if (data.gradeScale !== undefined) {
        // An empty list restores the built-in default scale
        updates.gradeScale = Array.isArray(data.gradeScale) && data.gradeScale.length === 0 ? [] : normaliseScale(data.gradeScale);
    }
    const saved = await SchoolSettings.findOneAndUpdate({ key: 'school' }, { $set: updates }, { new: true, runValidators: true }).lean();
    gradeScaleCache = null;
    return saved;
};

// Grade scale with a short cache: it is read on every marks save
let gradeScaleCache = null;
const getGradeScale = async () => {
    if (gradeScaleCache && gradeScaleCache.expires > Date.now()) return gradeScaleCache.scale;
    const settings = await getSettings();
    const scale = usableScale(settings.gradeScale);
    gradeScaleCache = { scale, expires: Date.now() + 30000 };
    return scale;
};

// Re-applies the current scale to stored results (grade, and pass/fail where no subject pass mark is stored)
const recalculateGrades = async () => {
    const Result = require('../models/Result');
    const { bandFor } = require('../utils/grading');
    gradeScaleCache = null;
    const scale = await getGradeScale();
    const results = await Result.find().select('percentage obtainedMarks maximumMarks passingMarks grade status').lean();
    const ops = [];
    results.forEach((r) => {
        const percentage = r.maximumMarks ? Number(((r.obtainedMarks / r.maximumMarks) * 100).toFixed(2)) : 0;
        const band = bandFor(percentage, scale);
        const status = typeof r.passingMarks === 'number' ? (r.obtainedMarks >= r.passingMarks ? 'PASS' : 'FAIL') : (band.isFail ? 'FAIL' : 'PASS');
        if (band.grade !== r.grade || status !== r.status) {
            ops.push({ updateOne: { filter: { _id: r._id }, update: { $set: { grade: band.grade, status } } } });
        }
    });
    if (ops.length) await Result.bulkWrite(ops);
    return { checked: results.length, updated: ops.length };
};

module.exports = { getSettings, updateSettings, getGradeScale, recalculateGrades, DEFAULT_GRADE_SCALE };
