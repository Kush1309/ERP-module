const mongoose = require('mongoose');

const hostelRoomSchema = new mongoose.Schema(
    {
        block: { type: String, required: [true, 'Hostel/block name is required'], trim: true },
        roomNumber: { type: String, required: [true, 'Room number is required'], trim: true },
        type: { type: String, enum: ['BOYS', 'GIRLS', 'STAFF', 'MIXED'], default: 'BOYS' },
        capacity: { type: Number, required: [true, 'Capacity is required'], min: [1, 'Capacity must be at least 1'] },
        feePerTerm: { type: Number, min: [0, 'Fee cannot be negative'], default: 0 },
        status: { type: String, enum: ['AVAILABLE', 'MAINTENANCE', 'CLOSED'], default: 'AVAILABLE' },
        notes: { type: String, trim: true, default: '' },
    },
    { timestamps: true }
);

hostelRoomSchema.index({ block: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('HostelRoom', hostelRoomSchema);
