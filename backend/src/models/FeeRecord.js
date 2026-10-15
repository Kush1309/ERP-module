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
        // Approved concession / waiver deducted from amountDue
        discount: {
            type: Number,
            default: 0,
            min: [0, 'Discount cannot be negative']
        },
        discountReason: {
            type: String,
            trim: true,
            default: ''
        },
        discountApprovedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        // Copied from the fee structure when assigned (older records fall back to the structure)
        dueDate: {
            type: Date,
            default: null
        },
        // Offline payment ledger (cash, cheque, bank transfer, UPI...) with receipt numbers
        payments: [
            {
                amount: { type: Number, required: true, min: [0.01, 'Payment must be positive'] },
                paidAt: { type: Date, default: Date.now },
                method: {
                    type: String,
                    enum: ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'OTHER'],
                    default: 'CASH'
                },
                reference: { type: String, trim: true, default: '' },
                note: { type: String, trim: true, default: '' },
                receiptNumber: { type: String, required: true },
                recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
            }
        ],
        // Late charge accrued per settings.feeLateFeePerDay while the fee is overdue
        lateFee: { type: Number, min: 0, default: 0 },
        lateFeeWaived: { type: Boolean, default: false },
        lateFeeWaiverReason: { type: String, trim: true, default: '' },
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

// Net payable after concessions, including any (unwaived) late charge
feeRecordSchema.virtual('netDue').get(function () {
    return require('../utils/feeMath').netPayable(this);
});

feeRecordSchema.set('toJSON', { virtuals: true });
feeRecordSchema.set('toObject', { virtuals: true });

// Keep the paid amount within the net payable and derive the status
feeRecordSchema.pre('save', function (next) {
    if ((this.discount || 0) > this.amountDue) {
        return next(new Error('Discount cannot exceed the amount due.'));
    }
    const netDue = require('../utils/feeMath').netPayable(this);
    if (this.amountPaid > netDue + 0.001) {
        return next(new Error('Amount paid cannot exceed the net amount due.'));
    }

    if (this.amountPaid >= netDue) {
        this.status = 'PAID';
        if (!this.paymentDate && this.amountPaid > 0) this.paymentDate = new Date();
    } else if (this.dueDate && this.dueDate < new Date()) {
        this.status = 'OVERDUE';
    } else if (this.amountPaid > 0) {
        this.status = 'PARTIAL';
    } else {
        this.status = 'PENDING';
    }
    next();
});

const FeeRecord = mongoose.model('FeeRecord', feeRecordSchema);

module.exports = FeeRecord;
