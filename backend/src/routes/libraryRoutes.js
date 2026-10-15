const express = require('express');
const router = express.Router();

const libraryController = require('../controllers/libraryController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../constants/roles');

// Apply authentication firewall universally
router.use(authenticateUser);

/**
 * ------------------------------------------------------------------
 * BOOK CATALOGUE ROUTES
 * ------------------------------------------------------------------
 */

// GET operations available to everyone to read catalogue
router.get('/books',
    authorizeRoles(ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT),
    libraryController.getBooks
);

router.get('/books/:id',
    authorizeRoles(ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT),
    libraryController.getBookById
);

// Mutating operations explicitly locked to Admins
router.post('/books',
    authorizeRoles(ROLES.ADMIN, ROLES.LIBRARIAN),
    libraryController.createBook
);

router.put('/books/:id',
    authorizeRoles(ROLES.ADMIN, ROLES.LIBRARIAN),
    libraryController.updateBook
);

router.delete('/books/:id',
    authorizeRoles(ROLES.ADMIN, ROLES.LIBRARIAN),
    libraryController.deleteBook
);


/**
 * ------------------------------------------------------------------
 * BOOK ISSUES ROUTES
 * ------------------------------------------------------------------
 */

// Everyone can pull their scoped read-state (enforced within service layer intrinsically)
router.get('/issues',
    authorizeRoles(ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT),
    libraryController.getIssues
);

// Admin exclusive actions orchestrating lending
router.post('/issues',
    authorizeRoles(ROLES.ADMIN, ROLES.LIBRARIAN),
    libraryController.createIssue
);

// Static endpoint to return a book correctly positioned ensuring robust route ordering
router.patch('/issues/:id/return',
    authorizeRoles(ROLES.ADMIN, ROLES.LIBRARIAN),
    libraryController.returnBook
);


const asyncHandler = require('../utils/asyncHandler');
const libraryService = require('../services/libraryService');

router.patch('/issues/:id/fine',
    authorizeRoles(ROLES.ADMIN, ROLES.LIBRARIAN),
    asyncHandler(async (req, res) => {
        const data = await libraryService.settleFine(req.params.id, String(req.body.action || '').toUpperCase(), req.user);
        res.json({ status: 'success', data });
    })
);

router.get('/report',
    authorizeRoles(ROLES.ADMIN, ROLES.LIBRARIAN),
    asyncHandler(async (req, res) => {
        res.json({ status: 'success', data: await libraryService.getReport(req.user) });
    })
);

module.exports = router;
