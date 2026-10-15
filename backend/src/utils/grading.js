const AppError = require('./AppError');

// Default bands (identical to the original hard-coded scale)
const DEFAULT_GRADE_SCALE = Object.freeze([
    { grade: 'A+', minPercentage: 90, isFail: false, remark: 'Outstanding' },
    { grade: 'A', minPercentage: 80, isFail: false, remark: 'Excellent' },
    { grade: 'B+', minPercentage: 70, isFail: false, remark: 'Very good' },
    { grade: 'B', minPercentage: 60, isFail: false, remark: 'Good' },
    { grade: 'C', minPercentage: 50, isFail: false, remark: 'Satisfactory' },
    { grade: 'D', minPercentage: 40, isFail: false, remark: 'Needs improvement' },
    { grade: 'F', minPercentage: 0, isFail: true, remark: 'Fail' },
]);

const sortScale = (scale) => [...scale].sort((a, b) => b.minPercentage - a.minPercentage);

const usableScale = (scale) => (Array.isArray(scale) && scale.length ? sortScale(scale) : DEFAULT_GRADE_SCALE);

// Highest band whose minimum the percentage reaches
const bandFor = (percentage, scale) => {
    const bands = usableScale(scale);
    return bands.find((b) => percentage >= b.minPercentage) || bands[bands.length - 1];
};

const gradeFor = (percentage, scale) => bandFor(percentage, scale).grade;

// Validates and normalises a scale submitted by an administrator
const normaliseScale = (input) => {
    if (!Array.isArray(input) || input.length < 2 || input.length > 15) {
        throw new AppError('The grading scale needs between 2 and 15 grades', 400);
    }
    const seen = new Set();
    const scale = input.map((row, index) => {
        const grade = String(row?.grade || '').trim().toUpperCase();
        const minPercentage = Number(row?.minPercentage);
        if (!grade || grade.length > 5) throw new AppError(`Row ${index + 1}: grade must be 1–5 characters`, 400);
        if (seen.has(grade)) throw new AppError(`Grade "${grade}" appears more than once`, 400);
        seen.add(grade);
        if (!Number.isFinite(minPercentage) || minPercentage < 0 || minPercentage > 100) {
            throw new AppError(`Row ${index + 1}: minimum percentage must be between 0 and 100`, 400);
        }
        return { grade, minPercentage, isFail: Boolean(row?.isFail), remark: String(row?.remark || '').trim().slice(0, 60) };
    });
    const sorted = sortScale(scale);
    if (new Set(sorted.map((b) => b.minPercentage)).size !== sorted.length) {
        throw new AppError('Each grade must have a different minimum percentage', 400);
    }
    if (sorted[sorted.length - 1].minPercentage !== 0) {
        throw new AppError('The lowest grade must start at 0% so every mark gets a grade', 400);
    }
    if (!sorted.some((b) => b.isFail)) throw new AppError('Mark at least one grade as a failing grade', 400);
    if (sorted[0].isFail) throw new AppError('The highest grade cannot be a failing grade', 400);
    return sorted;
};

module.exports = { DEFAULT_GRADE_SCALE, gradeFor, bandFor, normaliseScale, usableScale };
