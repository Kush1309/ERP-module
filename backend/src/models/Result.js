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

resultSchema.pre('save', async function (next) {
    if (this.obtainedMarks > this.maximumMarks) {
        this.invalidate('obtainedMarks', 'Obtained marks cannot exceed maximum marks.');
    }

    // Deterministically compute Grade details ensuring Math consistency natively.
    this.percentage = Number(((this.obtainedMarks / this.maximumMarks) * 100).toFixed(2));

    if (this.percentage >= 90) this.grade = 'A+';
    else if (this.percentage >= 80) this.grade = 'A';
    else if (this.percentage >= 70) this.grade = 'B+';
    else if (this.percentage >= 60) this.grade = 'B';
    else if (this.percentage >= 50) this.grade = 'C';
    else if (this.percentage >= 40) this.grade = 'D';
    else this.grade = 'F';

    // In real projects, pass/fail may map uniquely relative to Subject specific passingMarks.
    // For safety natively against the schema values:
    this.status = this.grade === 'F' ? 'FAIL' : 'PASS';

    next();
});

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
