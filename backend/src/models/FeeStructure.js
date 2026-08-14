const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Fee structure title is required'],
            trim: true,
            maxlength: 255
        },
        amount: {
            type: Number,
            required: [true, 'Fee amount is required'],
            min: [0, 'Fee amount cannot be negative']
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required']
        },
        applicableClasses: [
            { type: String, trim: true }
        ],
        academicYear: {
            type: String,
            required: [true, 'Academic year is required'],
            trim: true
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE'],
            default: 'ACTIVE',
            required: true
        }
    },
    { timestamps: true }
);

// Indexes mapping quick lookups
feeStructureSchema.index({ academicYear: 1, status: 1 });
feeStructureSchema.index({ title: 1 });
feeStructureSchema.index({ dueDate: 1 });

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

module.exports = FeeStructure;
