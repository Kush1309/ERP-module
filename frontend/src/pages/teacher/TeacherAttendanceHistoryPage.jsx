import { useEffect, useState, useCallback, useRef } from 'react';
import { getTeacherHistory } from '../../services/attendanceApi';
import Button from '../../components/Button';
import Card from '../../components/Card';

function TeacherAttendanceHistoryPage() {
    const [attendances, setAttendances] = useState([]);
    const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [pageNumber, setPageNumber] = useState(1);

    const debounceRef = useRef(null);

    const loadHistory = useCallback(async (filters) => {
        setLoading(true);
        setError('');
        try {
            const data = await getTeacherHistory(filters);
            setAttendances(data?.data || []);
            setSummary(data?.summary || { total: 0, present: 0, absent: 0, percentage: 0 });
            setPagination({
                page: data?.pagination?.page || 1,
                limit: data?.pagination?.limit || 10,
                totalPages: data?.pagination?.pages || 1
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load attendance history. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect for non-debounced items (date, status, page)
    useEffect(() => {
        const filters = {
            page: pageNumber,
            limit: 10
        };
        if (dateFilter) filters.date = dateFilter;
        if (statusFilter) filters.status = statusFilter;
        if (studentSearch) filters.student = studentSearch;

        loadHistory(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateFilter, statusFilter, pageNumber]);

    // Effect for debounced student search changes
    const handleStudentSearchChange = (e) => {
        const val = e.target.value;
        setStudentSearch(val);
        setPageNumber(1); // Reset to page 1 on search change

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            const filters = {
                page: 1,
                limit: 10,
                student: val
            };
            if (dateFilter) filters.date = dateFilter;
            if (statusFilter) filters.status = statusFilter;
            loadHistory(filters);
        }, 500);
    };

    const handleDateChange = (e) => {
        setDateFilter(e.target.value);
        setPageNumber(1);
    };

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
        setPageNumber(1);
    };

    const handleNextPage = () => {
        if (pageNumber < pagination.totalPages) {
            setPageNumber(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (pageNumber > 1) {
            setPageNumber(prev => prev - 1);
        }
    };

    return (
        <div className="mx-auto w-full max-w-6xl pb-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-ink-900">Attendance History</h1>
                    <p className="mt-2 text-sm text-ink-600">View past attendance records for your assigned class.</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => window.history.back()}>
                    Back to Dashboard
                </Button>
            </div>

            {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                        <Button type="button" variant="secondary" onClick={() => loadHistory({ page: pageNumber, limit: 10, date: dateFilter, status: statusFilter, student: studentSearch })} className="!py-1 !text-xs !bg-white">
                            Retry
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card className="p-5 flex flex-col items-center justify-center bg-brand-50 border-brand-100">
                    <p className="text-sm font-medium text-ink-500">Total Students</p>
                    <p className="mt-1 text-3xl font-bold text-ink-900">{summary.total}</p>
                </Card>
                <Card className="p-5 flex flex-col items-center justify-center bg-emerald-50 border-emerald-100">
                    <p className="text-sm font-medium text-emerald-700">Present</p>
                    <p className="mt-1 text-3xl font-bold text-emerald-900">{summary.present}</p>
                </Card>
                <Card className="p-5 flex flex-col items-center justify-center bg-red-50 border-red-100">
                    <p className="text-sm font-medium text-red-700">Absent</p>
                    <p className="mt-1 text-3xl font-bold text-red-900">{summary.absent}</p>
                </Card>
                <Card className="p-5 flex flex-col items-center justify-center bg-blue-50 border-blue-100">
                    <p className="text-sm font-medium text-blue-700">Attendance</p>
                    <p className="mt-1 text-3xl font-bold text-blue-900">{summary.percentage}%</p>
                </Card>
            </div>

            <Card className="mb-6 p-4 md:p-6 bg-white border-ink-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-ink-700 mb-1">Date</label>
                        <input
                            id="date"
                            type="date"
                            value={dateFilter}
                            onChange={handleDateChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-ink-700 mb-1">Status</label>
                        <select
                            id="status"
                            value={statusFilter}
                            onChange={handleStatusChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            disabled={loading}
                        >
                            <option value="">All Statuses</option>
                            <option value="PRESENT">Present</option>
                            <option value="ABSENT">Absent</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="student" className="block text-sm font-medium text-ink-700 mb-1">Search Student</label>
                        <input
                            id="student"
                            type="text"
                            placeholder="Name, Roll No, or ID"
                            value={studentSearch}
                            onChange={handleStudentSearchChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto relative min-h-[300px]">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                            <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
                        </div>
                    )}

                    <table className="min-w-full divide-y divide-ink-200">
                        <thead className="bg-ink-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Student ID</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Roll No.</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-200 bg-white">
                            {attendances.length > 0 ? (
                                attendances.map((record) => (
                                    <tr key={record._id} className="hover:bg-ink-50/60 transition-colors">
                                        <td className="px-6 py-4 text-sm text-ink-900 font-medium">
                                            {new Date(record.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-ink-600">
                                            {record.student?.studentId || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-ink-900">
                                            {record.student?.firstName} {record.student?.lastName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-ink-600">
                                            {record.student?.rollNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${record.status === 'PRESENT'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                {record.status === 'PRESENT' ? 'Present' : 'Absent'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                !loading && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <p className="text-base font-medium text-ink-900">No attendance records found.</p>
                                            <p className="mt-1 text-sm text-ink-500">Try adjusting your filters.</p>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-ink-200 bg-ink-50 px-6 py-3">
                        <p className="text-sm text-ink-600">
                            Page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                className="!py-1.5 !px-3 !text-xs"
                                onClick={handlePrevPage}
                                disabled={pagination.page <= 1 || loading}
                            >
                                Previous
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                className="!py-1.5 !px-3 !text-xs"
                                onClick={handleNextPage}
                                disabled={pagination.page >= pagination.totalPages || loading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default TeacherAttendanceHistoryPage;
