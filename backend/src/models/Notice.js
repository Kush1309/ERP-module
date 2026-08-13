const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

const noticeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000
        },
        category: {
            type: String,
            required: true,
            enum: ['GENERAL', 'ACADEMIC', 'EXAMINATION', 'ATTENDANCE', 'EVENT', 'HOLIDAY', 'EMERGENCY']
        },
        priority: {
            type: String,
            enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
            default: 'NORMAL'
        },
        audience: {
            type: String,
            required: true,
            enum: ['ALL', 'TEACHERS', 'STUDENTS', 'SPECIFIC_CLASS', 'SPECIFIC_SECTION']
        },
        targetClass: {
            type: String,
            trim: true
        },
        targetSection: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
            default: 'DRAFT'
        },
        publishedAt: {
            type: Date
        },
        expiresAt: {
            type: Date
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

noticeSchema.pre('validate', function (next) {
    if (this.audience === 'SPECIFIC_CLASS' && !this.targetClass) {
        return next(new AppError('Target class is required for SPECIFIC_CLASS audience', 400));
    }
    if (this.audience === 'SPECIFIC_SECTION') {
        if (!this.targetClass) return next(new AppError('Target class is required for SPECIFIC_SECTION audience', 400));
        if (!this.targetSection) return next(new AppError('Target section is required for SPECIFIC_SECTION audience', 400));
    }

    if (this.audience === 'ALL' || this.audience === 'TEACHERS' || this.audience === 'STUDENTS') {
        this.targetClass = undefined;
        this.targetSection = undefined;
    }

    if (this.status === 'PUBLISHED' && !this.publishedAt) {
        this.publishedAt = new Date();
    }

    if (this.publishedAt && this.expiresAt) {
        if (this.expiresAt < this.publishedAt) {
            return next(new AppError('Expiration date cannot be before publication date', 400));
        }
    }

    next();
});

noticeSchema.index({ status: 1, audience: 1, targetClass: 1, targetSection: 1, publishedAt: -1 });
noticeSchema.index({ createdBy: 1 });
noticeSchema.index({ expiresAt: 1 });

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;
