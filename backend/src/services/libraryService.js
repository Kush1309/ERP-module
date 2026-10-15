const Book = require('../models/Book');
const BookIssue = require('../models/BookIssue');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const ParentProfile = require('../models/ParentProfile');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');
const { runInTransaction } = require('../utils/transaction');
const { getSettings } = require('./settingsService');
const { notifyUsers } = require('./notificationService');

// Administrators and librarians run the library desk
const LIBRARY_STAFF = ['ADMIN', 'LIBRARIAN'];
const DAY_MS = 24 * 60 * 60 * 1000;

const overdueDays = (dueDate, returnedAt = new Date()) => Math.max(Math.floor((returnedAt - new Date(dueDate)) / DAY_MS), 0);

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
        if (!LIBRARY_STAFF.includes(currentUser.role)) {
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
        if (!LIBRARY_STAFF.includes(currentUser.role)) {
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
        if (!LIBRARY_STAFF.includes(currentUser.role)) {
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
        if (!LIBRARY_STAFF.includes(currentUser.role)) {
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

        if (!dueDate || Number.isNaN(parsedDueDate.getTime())) {
            throw new AppError('A valid due date is required', 400);
        }

        // A date-only value (YYYY-MM-DD from a date picker) means "by the end of that day"
        if (typeof dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
            parsedDueDate.setUTCHours(23, 59, 59, 999);
        }

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

        const settings = await getSettings();
        const activeCount = await BookIssue.countDocuments({ requesterId, requesterModel, status: { $in: ['ISSUED', 'OVERDUE'] } });
        if (activeCount >= settings.libraryMaxActiveIssues) {
            throw new AppError(`Borrowing limit reached: at most ${settings.libraryMaxActiveIssues} book(s) can be borrowed at a time`, 409);
        }

        const newIssue = await runInTransaction(async (session) => {
            // Atomic decrement guards against two issues racing for the last copy
            const updatedBook = await Book.findOneAndUpdate(
                { _id: bookId, availableCopies: { $gt: 0 } },
                { $inc: { availableCopies: -1 } },
                { new: true, session }
            );

            if (!updatedBook) {
                throw new AppError('This book copy just became unavailable. Please try again.', 409);
            }

            try {
                const [issue] = await BookIssue.create([{
                    bookId,
                    requesterId,
                    requesterModel,
                    issueDate,
                    dueDate: parsedDueDate,
                    status: 'ISSUED'
                }], { session });
                return issue;
            } catch (error) {
                if (!session) {
                    // Restore the copy when we cannot rely on a transaction rollback
                    await Book.updateOne({ _id: bookId }, { $inc: { availableCopies: 1 } });
                }
                throw error;
            }
        });

        return newIssue;
    }

    /**
     * Lists active or historical Book Issues
     */
    async getIssues(params, currentUser) {
        await this.refreshOverdue();
        const query = {};

        // Security boundary
        if (LIBRARY_STAFF.includes(currentUser.role)) {
            // Global scope
        } else if (currentUser.role === 'TEACHER') {
            const teacher = await Teacher.findOne({ user: currentUser._id }).select('_id').lean();
            if (!teacher) {
                return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
            }
            query.requesterId = teacher._id;
            query.requesterModel = 'Teacher';
        } else if (currentUser.role === 'STUDENT') {
            const student = await Student.findOne({ user: currentUser._id }).select('_id').lean();
            if (!student) {
                return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
            }
            query.requesterId = student._id;
            query.requesterModel = 'Student';
        } else if (currentUser.role === 'PARENT') {
            const parent = await ParentProfile.findOne({ user: currentUser._id }).lean();
            if (!parent || !parent.students || parent.students.length === 0) {
                return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
            }
            query.requesterId = { $in: parent.students };
            query.requesterModel = 'Student';
        } else {
            throw new AppError('Unauthorized role access', 403);
        }

        // Scope constraints for user parameters (Admin can query specifically)
        if (LIBRARY_STAFF.includes(currentUser.role) && params.requesterId) {
            validateObjectId(params.requesterId);
            query.requesterId = params.requesterId;
        }

        if (params.bookId) {
            validateObjectId(params.bookId);
            query.bookId = params.bookId;
        }

        if (params.status) {
            query.status = String(params.status).toUpperCase();
        }
        if (params.fineStatus) {
            query.fineStatus = String(params.fineStatus).toUpperCase();
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
        if (!LIBRARY_STAFF.includes(currentUser.role)) {
            throw new AppError('Unauthorized: Only administrators can process book returns', 403);
        }

        validateObjectId(issueId, 'Issue ID');

        const returningIssue = await runInTransaction(async (session) => {
            // Atomically flip the issue to RETURNED so a double click cannot return twice
            const issue = await BookIssue.findOneAndUpdate(
                { _id: issueId, status: { $ne: 'RETURNED' } },
                { $set: { status: 'RETURNED', returnDate: new Date() } },
                { new: true, session }
            );

            if (!issue) {
                const exists = await BookIssue.exists({ _id: issueId }).session(session);
                if (!exists) {
                    throw new AppError('Book Issue ticket not found', 404);
                }
                throw new AppError('This issue log is already closed/returned', 409);
            }

            // Late-return fine from the configured library policy
            const settings = await getSettings();
            const daysLate = overdueDays(issue.dueDate, issue.returnDate);
            const fine = Math.round(daysLate * (settings.libraryFinePerDay || 0) * 100) / 100;
            if (fine > 0) {
                // Targeted update: the status flip above has already happened, so a full
                // document re-validation must not be able to abort the return half-way
                await BookIssue.updateOne({ _id: issue._id }, { $set: { fineAmount: fine, fineStatus: 'PENDING' } }, { session });
                issue.fineAmount = fine;
                issue.fineStatus = 'PENDING';
            }

            const book = await Book.findById(issue.bookId).session(session);
            if (book && book.availableCopies < book.totalCopies) {
                book.availableCopies += 1;
                await book.save({ session });
            }

            return issue;
        });

        return returningIssue;
    }


    /**
     * Flags issued books past their due date as OVERDUE and notifies borrowers once.
     */
    async refreshOverdue() {
        const now = new Date();
        const newlyOverdue = await BookIssue.find({ status: 'ISSUED', dueDate: { $lt: now } })
            .populate('bookId', 'title')
            .lean();
        if (!newlyOverdue.length) return 0;
        await BookIssue.updateMany({ _id: { $in: newlyOverdue.map((i) => i._id) } }, { $set: { status: 'OVERDUE' } });

        const studentIds = newlyOverdue.filter((i) => i.requesterModel === 'Student').map((i) => i.requesterId);
        const teacherIds = newlyOverdue.filter((i) => i.requesterModel === 'Teacher').map((i) => i.requesterId);
        const [students, teachers] = await Promise.all([
            Student.find({ _id: { $in: studentIds } }).select('user').lean(),
            Teacher.find({ _id: { $in: teacherIds } }).select('user').lean(),
        ]);
        const userByProfile = new Map([...students, ...teachers].map((p) => [String(p._id), p.user]));
        for (const issue of newlyOverdue) {
            const userId = userByProfile.get(String(issue.requesterId));
            if (userId) {
                notifyUsers([userId], {
                    type: 'LIBRARY',
                    title: `Library book overdue: ${issue.bookId?.title || 'book'}`,
                    message: `It was due on ${new Date(issue.dueDate).toISOString().slice(0, 10)}. Please return it to the library.`,
                    link: '/library',
                });
            }
        }
        return newlyOverdue.length;
    }

    /**
     * Records a fine as paid or waived (library staff only).
     */
    async settleFine(issueId, action, currentUser) {
        if (!LIBRARY_STAFF.includes(currentUser.role)) {
            throw new AppError('Only library staff can settle fines', 403);
        }
        validateObjectId(issueId, 'Issue ID');
        if (!['PAID', 'WAIVED'].includes(action)) throw new AppError('action must be PAID or WAIVED', 400);
        const issue = await BookIssue.findById(issueId);
        if (!issue) throw new AppError('Book Issue ticket not found', 404);
        if (issue.fineStatus !== 'PENDING') throw new AppError('There is no pending fine on this issue', 409);
        issue.fineStatus = action;
        await issue.save();
        return issue;
    }

    /**
     * Library summary report for staff.
     */
    async getReport(currentUser) {
        if (!LIBRARY_STAFF.includes(currentUser.role)) {
            throw new AppError('Only library staff can view library reports', 403);
        }
        await this.refreshOverdue();
        const [books, issues] = await Promise.all([
            Book.find().select('category totalCopies availableCopies').lean(),
            BookIssue.find().populate('bookId', 'title author').lean(),
        ]);
        const byCategory = new Map();
        books.forEach((b) => {
            const c = byCategory.get(b.category) || { category: b.category, titles: 0, copies: 0, available: 0 };
            c.titles += 1; c.copies += b.totalCopies; c.available += b.availableCopies;
            byCategory.set(b.category, c);
        });
        const popularity = new Map();
        issues.forEach((i) => {
            if (!i.bookId) return;
            const key = String(i.bookId._id);
            const p = popularity.get(key) || { title: i.bookId.title, author: i.bookId.author, issues: 0 };
            p.issues += 1;
            popularity.set(key, p);
        });
        const sum = (arr, fn) => arr.reduce((acc, x) => acc + fn(x), 0);
        return {
            totals: {
                titles: books.length,
                copies: sum(books, (b) => b.totalCopies),
                available: sum(books, (b) => b.availableCopies),
                activeIssues: issues.filter((i) => i.status !== 'RETURNED').length,
                overdue: issues.filter((i) => i.status === 'OVERDUE').length,
                finesPending: Math.round(sum(issues.filter((i) => i.fineStatus === 'PENDING'), (i) => i.fineAmount) * 100) / 100,
                finesCollected: Math.round(sum(issues.filter((i) => i.fineStatus === 'PAID'), (i) => i.fineAmount) * 100) / 100,
            },
            byCategory: [...byCategory.values()].sort((a, b) => a.category.localeCompare(b.category)),
            mostIssued: [...popularity.values()].sort((a, b) => b.issues - a.issues).slice(0, 10),
        };
    }

}

const libraryService = new LibraryService();
module.exports = libraryService;
