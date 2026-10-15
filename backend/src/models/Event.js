const mongoose = require('mongoose');

const EVENT_TYPES = [
    'ACADEMIC',
    'SPORTS',
    'CULTURAL',
    'MEETING',
    'HOLIDAY',
    'EXAMINATION',
    'WORKSHOP',
    'OTHER'
];

const TARGET_AUDIENCES = [
    'ALL',
    'STUDENTS',
    'TEACHERS',
    'PARENTS'
];

const EVENT_STATUSES = [
    'DRAFT',
    'PUBLISHED',
    'CANCELLED',
    'COMPLETED'
];

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Event title is required'],
            trim: true,
            maxlength: [255, 'Event title cannot exceed 255 characters'],
            validate: {
                validator: function (v) {
                    return typeof v === 'string' && v.trim().length > 0;
                },
                message: 'Event title cannot be empty'
            }
        },
        description: {
            type: String,
            trim: true,
            maxlength: [5000, 'Description cannot exceed 5000 characters'],
            default: ''
        },
        eventDate: {
            type: Date,
            required: [true, 'Event date is required']
        },
        startTime: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    if (v === undefined || v === null || v === '') return true;
                    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                },
                message: 'Start time must be in HH:MM format (24-hour)'
            }
        },
        endTime: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    if (v === undefined || v === null || v === '') return true;
                    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                },
                message: 'End time must be in HH:MM format (24-hour)'
            }
        },
        location: {
            type: String,
            trim: true,
            maxlength: [255, 'Location cannot exceed 255 characters'],
            default: ''
        },
        eventType: {
            type: String,
            required: [true, 'Event type is required'],
            enum: {
                values: EVENT_TYPES,
                message: '{VALUE} is not a valid event type'
            },
            trim: true,
            uppercase: true
        },
        targetAudience: {
            type: String,
            required: [true, 'Target audience is required'],
            enum: {
                values: TARGET_AUDIENCES,
                message: '{VALUE} is not a valid target audience'
            },
            default: 'ALL',
            trim: true,
            uppercase: true
        },
        applicableClasses: {
            type: [
                {
                    type: String,
                    trim: true
                }
            ],
            default: []
        },
        section: {
            type: String,
            trim: true,
            default: ''
        },
        status: {
            type: String,
            required: [true, 'Status is required'],
            enum: {
                values: EVENT_STATUSES,
                message: '{VALUE} is not a valid event status'
            },
            default: 'DRAFT',
            trim: true,
            uppercase: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator user reference is required'],
            immutable: true
        }
    },
    {
        timestamps: true
    }
);

// Indexes
eventSchema.index({ eventDate: 1, status: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ targetAudience: 1 });
eventSchema.index({ createdBy: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
