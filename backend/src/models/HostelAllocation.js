const mongoose = require('mongoose');

const hostelAllocationSchema = new mongoose.Schema(
    {
        room: { type: mongoose.Schema.Types.ObjectId, ref: 'HostelRoom', required: true },
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
        bedNumber: { type: String, trim: true, default: '' },
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date, default: null },
        status: { type: String, enum: ['ACTIVE', 'VACATED'], default: 'ACTIVE' },
        notes: { type: String, trim: true, default: '' },
    },
    { timestamps: true }
);

hostelAllocationSchema.index({ room: 1, status: 1 });
hostelAllocationSchema.index(
    { student: 1 },
    { unique: true, partialFilterExpression: { status: 'ACTIVE' }, name: 'one_active_hostel_bed_per_student' }
);

module.exports = mongoose.model('HostelAllocation', hostelAllocationSchema);
