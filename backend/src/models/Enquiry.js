const mongoose = require('mongoose');

// Admission enquiry from a prospective family, with follow-up history.
const enquirySchema = new mongoose.Schema(
    {
        studentName: { type: String, required: [true, 'Student name is required'], trim: true },
        parentName: { type: String, required: [true, 'Parent name is required'], trim: true },
        phone: { type: String, required: [true, 'Phone is required'], trim: true },
        email: { type: String, trim: true, lowercase: true, default: '' },
        classApplied: { type: String, required: [true, 'Class applied for is required'], trim: true },
        source: {
            type: String,
            enum: ['WALK_IN', 'PHONE', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'OTHER'],
            default: 'WALK_IN',
        },
        status: {
            type: String,
            enum: ['NEW', 'CONTACTED', 'FOLLOW_UP', 'APPLIED', 'CLOSED'],
            default: 'NEW',
        },
        notes: { type: String, trim: true, default: '' },
        nextFollowUpDate: { type: Date, default: null },
        followUps: [
            {
                note: { type: String, required: true, trim: true },
                date: { type: Date, default: Date.now },
                by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            },
        ],
        application: { type: mongoose.Schema.Types.ObjectId, ref: 'AdmissionApplication', default: null },
    },
    { timestamps: true }
);

enquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
