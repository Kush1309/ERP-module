const mongoose = require('mongoose');

const EXAM_TYPES = ['MID_TERM', 'FINAL', 'UNIT_TEST', 'QUARTERLY', 'OTHER'];
const EXAM_STATUSES = ['UPCOMING', 'ACTIVE', 'COMPLETED', 'PUBLISHED'];

const examSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: EXAM_TYPES,
            required: true,
        },
        academicSession: {
            type: String,
            required: true,
            trim: true,
        },
        class: {
            type: String,
            required: true,
            trim: true,
        },
        section: {
            type: String,
            trim: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: EXAM_STATUSES,
            default: 'UPCOMING',
        },
        createdBy: {
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

examSchema.pre('validate', function () {
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
        this.invalidate('startDate', 'Start date must be before or equal to end date.');
    }
});

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
