const mongoose = require('mongoose');

const feeRecordSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'Student ID is required'],
            index: true
        },
        feeStructureId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FeeStructure',
            required: [true, 'Fee Structure Reference is required']
        },
        amountDue: {
            type: Number,
            required: [true, 'Amount due is required'],
            min: [0, 'Amount cannot be negative']
        },
        amountPaid: {
            type: Number,
            default: 0,
            required: [true, 'Amount paid tracker is required'],
            min: [0, 'Paid amount cannot be negative']
        },
        paymentDate: {
            type: Date
        },
        status: {
            type: String,
            enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'],
            default: 'PENDING',
            required: true
        }
    },
    { timestamps: true }
);

// Block explicit identical structural assignments doubling up dynamically.
feeRecordSchema.index({ studentId: 1, feeStructureId: 1 }, { unique: true });

// Prevent amountPaid exceeding amountDue via pre-save validation
feeRecordSchema.pre('save', function (next) {
    if (this.amountPaid > this.amountDue) {
        return next(new Error('Amount paid safely cannot mathematically exceed total amount due.'));
    }

    // Auto status
    if (this.amountPaid === this.amountDue && this.amountDue > 0) {
        this.status = 'PAID';
        if (!this.paymentDate) this.paymentDate = new Date();
    } else if (this.amountPaid > 0 && this.amountPaid < this.amountDue) {
        this.status = 'PARTIAL';
    }
    next();
});

const FeeRecord = mongoose.model('FeeRecord', feeRecordSchema);

module.exports = FeeRecord;
