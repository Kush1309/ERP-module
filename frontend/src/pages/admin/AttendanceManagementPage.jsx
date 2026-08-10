import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getAttendances } from '../../services/attendanceApi';

const DEFAULT_LIMIT = 10;

function AttendanceManagementPage() {
    const [attendances, setAttendances] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        date: '',
        status: '',
    });

    // Pagination
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 1,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Prevent double fetches on filter change
    const filterParamsRef = useRef({ ...filters });

    const loadAttendances = useCallback(
        async (nextPage = 1, currentFilters = {}) => {
            setLoading(true);
            setError('');
            try {
                const queryParams = { page: nextPage, limit: DEFAULT_LIMIT };
                if (currentFilters.date) queryParams.date = currentFilters.date;
                if (currentFilters.status) queryParams.status = currentFilters.status;

                const result = await getAttendances(queryParams);

                setAttendances(result?.data ?? []);
                setPagination(
                    result?.pagination ?? {
                        page: nextPage, limit: DEFAULT_LIMIT, total: 0, totalPages: 1,
                    }
                );
            } catch {
                setAttendances([]);
                setError('Unable to load attendance records.');
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        const newFilterParams = { ...filters };
        let targetPage = page;

        // Reset pagination to 1 if filters altered
        if (JSON.stringify(filterParamsRef.current) !== JSON.stringify(newFilterParams)) {
            targetPage = 1;
            if (page !== 1) setPage(1);
            filterParamsRef.current = newFilterParams;
        }

        loadAttendances(targetPage, filters);
    }, [page, filters, loadAttendances]);

    const totalPages = useMemo(() => Math.max(1, pagination.pages || 1), [pagination.pages]);
    const handleRetry = () => loadAttendances(page, filters);
    const handlePrevious = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ date: '', status: '' });
        setPage(1);
    };

    const formatStatus = (status) => {
        if (!status) return 'Unknown';
        return status.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    };

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        // Format to YYYY-MM-DD cleanly using local mapping
        return new Date(isoString).toISOString().split('T')[0];
    };

    const STATUSES = ['PRESENT', 'ABSENT'];

    const hasActiveFilters = filters.date || filters.status;

    return (
        <div className="mx-auto w-full max-w-6xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Admin module</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Attendance Management</h1>
                    <p className="mt-2 text-sm text-ink-600">View and manage student attendance records.</p>
                </div>

                {/* Placeholder Button explicitly requested */}
                <Button type="button" variant="secondary" className="min-w-[150px] whitespace-nowrap opacity-50 cursor-not-allowed">
                    + Mark Attendance
                </Button>
            </div>

            {/* Filters Section */}
            <Card className="mb-6 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1">
                        <label htmlFor="date" className="mb-1 block text-sm font-medium text-ink-700">Date</label>
                        <input
                            id="date"
                            name="date"
                            type="date"
                            value={filters.date}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label htmlFor="status" className="mb-1 block text-sm font-medium text-ink-700">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                            <option value="">All Status</option>
                            {STATUSES.map((st) => (<option key={st} value={st}>{formatStatus(st)}</option>))}
                        </select>
                    </div>
                    {hasActiveFilters && (
                        <div className="w-full md:w-auto">
                            <Button type="button" variant="secondary" onClick={clearFilters} className="w-full md:w-auto whitespace-nowrap">
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            <Card className="overflow-hidden">
                {loading ? (
                    <div className="flex min-h-[220px] items-center justify-center">
                        <div className="flex items-center gap-3 text-sm text-ink-600">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                            Loading attendance records...
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
                        <div className="space-y-2">
                            <p className="text-lg font-semibold text-ink-900">{error}</p>
                        </div>
                        <Button type="button" onClick={handleRetry}>Retry</Button>
                    </div>
                ) : attendances.length === 0 ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
                        <p className="text-lg font-semibold text-ink-900">
                            {hasActiveFilters ? "No attendance records found matching your filters." : "No attendance records found."}
                        </p>
                        {hasActiveFilters && (
                            <Button type="button" variant="secondary" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-ink-200">
                                <thead className="bg-ink-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Student ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Student Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Class</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Section</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-200 bg-white">
                                    {attendances.map((record) => {
                                        const student = record.student || {};
                                        return (
                                            <tr key={record._id} className="hover:bg-ink-50/60">
                                                <td className="px-4 py-3 text-sm font-medium text-ink-900">{formatDate(record.date)}</td>
                                                <td className="px-4 py-3 text-sm text-ink-900">{student.studentId || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-ink-900">{student.firstName} {student.lastName}</td>
                                                <td className="px-4 py-3 text-sm text-ink-700">{student.class || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-ink-700">{student.section || '-'}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium 
                            ${record.status === 'PRESENT'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                            : 'border-red-200 bg-red-50 text-red-700'}`}>
                                                        {formatStatus(record.status)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {/* Module 4B requirement: visually inactive view button without real route implementation */}
                                                    <button type="button" disabled className="font-medium text-ink-400 cursor-not-allowed">
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-ink-200 bg-ink-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-ink-600">
                                Page {pagination.page || 1} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="secondary" onClick={handlePrevious} disabled={page <= 1 || loading} className="!px-3 !py-2">Previous</Button>
                                <Button type="button" onClick={handleNext} disabled={page >= totalPages || loading} className="!px-3 !py-2">Next</Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}

export default AttendanceManagementPage;
