const mongoose = require('mongoose');

// A student's submission for a homework item, with teacher feedback.
const homeworkSubmissionSchema = new mongoose.Schema(
    {
        homework: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework', required: true },
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
        content: { type: String, trim: true, maxlength: 5000, default: '' },
        attachmentUrl: { type: String, trim: true, default: '' },
        submittedAt: { type: Date, default: Date.now },
        isLate: { type: Boolean, default: false },
        status: { type: String, enum: ['SUBMITTED', 'GRADED', 'RETURNED'], default: 'SUBMITTED' },
        grade: { type: String, trim: true, maxlength: 20, default: '' },
        feedback: { type: String, trim: true, maxlength: 2000, default: '' },
        gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        gradedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

homeworkSubmissionSchema.index({ homework: 1, student: 1 }, { unique: true });

homeworkSubmissionSchema.pre('validate', function () {
    if (!this.content && !this.attachmentUrl) {
        this.invalidate('content', 'Add an answer or an attachment link before submitting');
    }
    if (this.attachmentUrl && !/^https?:\/\//i.test(this.attachmentUrl)) {
        this.invalidate('attachmentUrl', 'Attachment must be an http(s) link');
    }
});

module.exports = mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);
