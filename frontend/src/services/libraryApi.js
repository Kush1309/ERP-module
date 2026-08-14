import apiClient from './api';

// -------------------------------------------------------------
// BOOK APIS
// -------------------------------------------------------------

export const getBooks = async (params = {}) => {
    // Whitelist and safely cast query parameters protecting against arbitrary query object manipulations
    const query = {};
    if (params.page) query.page = params.page;
    if (params.limit) query.limit = params.limit;
    if (params.search) query.search = params.search;
    if (params.title) query.title = params.title;
    if (params.author) query.author = params.author;
    if (params.isbn) query.isbn = params.isbn;
    if (params.category) query.category = params.category;

    const response = await apiClient.get('/library/books', { params: query });
    return response.data;
};

export const getBookById = async (id) => {
    if (!id) throw new Error('Book ID is missing');
    const response = await apiClient.get(`/library/books/${id}`);
    return response.data;
};

export const createBook = async (data) => {
    // Whitelist exclusively required properties blocking excess payloads
    const safeData = {
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        publisher: data.publisher,
        category: data.category,
        totalCopies: Number(data.totalCopies)
    };

    if (data.availableCopies !== undefined) {
        safeData.availableCopies = Number(data.availableCopies);
    }

    const response = await apiClient.post('/library/books', safeData);
    return response.data;
};

export const updateBook = async (id, data) => {
    if (!id) throw new Error('Book ID is missing');

    const safeData = {};
    const updatable = ['title', 'author', 'isbn', 'publisher', 'category', 'totalCopies'];

    updatable.forEach(field => {
        if (data[field] !== undefined) {
            safeData[field] = data[field];
        }
    });

    const response = await apiClient.put(`/library/books/${id}`, safeData);
    return response.data;
};

export const deleteBook = async (id) => {
    if (!id) throw new Error('Book ID is missing');
    const response = await apiClient.delete(`/library/books/${id}`);
    return response.data;
};


// -------------------------------------------------------------
// ISSUE APIS
// -------------------------------------------------------------

export const getIssues = async (params = {}) => {
    const query = {};
    if (params.page) query.page = params.page;
    if (params.limit) query.limit = params.limit;
    if (params.status) query.status = params.status;
    if (params.requesterModel) query.requesterModel = params.requesterModel;
    if (params.bookId) query.bookId = params.bookId;
    if (params.startDate) query.startDate = params.startDate;
    if (params.endDate) query.endDate = params.endDate;

    const response = await apiClient.get('/library/issues', { params: query });
    return response.data;
};

export const createIssue = async (data) => {
    const safeData = {
        bookId: data.bookId,
        requesterId: data.requesterId,
        requesterModel: data.requesterModel,
        dueDate: data.dueDate
    };

    const response = await apiClient.post('/library/issues', safeData);
    return response.data;
};

export const returnBook = async (id) => {
    if (!id) throw new Error('Issue ID is missing');

    const response = await apiClient.patch(`/library/issues/${id}/return`);
    // Pass strictly NO client-side status values bridging full isolation
    return response.data;
};
