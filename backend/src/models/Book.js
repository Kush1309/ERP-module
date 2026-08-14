const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Book title is required'],
            trim: true,
            maxlength: [255, 'Book title cannot exceed 255 characters']
        },
        author: {
            type: String,
            required: [true, 'Author is required'],
            trim: true,
            maxlength: [255, 'Author name cannot exceed 255 characters']
        },
        isbn: {
            type: String,
            required: [true, 'ISBN is required'],
            unique: true,
            trim: true,
            maxlength: [50, 'ISBN cannot exceed 50 characters']
        },
        publisher: {
            type: String,
            trim: true,
            maxlength: [255, 'Publisher name cannot exceed 255 characters']
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
            maxlength: [100, 'Category cannot exceed 100 characters']
        },
        totalCopies: {
            type: Number,
            required: [true, 'Total copies count is required'],
            min: [0, 'Total copies cannot be negative'],
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer value'
            }
        },
        availableCopies: {
            type: Number,
            required: [true, 'Available copies count is required'],
            min: [0, 'Available copies cannot be negative'],
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer value'
            }
        }
    },
    { timestamps: true }
);

// Indexes for searching and preventing duplicate catalogs
bookSchema.index({ isbn: 1 }, { unique: true });
bookSchema.index({ title: 1 });
bookSchema.index({ category: 1 });

// Validate available copies logically against total copies
bookSchema.pre('save', function (next) {
    if (this.availableCopies > this.totalCopies) {
        return next(new Error('Available copies cannot logically exceed total copies.'));
    }
    next();
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
