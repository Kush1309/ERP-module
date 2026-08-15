const mongoose = require('mongoose');

const transportAllocationSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'Student reference is required']
        },
        routeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TransportRoute',
            required: [true, 'Route reference is required']
        },
        pickupStop: {
            type: String,
            required: [true, 'Pickup stop is required'],
            trim: true,
            minLength: [1, 'Pickup stop cannot be empty']
        },
        dropStop: {
            type: String,
            required: [true, 'Drop stop is required'],
            trim: true,
            minLength: [1, 'Drop stop cannot be empty']
        },
        status: {
            type: String,
            enum: {
                values: ['ACTIVE', 'INACTIVE'],
                message: '{VALUE} is not a valid status'
            },
            default: 'ACTIVE',
            required: [true, 'Status is required']
        }
    },
    {
        timestamps: true
    }
);

// Basic indexes for querying
transportAllocationSchema.index({ studentId: 1 });
transportAllocationSchema.index({ routeId: 1 });

// Partial unique index to enforce only one ACTIVE allocation per student
transportAllocationSchema.index(
    { studentId: 1 },
    {
        unique: true,
        partialFilterExpression: { status: 'ACTIVE' },
        name: 'unique_active_allocation_per_student'
    }
);

const TransportAllocation = mongoose.model('TransportAllocation', transportAllocationSchema);

module.exports = TransportAllocation;
