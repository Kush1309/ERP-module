const mongoose = require('mongoose');

// In-app notification for a single user.
const notificationSchema = new mongoose.Schema(
    {
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: {
            type: String,
            enum: ['ATTENDANCE', 'FEE', 'HOMEWORK', 'RESULT', 'NOTICE', 'LEAVE', 'LIBRARY', 'ADMISSION', 'GENERAL'],
            default: 'GENERAL',
        },
        title: { type: String, required: true, trim: true, maxlength: 200 },
        message: { type: String, trim: true, maxlength: 1000, default: '' },
        link: { type: String, trim: true, default: '' },
        isRead: { type: Boolean, default: false },
        readAt: { type: Date, default: null },
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
