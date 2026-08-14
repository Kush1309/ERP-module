const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
    {
        participants: {
            type: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }],
            required: [true, 'Participants are required'],
            validate: [
                {
                    validator: function (val) {
                        return val.length >= 2;
                    },
                    message: 'A conversation must have at least 2 participants.',
                },
                {
                    validator: function (val) {
                        const uniqueIds = new Set(val.map(id => id.toString()));
                        return uniqueIds.size === val.length;
                    },
                    message: 'Duplicate participants are not allowed.',
                }
            ],
        },
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: null,
        },
        lastMessageAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
// Fast lookup of conversations for a user, sorted by last message time
conversationSchema.index({ participants: 1, lastMessageAt: -1 });
// Compound index ensures we don't have multiple 2-person identical conversations?
// For now, only providing retrieval indexes. The service layer handles preventing duplicate DMs.

module.exports = mongoose.model('Conversation', conversationSchema);
