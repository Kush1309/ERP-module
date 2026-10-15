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
import StudentPicker from '../components/common/StudentPicker';
import { getTeachers } from '../services/teacherApi';
import LibraryReport from '../components/library/LibraryReport';
import { libraryExtraApi } from '../services/moduleApi';

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function LibraryPage() {
    const { user } = useAuth();

    // Library staff: administrators and librarians manage the catalogue and lending
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

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
    const [issueStatus, setIssueStatus] = useState('');
    const [notice, setNotice] = useState('');

    // Modals
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [issueError, setIssueError] = useState(null);
    const [issueBook, setIssueBook] = useState(null);
    const [issueStudent, setIssueStudent] = useState(null);
    const [bookOptions, setBookOptions] = useState([]);
    const [teacherOptions, setTeacherOptions] = useState([]);

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

            const res = await getIssues({ page, limit: 10, status: issueStatus || undefined });
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
        } else if (activeTab === 'ISSUES') {
            fetchIssues(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, searchQuery, issueStatus]);


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
    const handleOpenIssueModal = async (book = null) => {
        if (!isAdmin) return;
        // Default due date: two weeks from today
        const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setIssueForm({ bookId: book ? book._id : '', requesterId: '', requesterModel: 'Student', dueDate: due });
        setIssueBook(book);
        setIssueStudent(null);
        setIssueError(null);
        setIsIssueModalOpen(true);
        try {
            const [bookData, teacherData] = await Promise.all([
                book ? Promise.resolve(null) : getBooks({ limit: 100 }),
                getTeachers({ limit: 100 }),
            ]);
            if (bookData) setBookOptions((bookData.data || []).filter((b) => b.availableCopies > 0));
            setTeacherOptions(teacherData?.teachers || []);
        } catch (err) {
            setIssueError(err.response?.data?.message || 'Unable to load books or teachers.');
        }
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
            setIssueError(err.response?.data?.message || 'Failed to issue book.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReturnBook = async (issueId) => {
        if (!isAdmin) return;
        if (!window.confirm('Mark this book as returned?')) return;

        setIsSubmitting(true);
        try {
            const response = await returnBook(issueId);
            const returned = response?.data || response;
            setNotice(returned?.fineAmount > 0 ? `Book returned late. Fine of ${rupees(returned.fineAmount)} is pending.` : 'Book returned.');
            fetchIssues(issuePage);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to return book.');
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleSettleFine = async (issue, action) => {
        if (!isAdmin) return;
        if (!window.confirm(`${action === 'PAID' ? 'Record payment of' : 'Waive'} the ${rupees(issue.fineAmount)} fine?`)) return;
        setIsSubmitting(true);
        try {
            await libraryExtraApi.settleFine(issue._id, action);
            setNotice(action === 'PAID' ? 'Fine marked as paid.' : 'Fine waived.');
            fetchIssues(issuePage);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update fine.');
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
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('REPORT')}
                            className={`${activeTab === 'REPORT'
                                ? 'border-brand-500 text-brand-600'
                                : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-700'
                                } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                        >
                            Reports
                        </button>
                    )}
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
                            <button disabled={bookPage === 1} onClick={() => fetchBooks(bookPage - 1)} className="text-sm text-ink-600 hover:text-ink-900 disabled:opacity-50">Previous</button>
                            <span className="text-sm text-ink-500">Page {bookPage} of {bookTotalPages}</span>
                            <button disabled={bookPage === bookTotalPages} onClick={() => fetchBooks(bookPage + 1)} className="text-sm text-ink-600 hover:text-ink-900 disabled:opacity-50">Next</button>
                        </div>
                    )}
                </div>
            )}

            {notice && (
                <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <span>{notice}</span>
                    <button type="button" onClick={() => setNotice('')} className="font-medium">Dismiss</button>
                </div>
            )}

            {activeTab === 'REPORT' && isAdmin && <LibraryReport />}

            {activeTab === 'ISSUES' && (
                <div className="space-y-4">
                    <select
                        aria-label="Filter issues by status"
                        value={issueStatus}
                        onChange={(e) => setIssueStatus(e.target.value)}
                        className="block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-60"
                    >
                        <option value="">All statuses</option>
                        <option value="ISSUED">Issued</option>
                        <option value="OVERDUE">Overdue</option>
                        <option value="RETURNED">Returned</option>
                    </select>
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Fine</th>
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {issue.fineAmount > 0 ? (
                                                    <div>
                                                        <span className="font-medium text-ink-900">{rupees(issue.fineAmount)}</span>
                                                        <div className={`text-xs ${issue.fineStatus === 'PENDING' ? 'text-red-600' : 'text-ink-500'}`}>{issue.fineStatus === 'PENDING' ? 'Pending' : issue.fineStatus === 'PAID' ? 'Paid' : issue.fineStatus === 'WAIVED' ? 'Waived' : ''}</div>
                                                    </div>
                                                ) : <span className="text-ink-400">—</span>}
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
                                                    {issue.fineStatus === 'PENDING' && (
                                                        <span className="inline-flex gap-3">
                                                            <button disabled={isSubmitting} onClick={() => handleSettleFine(issue, 'PAID')} className="text-brand-600 hover:text-brand-900 disabled:opacity-50">Fine Paid</button>
                                                            <button disabled={isSubmitting} onClick={() => handleSettleFine(issue, 'WAIVED')} className="text-ink-600 hover:text-ink-900 disabled:opacity-50">Waive</button>
                                                        </span>
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
                            <button disabled={issuePage === 1} onClick={() => fetchIssues(issuePage - 1)} className="text-sm text-ink-600 hover:text-ink-900 disabled:opacity-50">Previous</button>
                            <span className="text-sm text-ink-500">Page {issuePage} of {issueTotalPages}</span>
                            <button disabled={issuePage === issueTotalPages} onClick={() => fetchIssues(issuePage + 1)} className="text-sm text-ink-600 hover:text-ink-900 disabled:opacity-50">Next</button>
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
                                <input type="text" required value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} className="mt-1 w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink-700">Author *</label>
                                    <input type="text" required value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} className="mt-1 w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink-700">ISBN *</label>
                                    <input type="text" required value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} className="mt-1 w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink-700">Publisher</label>
                                    <input type="text" value={bookForm.publisher} onChange={e => setBookForm({ ...bookForm, publisher: e.target.value })} className="mt-1 w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink-700">Category *</label>
                                    <input type="text" required value={bookForm.category} onChange={e => setBookForm({ ...bookForm, category: e.target.value })} className="mt-1 w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink-700">Total Copies (Inventory) *</label>
                                <input type="number" min="0" required value={bookForm.totalCopies} onChange={e => setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value, 10) })} className="mt-1 w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <Button type="button" variant="secondary" onClick={closeBookModal} disabled={isSubmitting}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Book'}
                                </Button>
                            </div>
                        </form>
                    </Modal>

                    {/* Issue Book Modal */}
                    <Modal isOpen={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} title="Issue Book">
                        <form onSubmit={handleIssueSubmit} className="space-y-4 pt-4">
                            {issueError && <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{issueError}</div>}
                            <div>
                                <label htmlFor="issue-book" className="block text-sm font-medium text-ink-700">Book *</label>
                                {issueBook ? (
                                    <div className="mt-1 rounded-md border border-ink-300 bg-ink-50 px-3 py-2 text-sm text-ink-900">
                                        {issueBook.title} <span className="text-ink-500">· {issueBook.author} · {issueBook.availableCopies} available</span>
                                    </div>
                                ) : (
                                    <select id="issue-book" required value={issueForm.bookId} onChange={e => setIssueForm({ ...issueForm, bookId: e.target.value })} className="mt-1 w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                                        <option value="">Select an available book...</option>
                                        {bookOptions.map((b) => (
                                            <option key={b._id} value={b._id}>{b.title} — {b.author} ({b.availableCopies} available)</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label htmlFor="issue-role" className="block text-sm font-medium text-ink-700">Issue To *</label>
                                <select id="issue-role" value={issueForm.requesterModel} onChange={e => { setIssueForm({ ...issueForm, requesterModel: e.target.value, requesterId: '' }); setIssueStudent(null); }} className="mt-1 w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                                    <option value="Student">Student</option>
                                    <option value="Teacher">Teacher</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="issue-requester" className="block text-sm font-medium text-ink-700">{issueForm.requesterModel} *</label>
                                <div className="mt-1">
                                    {issueForm.requesterModel === 'Student' ? (
                                        <StudentPicker
                                            id="issue-requester"
                                            required
                                            value={issueForm.requesterId}
                                            selected={issueStudent}
                                            onChange={(id, student) => { setIssueForm((prev) => ({ ...prev, requesterId: id })); setIssueStudent(student); }}
                                        />
                                    ) : (
                                        <select id="issue-requester" required value={issueForm.requesterId} onChange={e => setIssueForm({ ...issueForm, requesterId: e.target.value })} className="w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                                            <option value="">Select a teacher...</option>
                                            {teacherOptions.map((t) => (
                                                <option key={t._id} value={t._id}>{t.firstName} {t.lastName} ({t.user?.loginId || t.email})</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink-700">Due Date *</label>
                                <input type="date" required min={new Date().toISOString().split('T')[0]} value={issueForm.dueDate} onChange={e => setIssueForm({ ...issueForm, dueDate: e.target.value })} className="mt-1 w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <Button type="button" variant="secondary" onClick={() => setIsIssueModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting || !issueForm.bookId || !issueForm.requesterId}>
                                    {isSubmitting ? 'Processing...' : 'Issue Book'}
                                </Button>
                            </div>
                        </form>
                    </Modal>
                </>
            )}
        </div>
    );
}

export default LibraryPage;
