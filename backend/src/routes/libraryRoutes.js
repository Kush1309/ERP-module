const express = require('express');
const router = express.Router();

const libraryController = require('../controllers/libraryController');
const { authenticateUser, authorizeRoles } = require('../middlewares/authMiddleware');
const { ROLES } = require('../utils/constants');

// Apply authentication firewall universally
router.use(authenticateUser);

/**
 * ------------------------------------------------------------------
 * BOOK CATALOGUE ROUTES
 * ------------------------------------------------------------------
 */

// GET operations available to everyone to read catalogue
router.get('/books',
    authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT),
    libraryController.getBooks
);

router.get('/books/:id',
    authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT),
    libraryController.getBookById
);

// Mutating operations explicitly locked to Admins
router.post('/books',
    authorizeRoles(ROLES.ADMIN),
    libraryController.createBook
);

router.put('/books/:id',
    authorizeRoles(ROLES.ADMIN),
    libraryController.updateBook
);

router.delete('/books/:id',
    authorizeRoles(ROLES.ADMIN),
    libraryController.deleteBook
);


/**
 * ------------------------------------------------------------------
 * BOOK ISSUES ROUTES
 * ------------------------------------------------------------------
 */

// Everyone can pull their scoped read-state (enforced within service layer intrinsically)
router.get('/issues',
    authorizeRoles(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT),
    libraryController.getIssues
);

// Admin exclusive actions orchestrating lending
router.post('/issues',
    authorizeRoles(ROLES.ADMIN),
    libraryController.createIssue
);

// Static endpoint to return a book correctly positioned ensuring robust route ordering
router.patch('/issues/:id/return',
    authorizeRoles(ROLES.ADMIN),
    libraryController.returnBook
);


module.exports = router;
