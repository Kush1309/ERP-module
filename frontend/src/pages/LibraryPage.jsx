import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    getIssues,
    createIssue,
    returnBook
} from '../services/libraryApi';
import Modal from '../components/Modal';
import Button from '../components/Button';

function LibraryPage() {
    const { user } = useAuth();

    const isAdmin = user?.role === 'ADMIN';

    // Tabs: 'CATALOGUE' | 'ISSUES'
    const [activeTab, setActiveTab] = useState('CATALOGUE');

    // Data states
    const [books, setBooks] = useState([]);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Book Filter / Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [bookPage, setBookPage] = useState(1);
    const [bookTotalPages, setBookTotalPages] = useState(1);

    // Issue Filter / Search states
    const [issuePage, setIssuePage] = useState(1);
    const [issueTotalPages, setIssueTotalPages] = useState(1);

    // Modals
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track Edit
    const [editingBook, setEditingBook] = useState(null);

    // Forms
    const [bookForm, setBookForm] = useState({
        title: '', author: '', isbn: '', publisher: '', category: '', totalCopies: ''
    });

    const [issueForm, setIssueForm] = useState({
        bookId: '', requesterId: '', requesterModel: 'Student', dueDate: ''
    });

    // -------------------------------------------------------------
    // FETCH DATA
    // -------------------------------------------------------------

    // Books
    const fetchBooks = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);

            const params = { page, limit: 10 };
            if (searchQuery.trim() !== '') {
                params.search = searchQuery;
            }

            const res = await getBooks(params);
            setBooks(res.data);
            setBookPage(res.pagination.page);
            setBookTotalPages(res.pagination.totalPages);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load library catalog.');
        } finally {
            setLoading(false);
        }
    };

    // Issues
    const fetchIssues = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);

            const res = await getIssues({ page, limit: 10 });
            setIssues(res.data);
            setIssuePage(res.pagination.page);
            setIssueTotalPages(res.pagination.totalPages);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load library issues.');
        } finally {
            setLoading(false);
        }
    };

    // Debounce wrapper simulation for search
    useEffect(() => {
        if (activeTab === 'CATALOGUE') {
            const delayDebounceFn = setTimeout(() => {
                fetchBooks(1);
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        } else {
            fetchIssues(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, searchQuery]);


    // -------------------------------------------------------------
    // BOOK ACTIONS (ADMIN)
    // -------------------------------------------------------------

    const handleOpenBookModal = (book = null) => {
        if (!isAdmin) return;
        setError(null);
        if (book) {
            setEditingBook(book);
            setBookForm({
                title: book.title || '',
                author: book.author || '',
                isbn: book.isbn || '',
                publisher: book.publisher || '',
                category: book.category || '',
                totalCopies: book.totalCopies || ''
            });
        } else {
            setEditingBook(null);
            setBookForm({
                title: '', author: '', isbn: '', publisher: '', category: '', totalCopies: ''
            });
        }
        setIsBookModalOpen(true);
    };

    const closeBookModal = () => {
        setIsBookModalOpen(false);
        setEditingBook(null);
    };

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        setIsSubmitting(true);
        setError(null);

        try {
            if (editingBook) {
                await updateBook(editingBook._id, bookForm);
            } else {
                await createBook(bookForm);
            }
            closeBookModal();
            fetchBooks(bookPage); // Refresh
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save book constraints constraints.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBook = async (id) => {
        if (!isAdmin) return;
        if (!window.confirm('Delete this book entirely? This action aborts if issues are active.')) return;

        try {
            await deleteBook(id);
            fetchBooks(bookPage);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete book.');
        }
    };


    // -------------------------------------------------------------
    // ISSUE ACTIONS (ADMIN)
    // -------------------------------------------------------------
    const handleOpenIssueModal = (book = null) => {
        if (!isAdmin) return;
        setIssueForm({ bookId: book ? book._id : '', requesterId: '', requesterModel: 'Student', dueDate: '' });
        setIsIssueModalOpen(true);
    };

    const handleIssueSubmit = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        setIsSubmitting(true);
        setError(null);

        try {
            await createIssue(issueForm);
            setIsIssueModalOpen(false);
            if (activeTab === 'ISSUES') {
                fetchIssues(issuePage);
            } else {
                fetchBooks(bookPage);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to issue book.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReturnBook = async (issueId) => {
        if (!isAdmin) return;
        if (!window.confirm('Mark this book as returned?')) return;

        setIsSubmitting(true);
        try {
            await returnBook(issueId);
            fetchIssues(issuePage);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to return book.');
        } finally {
            setIsSubmitting(false);
        }
    };


    // -------------------------------------------------------------
    // UI RENDERING HELPERS
    // -------------------------------------------------------------

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-ink-900">Library Management</h1>
                    <p className="mt-2 text-sm text-ink-500">
                        {isAdmin ? 'Manage library catalog and monitor issues.' : 'Browse the library catalog.'}
                    </p>
                </div>
                {isAdmin && (
                    <div className="mt-4 sm:mt-0 flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => handleOpenIssueModal()}
                            className="whitespace-nowrap"
                        >
                            Issue Book
                        </Button>
                        <Button
                            onClick={() => handleOpenBookModal()}
                            className="whitespace-nowrap"
                        >
                            + Add Book
                        </Button>
                    </div>
                )}
            </div>

            {/* TAB RENDERING */}
            <div className="border-b border-ink-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('CATALOGUE')}
                        className={`${activeTab === 'CATALOGUE'
                            ? 'border-brand-500 text-brand-600'
                            : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-700'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        Browse Catalogue
                    </button>
                    <button
                        onClick={() => setActiveTab('ISSUES')}
                        className={`${activeTab === 'ISSUES'
                            ? 'border-brand-500 text-brand-600'
                            : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-700'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        {isAdmin ? 'All Issues' : 'My Issues'}
                    </button>
                </nav>
            </div>

            {/* ERROR AND ACTIONS */}
            {error && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 flex justify-between items-center text-sm text-red-600">
                    <span>{error}</span>
                    <button onClick={() => activeTab === 'CATALOGUE' ? fetchBooks(bookPage) : fetchIssues(issuePage)} className="underline hover:text-red-800">Retry</button>
                </div>
            )}

            {/* MAIN VIEWS */}
            {activeTab === 'CATALOGUE' && (
                <div className="space-y-4">
                    <div className="flex bg-white px-4 py-3 border border-ink-200 rounded-md shadow-sm">
                        <input
                            type="text"
                            placeholder="Search by title, author, isbn..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border-none focus:ring-0 text-base p-0 m-0"
                        />
                    </div>
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                        </div>
                    ) : books.length === 0 ? (
                        <div className="text-center p-12 bg-white rounded-xl border border-ink-200">
                            <p className="text-sm text-ink-500">No books found in catalogue.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {books.map(book => (
                                <div key={book._id} className="bg-white p-5 rounded-xl border border-ink-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-sm font-bold text-ink-900 leading-tight">{book.title}</h3>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${book.availableCopies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {book.availableCopies} left
                                            </span>
                                        </div>
                                        <p className="text-sm text-ink-600 mb-1">{book.author}</p>
                                        <div className="text-xs text-ink-500 space-y-1">
                                            <p>ISBN: {book.isbn}</p>
                                            <p>Category: {book.category}</p>
                                            {book.publisher && <p>Publisher: {book.publisher}</p>}
                                            <p className="mt-2 text-ink-400">Total copies: {book.totalCopies}</p>
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-ink-100">
                                            {book.availableCopies > 0 && (
                                                <button onClick={() => handleOpenIssueModal(book)} className="text-sm font-medium text-brand-600 hover:text-brand-800">Issue</button>
                                            )}
                                            <button onClick={() => handleOpenBookModal(book)} className="text-sm font-medium text-ink-600 hover:text-ink-800">Edit</button>
                                            <button onClick={() => handleDeleteBook(book._id)} className="text-sm font-medium text-red-600 hover:text-red-800">Delete</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Pagination Books */}
                    {bookTotalPages > 1 && (
                        <div className="flex justify-between items-center bg-white px-4 py-3 rounded-lg border border-ink-200 shadow-sm mt-6">
                            <button disabled={bookPage === 1} onClick={() => setBookPage(bookPage - 1)} className="text-sm text-ink-600 hover:text-ink-900 disabled:opacity-50">Previous</button>
                            <span className="text-sm text-ink-500">Page {bookPage} of {bookTotalPages}</span>
                            <button disabled={bookPage === bookTotalPages} onClick={() => setBookPage(bookPage + 1)} className="text-sm text-ink-600 hover:text-ink-900 disabled:opacity-50">Next</button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'ISSUES' && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                        </div>
                    ) : issues.length === 0 ? (
                        <div className="text-center p-12 bg-white rounded-xl border border-ink-200">
                            <p className="text-sm text-ink-500">No active issues found.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-ink-200 shadow-sm overflow-hidden overflow-x-auto">
                            <table className="min-w-full divide-y divide-ink-200">
                                <thead className="bg-ink-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Book</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Borrower</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Dates</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Status</th>
                                        {isAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-ink-500 uppercase tracking-wider">Action</th>}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-ink-200">
                                    {issues.map(issue => (
                                        <tr key={issue._id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-ink-900">{issue.bookId?.title || 'Unknown Book'}</div>
                                                <div className="text-xs text-ink-500">{issue.bookId?.isbn}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-ink-900">
                                                    {issue.requesterId ? `${issue.requesterId.firstName} ${issue.requesterId.lastName}` : 'Unknown Profile'}
                                                </div>
                                                <div className="text-xs text-ink-500">{issue.requesterModel}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">
                                                Iss: {new Date(issue.issueDate).toLocaleDateString()}<br />
                                                Due: {new Date(issue.dueDate).toLocaleDateString()}<br />
                                                {issue.returnDate && `Ret: ${new Date(issue.returnDate).toLocaleDateString()}`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${issue.status === 'RETURNED' ? 'bg-green-100 text-green-800' :
                                                    issue.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {issue.status}
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {issue.status !== 'RETURNED' && (
                                                        <button
                                                            disabled={isSubmitting}
                                                            onClick={() => handleReturnBook(issue._id)}
                                                            className="text-brand-600 hover:text-brand-900 disabled:opacity-50"
                                                        >
                                                            Mark Returned
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {/* Pagination Issues */}
                    {issueTotalPages > 1 && (
                        <div className="flex justify-between items-center bg-white px-4 py-3 rounded-lg border border-ink-200 shadow-sm mt-6">
                            <button disabled={issuePage === 1} onClick={() => setIssuePage(issuePage - 1)} className="text-sm text-ink-600 hover:text-ink-900 disabled:opacity-50">Previous</button>
                            <span className="text-sm text-ink-500">Page {issuePage} of {issueTotalPages}</span>
                            <button disabled={issuePage === issueTotalPages} onClick={() => setIssuePage(issuePage + 1)} className="text-sm text-ink-600 hover:text-ink-900 disabled:opacity-50">Next</button>
                        </div>
                    )}
                </div>
            )}


            {/* -------------------------------------------------------------
                MODALS
            ------------------------------------------------------------- */}

            {isAdmin && (
                <>
                    {/* Add/Edit Book Modal */}
                    <Modal isOpen={isBookModalOpen} onClose={closeBookModal} title={editingBook ? 'Edit Book' : 'Add New Book'}>
                        <form onSubmit={handleBookSubmit} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-700">Title *</label>
                                <input type="text" required value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} className="mt-1 w-full rounded-md border-ink-300 focus:ring-brand-500 focus:border-brand-500 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink-700">Author *</label>
                                    <input type="text" required value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} className="mt-1 w-full rounded-md border-ink-300 focus:ring-brand-500 focus:border-brand-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink-700">ISBN *</label>
                                    <input type="text" required value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} className="mt-1 w-full rounded-md border-ink-300 focus:ring-brand-500 focus:border-brand-500 text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink-700">Publisher</label>
                                    <input type="text" value={bookForm.publisher} onChange={e => setBookForm({ ...bookForm, publisher: e.target.value })} className="mt-1 w-full rounded-md border-ink-300 focus:ring-brand-500 focus:border-brand-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink-700">Category *</label>
                                    <input type="text" required value={bookForm.category} onChange={e => setBookForm({ ...bookForm, category: e.target.value })} className="mt-1 w-full rounded-md border-ink-300 focus:ring-brand-500 focus:border-brand-500 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink-700">Total Copies (Inventory) *</label>
                                <input type="number" min="0" required value={bookForm.totalCopies} onChange={e => setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value, 10) })} className="mt-1 w-full rounded-md border-ink-300 focus:ring-brand-500 focus:border-brand-500 text-sm" />
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={closeBookModal} disabled={isSubmitting} className="px-4 py-2 text-sm border border-ink-300 text-ink-700 rounded-md hover:bg-ink-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50">
                                    {isSubmitting ? 'Saving...' : 'Save Book'}
                                </button>
                            </div>
                        </form>
                    </Modal>

                    {/* Issue Book Modal */}
                    <Modal isOpen={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} title="Issue Book">
                        <form onSubmit={handleIssueSubmit} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-700">Book ID *</label>
                                <input type="text" required value={issueForm.bookId} onChange={e => setIssueForm({ ...issueForm, bookId: e.target.value })} className="mt-1 w-full rounded-md border-ink-300 focus:ring-brand-500 focus:border-brand-500 text-sm" placeholder="Paste Book ID exactly" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink-700">Role *</label>
                                    <select value={issueForm.requesterModel} onChange={e => setIssueForm({ ...issueForm, requesterModel: e.target.value })} className="mt-1 w-full rounded-md border-ink-300 focus:ring-brand-500 focus:border-brand-500 text-sm">
                                        <option value="Student">Student</option>
                                        <option value="Teacher">Teacher</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink-700">User ID *</label>
                                    <input type="text" required value={issueForm.requesterId} onChange={e => setIssueForm({ ...issueForm, requesterId: e.target.value })} className="mt-1 w-full rounded-md border-ink-300 focus:ring-brand-500 focus:border-brand-500 text-sm" placeholder="User ID" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink-700">Due Date *</label>
                                <input type="date" required value={issueForm.dueDate} onChange={e => setIssueForm({ ...issueForm, dueDate: e.target.value })} className="mt-1 w-full rounded-md border-ink-300 focus:ring-brand-500 focus:border-brand-500 text-sm" />
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsIssueModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-sm border border-ink-300 text-ink-700 rounded-md hover:bg-ink-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50">
                                    {isSubmitting ? 'Processing...' : 'Issue Book'}
                                </button>
                            </div>
                        </form>
                    </Modal>
                </>
            )}
        </div>
    );
}

export default LibraryPage;
