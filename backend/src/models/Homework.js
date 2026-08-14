const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255
        },
        description: {
            type: String,
            trim: true,
            maxlength: 5000
        },
        class: {
            type: String,
            required: true,
            trim: true
        },
        section: {
            type: String,
            required: true,
            trim: true
        },
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher',
            required: true
        },
        dueDate: {
            type: Date
        },
        status: {
            type: String,
            enum: ['DRAFT', 'PUBLISHED'],
            default: 'DRAFT',
            required: true
        }
    },
    {
        timestamps: true
    }
);

homeworkSchema.index({ teacherId: 1 });
homeworkSchema.index({ class: 1, section: 1, status: 1 });
homeworkSchema.index({ dueDate: 1 });

const Homework = mongoose.model('Homework', homeworkSchema);

module.exports = Homework;
