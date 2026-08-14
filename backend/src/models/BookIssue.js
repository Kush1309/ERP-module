const mongoose = require('mongoose');

const bookIssueSchema = new mongoose.Schema(
    {
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: [true, 'Book ID is required']
        },
        requesterId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Requester ID is required'],
            refPath: 'requesterModel'
        },
        requesterModel: {
            type: String,
            required: [true, 'Requester model is required'],
            enum: {
                values: ['Student', 'Teacher'],
                message: '{VALUE} is not a valid requester model'
            }
        },
        issueDate: {
            type: Date,
            required: [true, 'Issue date is required']
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required']
        },
        returnDate: {
            type: Date
        },
        status: {
            type: String,
            required: [true, 'Status is required'],
            enum: {
                values: ['ISSUED', 'RETURNED', 'OVERDUE'],
                message: '{VALUE} is not a valid status'
            },
            default: 'ISSUED'
        }
    },
    { timestamps: true }
);

bookIssueSchema.index({ bookId: 1 });
bookIssueSchema.index({ requesterId: 1, requesterModel: 1 });
bookIssueSchema.index({ status: 1 });
bookIssueSchema.index({ dueDate: 1 });

bookIssueSchema.pre('save', function (next) {
    // dueDate must not precede issueDate
    if (this.dueDate && this.issueDate && this.dueDate < this.issueDate) {
        return next(new Error('Due date cannot be earlier than issue date.'));
    }

    // returnDate validation
    if (this.returnDate) {
        if (this.issueDate && this.returnDate < this.issueDate) {
            return next(new Error('Return date cannot be earlier than issue date.'));
        }

        // Logical cross validation
        if (this.status === 'ISSUED') {
            return next(new Error('Active ISSUED records cannot contain a return date.'));
        }
    } else {
        if (this.status === 'RETURNED') {
            return next(new Error('RETURNED status demands a recorded returnDate.'));
        }
    }

    next();
});

const BookIssue = mongoose.model('BookIssue', bookIssueSchema);

module.exports = BookIssue;
