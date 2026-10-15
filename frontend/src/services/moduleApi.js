// API clients for the configuration, HR, admissions, facility and reporting modules
import apiClient from './api';

const data = (response) => response.data?.data;

export const settingsApi = {
    get: async () => data(await apiClient.get('/settings')),
    update: async (body) => data(await apiClient.put('/settings', body)),
};

export const academicApi = {
    listYears: async () => data(await apiClient.get('/academic-years')) || [],
    createYear: async (body) => data(await apiClient.post('/academic-years', body)),
    updateYear: async (id, body) => data(await apiClient.put(`/academic-years/${id}`, body)),
    setCurrentYear: async (id) => data(await apiClient.patch(`/academic-years/${id}/current`)),
    deleteYear: async (id) => data(await apiClient.delete(`/academic-years/${id}`)),
    listClassSections: async (params = {}) => data(await apiClient.get('/class-sections', { params })) || [],
    createClassSection: async (body) => data(await apiClient.post('/class-sections', body)),
    updateClassSection: async (id, body) => data(await apiClient.put(`/class-sections/${id}`, body)),
    deleteClassSection: async (id) => data(await apiClient.delete(`/class-sections/${id}`)),
    importClassSections: async () => data(await apiClient.post('/class-sections/import')),
    promoteStudents: async (body) => (await apiClient.post('/students/promote', body)).data,
    setStudentStatus: async (id, status) => data(await apiClient.patch(`/students/${id}/status`, { status })),
};

export const auditApi = {
    list: async (params = {}) => data(await apiClient.get('/audit-logs', { params })),
};

export const staffApi = {
    list: async (params = {}) => data(await apiClient.get('/staff', { params })),
    create: async (body) => data(await apiClient.post('/staff', body)),
    update: async (id, body) => data(await apiClient.put(`/staff/${id}`, body)),
    setActive: async (id, active) => data(await apiClient.patch(`/staff/${id}/${active ? 'activate' : 'deactivate'}`)),
};

export const staffAttendanceApi = {
    roster: async (date) => data(await apiClient.get('/staff-attendance/roster', { params: { date } })),
    save: async (body) => data(await apiClient.post('/staff-attendance', body)),
    summary: async (month) => data(await apiClient.get('/staff-attendance/summary', { params: { month } })),
    mine: async (month) => data(await apiClient.get('/staff-attendance/me', { params: { month } })),
};

export const notificationApi = {
    list: async (params = {}) => data(await apiClient.get('/notifications', { params })),
    markRead: async (id) => data(await apiClient.patch(`/notifications/${id}/read`)),
    markAllRead: async () => data(await apiClient.patch('/notifications/read-all')),
};

export const admissionsApi = {
    listEnquiries: async (params = {}) => data(await apiClient.get('/admissions/enquiries', { params })),
    createEnquiry: async (body) => data(await apiClient.post('/admissions/enquiries', body)),
    updateEnquiry: async (id, body) => data(await apiClient.put(`/admissions/enquiries/${id}`, body)),
    addFollowUp: async (id, body) => data(await apiClient.post(`/admissions/enquiries/${id}/follow-ups`, body)),
    deleteEnquiry: async (id) => data(await apiClient.delete(`/admissions/enquiries/${id}`)),
    listApplications: async (params = {}) => data(await apiClient.get('/admissions/applications', { params })),
    createApplication: async (body) => data(await apiClient.post('/admissions/applications', body)),
    updateApplication: async (id, body) => data(await apiClient.put(`/admissions/applications/${id}`, body)),
    verifyDocument: async (id, docId, verified) => data(await apiClient.patch(`/admissions/applications/${id}/documents/${docId}`, { verified })),
    changeStatus: async (id, status, note) => data(await apiClient.patch(`/admissions/applications/${id}/status`, { status, note })),
    enroll: async (id, body) => data(await apiClient.post(`/admissions/applications/${id}/enroll`, body)),
};

export const hostelApi = {
    listRooms: async (params = {}) => data(await apiClient.get('/hostel/rooms', { params })) || [],
    createRoom: async (body) => data(await apiClient.post('/hostel/rooms', body)),
    updateRoom: async (id, body) => data(await apiClient.put(`/hostel/rooms/${id}`, body)),
    deleteRoom: async (id) => data(await apiClient.delete(`/hostel/rooms/${id}`)),
    listAllocations: async (params = {}) => data(await apiClient.get('/hostel/allocations', { params })) || [],
    allocate: async (body) => data(await apiClient.post('/hostel/allocations', body)),
    vacate: async (id) => data(await apiClient.patch(`/hostel/allocations/${id}/vacate`)),
    report: async () => data(await apiClient.get('/hostel/report')),
    mine: async () => data(await apiClient.get('/hostel/my')) || [],
};

export const inventoryApi = {
    listItems: async (params = {}) => data(await apiClient.get('/inventory/items', { params })),
    createItem: async (body) => data(await apiClient.post('/inventory/items', body)),
    updateItem: async (id, body) => data(await apiClient.put(`/inventory/items/${id}`, body)),
    deleteItem: async (id) => data(await apiClient.delete(`/inventory/items/${id}`)),
    recordTransaction: async (id, body) => data(await apiClient.post(`/inventory/items/${id}/transactions`, body)),
    listTransactions: async (params = {}) => data(await apiClient.get('/inventory/transactions', { params })),
};

export const reportsApi = {
    overview: async (params = {}) => data(await apiClient.get('/reports/overview', { params })),
    examAnalytics: async (examId, params = {}) => data(await apiClient.get(`/exam-analytics/${examId}`, { params })),
    reportCard: async (examId, studentId) => data(await apiClient.get(`/report-cards/${examId}/${studentId}`)),
};

export const eventsApi = {
    list: async (params = {}) => data(await apiClient.get('/events', { params })),
    create: async (body) => data(await apiClient.post('/events', body)),
    update: async (id, body) => data(await apiClient.put(`/events/${id}`, body)),
    remove: async (id) => data(await apiClient.delete(`/events/${id}`)),
};

export const homeworkSubmissionApi = {
    submit: async (homeworkId, body) => data(await apiClient.post(`/homework/${homeworkId}/submissions`, body)),
    mine: async (homeworkId, studentId) => data(await apiClient.get(`/homework/${homeworkId}/my-submission`, { params: studentId ? { student: studentId } : {} })),
    list: async (homeworkId) => data(await apiClient.get(`/homework/${homeworkId}/submissions`)),
    grade: async (submissionId, body) => data(await apiClient.patch(`/homework/submissions/${submissionId}/grade`, body)),
};

export const financeApi = {
    summary: async () => data(await apiClient.get('/fees/summary')),
    applyDiscount: async (id, body) => data(await apiClient.patch(`/fees/records/${id}/discount`, body)),
    receipt: async (id, receiptNumber) => data(await apiClient.get(`/fees/records/${id}/receipts/${receiptNumber}`)),
};

export const libraryExtraApi = {
    report: async () => (await apiClient.get('/library/report')).data?.data,
    settleFine: async (id, action) => (await apiClient.patch(`/library/issues/${id}/fine`, { action })).data?.data,
};
