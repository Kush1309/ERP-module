const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: [true, 'Conversation reference is required'],
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender reference is required'],
        },
        content: {
            type: String,
            required: [true, 'Message content is required'],
            trim: true,
            maxlength: [2000, 'Message cannot exceed 2000 characters'],
            validate: {
                validator: function (val) {
                    return val.trim().length > 0;
                },
                message: 'Whitespace-only messages are not allowed'
            }
        },
        readBy: {
            type: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }],
            default: [],
            validate: {
                validator: function (val) {
                    const uniqueIds = new Set(val.map(id => id.toString()));
                    return uniqueIds.size === val.length;
                },
                message: 'Duplicate read receipts are not allowed.',
            }
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
// Fast lookup of messages within a conversation, ordered chronologically
messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
