const libraryService = require('../services/libraryService');

class LibraryController {
    // -------------------------------------------------------------
    // BOOK ENDPOINTS
    // -------------------------------------------------------------
    async createBook(req, res, next) {
        try {
            // Hardening body mapping protecting against injection
            const safeData = {
                title: req.body.title,
                author: req.body.author,
                isbn: req.body.isbn,
                publisher: req.body.publisher,
                category: req.body.category,
                totalCopies: req.body.totalCopies,
                availableCopies: req.body.availableCopies
            };

            const book = await libraryService.createBook(safeData, req.user);
            res.status(201).json({
                status: 'success',
                data: book
            });
        } catch (error) {
            next(error);
        }
    }

    async getBooks(req, res, next) {
        try {
            // Whitelisting query mapping protecting unmanaged indexing strings
            const safeParams = {
                page: req.query.page,
                limit: req.query.limit,
                search: req.query.search,
                category: req.query.category
            };

            const result = await libraryService.getBooks(safeParams);
            res.status(200).json({
                status: 'success',
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async getBookById(req, res, next) {
        try {
            const book = await libraryService.getBookById(req.params.id);
            res.status(200).json({
                status: 'success',
                data: book
            });
        } catch (error) {
            next(error);
        }
    }

    async updateBook(req, res, next) {
        try {
            const safeData = {
                title: req.body.title,
                author: req.body.author,
                isbn: req.body.isbn,
                publisher: req.body.publisher,
                category: req.body.category,
                totalCopies: req.body.totalCopies
            };

            const book = await libraryService.updateBook(req.params.id, safeData, req.user);
            res.status(200).json({
                status: 'success',
                data: book
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteBook(req, res, next) {
        try {
            await libraryService.deleteBook(req.params.id, req.user);
            res.status(200).json({
                status: 'success',
                message: 'Book successfully deleted'
            });
        } catch (error) {
            next(error);
        }
    }

    // -------------------------------------------------------------
    // ISSUE LENDING ENDPOINTS
    // -------------------------------------------------------------
    async createIssue(req, res, next) {
        try {
            const safeData = {
                bookId: req.body.bookId,
                requesterId: req.body.requesterId,
                requesterModel: req.body.requesterModel,
                dueDate: req.body.dueDate
            };

            const issue = await libraryService.createIssue(safeData, req.user);
            res.status(201).json({
                status: 'success',
                data: issue
            });
        } catch (error) {
            next(error);
        }
    }

    async getIssues(req, res, next) {
        try {
            // Enforce clean query mapping blocking array indexing attacks
            const safeParams = {
                page: req.query.page,
                limit: req.query.limit,
                requesterId: req.query.requesterId,
                bookId: req.query.bookId,
                status: req.query.status
            };

            const result = await libraryService.getIssues(safeParams, req.user);
            res.status(200).json({
                status: 'success',
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async returnBook(req, res, next) {
        try {
            const returnedIssue = await libraryService.returnBook(req.params.id, req.user);
            res.status(200).json({
                status: 'success',
                data: returnedIssue
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new LibraryController();
