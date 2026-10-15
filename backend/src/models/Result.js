const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
    {
        exam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exam',
            required: true,
            immutable: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
            immutable: true,
        },
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
            immutable: true,
        },
        obtainedMarks: {
            type: Number,
            required: true,
            min: 0,
        },
        maximumMarks: {
            type: Number,
            required: true,
            min: 1,
        },
        passingMarks: {
            type: Number,
            min: 0,
        },
        percentage: {
            type: Number,
        },
        grade: {
            type: String,
            enum: ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'],
        },
        status: {
            type: String,
            enum: ['PASS', 'FAIL'],
        },
        enteredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            immutable: true,
        }
    },
    {
        timestamps: true,
    }
);

resultSchema.index({ exam: 1, student: 1, subject: 1 }, { unique: true });

// Marks validation must run during validation (invalidate() inside a save hook
// is too late and the document would still be written).
resultSchema.pre('validate', function () {
    if (typeof this.obtainedMarks === 'number' && typeof this.maximumMarks === 'number' && this.obtainedMarks > this.maximumMarks) {
        this.invalidate('obtainedMarks', `Obtained marks cannot exceed maximum marks (${this.maximumMarks}).`);
    }
});

resultSchema.pre('save', async function () {
    // Deterministically compute percentage and grade on the server,
    // using the school's configured grading scale (Settings → Grading).
    this.percentage = Number(((this.obtainedMarks / this.maximumMarks) * 100).toFixed(2));

    const { getGradeScale } = require('../services/settingsService');
    const { bandFor } = require('../utils/grading');
    const band = bandFor(this.percentage, await getGradeScale());
    this.grade = band.grade;

    // PASS/FAIL follows the subject's own passing marks when known
    // (stored on the result), otherwise falls back to the grade's fail flag.
    if (typeof this.passingMarks === 'number') {
        this.status = this.obtainedMarks >= this.passingMarks ? 'PASS' : 'FAIL';
    } else {
        this.status = band.isFail ? 'FAIL' : 'PASS';
    }
});

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
