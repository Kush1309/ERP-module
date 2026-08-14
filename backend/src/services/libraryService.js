const Book = require('../models/Book');
const BookIssue = require('../models/BookIssue');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const ParentProfile = require('../models/ParentProfile');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

/**
 * Helper to validate ObjectId
 */
const validateObjectId = (id, resourceName = 'ID') => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(`Invalid ${resourceName}`, 400);
    }
};

/**
 * Helper for safe regex searches
 */
const escapeRegExp = (string) => {
    if (!string) return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

class LibraryService {
    // -------------------------------------------------------------
    // BOOK CATALOGUE MANAGEMENT
    // -------------------------------------------------------------

    /**
     * Creates a new Book (Admin Only)
     */
    async createBook(data, currentUser) {
        if (currentUser.role !== 'ADMIN') {
            throw new AppError('Unauthorized: Only administrators can create books', 403);
        }

        const { title, author, isbn, publisher, category, totalCopies, availableCopies } = data;

        let initialAvailable = availableCopies !== undefined ? availableCopies : totalCopies;

        if (initialAvailable > totalCopies) {
            throw new AppError('Available copies cannot exceed total copies', 400);
        }

        const existingBook = await Book.findOne({ isbn: isbn });
        if (existingBook) {
            throw new AppError('A book with this ISBN already exists', 409);
        }

        const newBook = new Book({
            title,
            author,
            isbn,
            publisher,
            category,
            totalCopies,
            availableCopies: initialAvailable
        });

        await newBook.save();
        return newBook;
    }

    /**
     * Lists Books safely with pagination
     * Accessible by ALL roles
     */
    async getBooks(params = {}) {
        const query = {};

        // Search & Filters
        if (params.search) {
            const searchRegex = new RegExp(escapeRegExp(params.search), 'i');
            query.$or = [
                { title: searchRegex },
                { author: searchRegex },
                { isbn: searchRegex }
            ];
        }

        if (params.category) query.category = params.category;

        // Pagination logic
        const page = Math.max(1, parseInt(params.page, 10) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(params.limit, 10) || 10));
        const skip = (page - 1) * limit;

        const books = await Book.find(query)
            .sort({ title: 1 })
            .skip(skip)
            .limit(limit)
            .select('-__v')
            .lean();

        const total = await Book.countDocuments(query);

        return {
            data: books,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Retrieves specific Book by ID
     * Accessible by ALL roles
     */
    async getBookById(bookId) {
        validateObjectId(bookId, 'Book ID');

        const book = await Book.findById(bookId).select('-__v').lean();
        if (!book) {
            throw new AppError('Book not found', 404);
        }

        return book;
    }

    /**
     * Updates an existing book (Admin only)
     */
    async updateBook(bookId, data, currentUser) {
        if (currentUser.role !== 'ADMIN') {
            throw new AppError('Unauthorized: Only administrators can update books', 403);
        }

        validateObjectId(bookId, 'Book ID');

        const book = await Book.findById(bookId);
        if (!book) {
            throw new AppError('Book not found', 404);
        }

        // Whitelist updates
        const updatableFields = ['title', 'author', 'isbn', 'publisher', 'category', 'totalCopies'];
        const updates = {};
        updatableFields.forEach(field => {
            if (data[field] !== undefined) {
                updates[field] = data[field];
            }
        });

        if (updates.isbn && updates.isbn !== book.isbn) {
            const exists = await Book.findOne({ isbn: updates.isbn });
            if (exists) {
                throw new AppError('A book with this new ISBN already exists', 409);
            }
        }

        if (updates.totalCopies !== undefined) {
            const currentlyIssuedCopies = book.totalCopies - book.availableCopies;

            if (updates.totalCopies < currentlyIssuedCopies) {
                throw new AppError(`Cannot reduce totalCopies below ${currentlyIssuedCopies} because they are currently issued`, 409);
            }

            // Adjust available copies proportionately matching the delta in totalCopies
            const copyDelta = updates.totalCopies - book.totalCopies;
            book.availableCopies += copyDelta;
            book.totalCopies = updates.totalCopies;

            delete updates.totalCopies;
        }

        // Apply remaining updates
        Object.assign(book, updates);
        await book.save();

        return book;
    }

    /**
     * Delete an existing book (Admin only)
     */
    async deleteBook(bookId, currentUser) {
        if (currentUser.role !== 'ADMIN') {
            throw new AppError('Unauthorized: Only administrators can delete books', 403);
        }

        validateObjectId(bookId, 'Book ID');

        const book = await Book.findById(bookId);
        if (!book) throw new AppError('Book not found', 404);

        // Active Issue Check
        const activeIssues = await BookIssue.countDocuments({
            bookId: bookId,
            status: { $in: ['ISSUED', 'OVERDUE'] }
        });

        if (activeIssues > 0) {
            throw new AppError('Cannot delete a book that currently has active issues', 409);
        }

        await Book.deleteOne({ _id: bookId });
    }


    // -------------------------------------------------------------
    // BOOK ISSUES (LENDING MANAGER)
    // -------------------------------------------------------------

    /**
     * Forces the creation of a new Issue ticket (Admin ONLY currently)
     */
    async createIssue(data, currentUser) {
        if (currentUser.role !== 'ADMIN') {
            throw new AppError('Unauthorized: Only administrators can issue books', 403);
        }

        const { bookId, requesterId, requesterModel, dueDate } = data;

        validateObjectId(bookId, 'Book ID');
        validateObjectId(requesterId, 'Requester ID');

        if (!['Student', 'Teacher'].includes(requesterModel)) {
            throw new AppError('Requester model must be Student or Teacher', 400);
        }

        const book = await Book.findById(bookId);
        if (!book) {
            throw new AppError('Book not found', 404);
        }

        if (book.availableCopies <= 0) {
            throw new AppError('No available copies for this book', 409);
        }

        // Validate requester existence natively preventing ghost linking
        if (requesterModel === 'Student') {
            const studentExists = await Student.findById(requesterId).lean();
            if (!studentExists) throw new AppError('Student requester not found', 404);
        } else if (requesterModel === 'Teacher') {
            const teacherExists = await Teacher.findById(requesterId).lean();
            if (!teacherExists) throw new AppError('Teacher requester not found', 404);
        }

        const issueDate = new Date();
        const parsedDueDate = new Date(dueDate);

        if (parsedDueDate < issueDate) {
            throw new AppError('Due date cannot precede the issue date', 400);
        }

        const activeIssuesForRequester = await BookIssue.findOne({
            bookId,
            requesterId,
            requesterModel,
            status: { $in: ['ISSUED', 'OVERDUE'] }
        }).lean();

        if (activeIssuesForRequester) {
            throw new AppError('Requester already has an active issue for this book', 409);
        }

        const session = await mongoose.startSession();
        let newIssue;

        try {
            session.startTransaction();

            // Atomic decrementation securing racing edge cases mapped identically within transaction boundary
            const updatedBook = await Book.findOneAndUpdate(
                { _id: bookId, availableCopies: { $gt: 0 } },
                { $inc: { availableCopies: -1 } },
                { new: true, session }
            );

            if (!updatedBook) {
                throw new AppError('Race condition: Book copy became unavailable during execution', 409);
            }

            const issueData = new BookIssue({
                bookId,
                requesterId,
                requesterModel,
                issueDate,
                dueDate: parsedDueDate,
                status: 'ISSUED'
            });

            [newIssue] = await BookIssue.create([issueData], { session });

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            // Re-throw handled AppErrors smoothly
            if (error instanceof AppError) throw error;
            throw new AppError('Library transaction failed internally', 500);
        } finally {
            session.endSession();
        }

        return newIssue;
    }

    /**
     * Lists active or historical Book Issues
     */
    async getIssues(params, currentUser) {
        const query = {};

        // Security boundary
        if (currentUser.role === 'ADMIN') {
            // Global scope
        } else if (currentUser.role === 'TEACHER') {
            query.requesterId = currentUser.teacherId;
            query.requesterModel = 'Teacher';
        } else if (currentUser.role === 'STUDENT') {
            query.requesterId = currentUser.studentId;
            query.requesterModel = 'Student';
        } else if (currentUser.role === 'PARENT') {
            const parent = await ParentProfile.findOne({ userId: currentUser._id }).lean();
            if (!parent || !parent.students || parent.students.length === 0) {
                return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
            }
            query.requesterId = { $in: parent.students };
            query.requesterModel = 'Student';
        } else {
            throw new AppError('Unauthorized role access', 403);
        }

        // Scope constraints for user parameters (Admin can query specifically)
        if (currentUser.role === 'ADMIN' && params.requesterId) {
            validateObjectId(params.requesterId);
            query.requesterId = params.requesterId;
        }

        if (params.bookId) {
            validateObjectId(params.bookId);
            query.bookId = params.bookId;
        }

        if (params.status) {
            query.status = params.status;
        }

        const page = Math.max(1, parseInt(params.page, 10) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(params.limit, 10) || 10));
        const skip = (page - 1) * limit;

        const issues = await BookIssue.find(query)
            .populate('bookId', 'title author isbn')
            .populate('requesterId', 'firstName lastName admissionNumber employeeId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await BookIssue.countDocuments(query);

        return {
            data: issues,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Updates an Issue mapping it to RETURNED
     * Accessible by Admins ONLY implicitly currently
     */
    async returnBook(issueId, currentUser) {
        if (currentUser.role !== 'ADMIN') {
            throw new AppError('Unauthorized: Only administrators can process book returns', 403);
        }

        validateObjectId(issueId, 'Issue ID');

        const session = await mongoose.startSession();
        let returningIssue;

        try {
            session.startTransaction();

            returningIssue = await BookIssue.findById(issueId).session(session);

            if (!returningIssue) {
                throw new AppError('Book Issue ticket not found', 404);
            }

            if (returningIssue.status === 'RETURNED') {
                throw new AppError('This issue log is already closed/returned', 409);
            }

            const bookId = returningIssue.bookId;

            // Increment atomic availability ensuring it doesn't break limits
            const updatedBook = await Book.findOneAndUpdate(
                { _id: bookId, $expr: { $lt: ["$availableCopies", "$totalCopies"] } },
                { $inc: { availableCopies: 1 } },
                { new: true, session }
            );

            // Failsafe. If the book was somehow manually mutated breaking bounds, or removed
            if (!updatedBook) {
                throw new AppError('Inventory constraint blocked return processing', 409);
            }

            returningIssue.status = 'RETURNED';
            returningIssue.returnDate = new Date();

            await returningIssue.save({ session });

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            if (error instanceof AppError) throw error;
            throw new AppError('Failed processing the book return log', 500);
        } finally {
            session.endSession();
        }

        return returningIssue;
    }

}

const libraryService = new LibraryService();
module.exports = libraryService;
