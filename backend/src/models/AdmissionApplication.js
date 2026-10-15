const mongoose = require('mongoose');

// Formal admission application. When approved and enrolled it is converted
// into a Student record (linked via `student`) exactly once.
const admissionApplicationSchema = new mongoose.Schema(
    {
        applicationNumber: { type: String, required: true, unique: true },
        enquiry: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', default: null },
        firstName: { type: String, required: [true, 'First name is required'], trim: true },
        lastName: { type: String, required: [true, 'Last name is required'], trim: true },
        dateOfBirth: { type: Date, required: [true, 'Date of birth is required'] },
        gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: [true, 'Gender is required'] },
        classApplied: { type: String, required: [true, 'Class applied for is required'], trim: true },
        guardianName: { type: String, required: [true, 'Guardian name is required'], trim: true },
        phone: { type: String, required: [true, 'Phone is required'], trim: true },
        email: { type: String, trim: true, lowercase: true, default: '' },
        address: { type: String, required: [true, 'Address is required'], trim: true },
        city: { type: String, required: [true, 'City is required'], trim: true },
        state: { type: String, required: [true, 'State is required'], trim: true },
        postalCode: { type: String, required: [true, 'Postal code is required'], trim: true },
        previousSchool: { type: String, trim: true, default: '' },
        documents: [
            {
                name: { type: String, required: true, trim: true },
                verified: { type: Boolean, default: false },
                verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
                verifiedAt: { type: Date, default: null },
            },
        ],
        status: {
            type: String,
            enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ENROLLED'],
            default: 'PENDING',
        },
        decisionNote: { type: String, trim: true, default: '' },
        decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        decidedAt: { type: Date, default: null },
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    },
    { timestamps: true }
);

admissionApplicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('AdmissionApplication', admissionApplicationSchema);
