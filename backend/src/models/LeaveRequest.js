const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
    {
        requesterId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'requesterModel'
        },
        requesterModel: {
            type: String,
            required: true,
            enum: ['Student', 'Teacher']
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    if (!this.startDate || !value) return true;
                    return this.startDate <= value;
                },
                message: 'End date must be greater than or equal to start date'
            }
        },
        type: {
            type: String,
            required: true,
            enum: ['SICK', 'CASUAL', 'OTHER']
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 5000
        },
        status: {
            type: String,
            required: true,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING'
        },
        approverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        adminComment: {
            type: String,
            trim: true,
            maxlength: 5000
        }
    },
    {
        timestamps: true
    }
);

leaveRequestSchema.index({ requesterId: 1, requesterModel: 1 });
leaveRequestSchema.index({ status: 1 });
leaveRequestSchema.index({ startDate: 1 });

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

module.exports = LeaveRequest;
