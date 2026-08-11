import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getAdminAttendanceReport } from '../../services/attendanceApi';

const DEFAULT_LIMIT = 10;
const STATUSES = ['PRESENT', 'ABSENT'];

export default function AttendanceReportPage() {
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({
        totalStudents: 0,
        totalRecords: 0,
        present: 0,
        absent: 0,
        percentage: 0
    });

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: '',
        class: '',
        section: '',
        search: ''
    });

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 1
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const filterRef = useRef(filters);

    const loadReport = useCallback(
        async (targetPage = 1, currentFilters = {}) => {
            setLoading(true);
            setError('');
            try {
                const queryParams = { page: targetPage, limit: DEFAULT_LIMIT };

                if (currentFilters.startDate) queryParams.startDate = currentFilters.startDate;
                if (currentFilters.endDate) queryParams.endDate = currentFilters.endDate;
                if (currentFilters.status) queryParams.status = currentFilters.status;
                if (currentFilters.class) queryParams.class = currentFilters.class;
                if (currentFilters.section) queryParams.section = currentFilters.section;
                if (currentFilters.search) queryParams.search = currentFilters.search;

                const result = await getAdminAttendanceReport(queryParams);

                setReportData(result?.data || []);
                if (result?.summary) {
                    setSummary(result.summary);
                }
                if (result?.pagination) {
                    setPagination(result.pagination);
                }
            } catch (err) {
                setReportData([]);
                setError(err.response?.data?.message || 'Unable to load attendance report.');
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        let currentTargetPage = page;
        if (JSON.stringify(filterRef.current) !== JSON.stringify(filters)) {
            currentTargetPage = 1;
            if (page !== 1) setPage(1);
            filterRef.current = filters;
        }
        loadReport(currentTargetPage, filters);
    }, [page, filters, loadReport]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ startDate: '', endDate: '', status: '', class: '', section: '', search: '' });
        setPage(1);
    };

    const handleRetry = () => loadReport(page, filters);
    const totalPages = Math.max(1, pagination.totalPages || 1);
    const handlePrevious = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

    const hasActiveFilters =
        filters.startDate || filters.endDate || filters.status ||
        filters.class || filters.section || filters.search;

    return (
        <div className="mx-auto w-full max-w-6xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Admin module</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Attendance Report</h1>
                    <p className="mt-2 text-sm text-ink-600">View organization-wide attendance analytics.</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
                <Card className="p-4 sm:p-5 flex flex-col justify-center">
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-500">Total Students</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-ink-900">
                        {loading ? '-' : summary.totalStudents}
                    </p>
                </Card>
                <Card className="p-4 sm:p-5 flex flex-col justify-center">
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-500">Total Records</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-ink-900">
                        {loading ? '-' : summary.totalRecords}
                    </p>
                </Card>
                <Card className="p-4 sm:p-5 flex flex-col justify-center">
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-500">Present</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-emerald-600">
                        {loading ? '-' : summary.present}
                    </p>
                </Card>
                <Card className="p-4 sm:p-5 flex flex-col justify-center">
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-500">Absent</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-red-600">
                        {loading ? '-' : summary.absent}
                    </p>
                </Card>
                <Card className="p-4 sm:p-5 flex flex-col justify-center col-span-2 lg:col-span-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-500">Percentage</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-brand-600">
                        {loading ? '-' : `${summary.percentage}%`}
                    </p>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-7 items-end">
                    <div className="col-span-1 lg:col-span-2 xl:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-ink-700">Search Student</label>
                        <input
                            type="text"
                            name="search"
                            placeholder="Name, ID, Roll..."
                            value={filters.search}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Class</label>
                        <input
                            type="text"
                            name="class"
                            placeholder="e.g. 10"
                            value={filters.class}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Section</label>
                        <input
                            type="text"
                            name="section"
                            placeholder="e.g. A"
                            value={filters.section}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Status</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                            <option value="">All</option>
                            {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                    </div>
                </div>
                {hasActiveFilters && (
                    <div className="mt-4 flex justify-end">
                        <Button type="button" variant="secondary" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </div>
                )}
            </Card>

            <Card className="overflow-hidden">
                {loading ? (
                    <div className="flex min-h-[300px] items-center justify-center">
                        <div className="flex items-center gap-3 text-sm text-ink-600">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                            Loading attendance report...
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
                        <div className="space-y-2">
                            <p className="text-lg font-semibold text-ink-900">{error}</p>
                        </div>
                        <Button type="button" onClick={handleRetry}>Retry</Button>
                    </div>
                ) : reportData.length === 0 ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
                        <p className="text-lg font-semibold text-ink-900">
                            No students found for the selected filters.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-ink-200">
                                <thead className="bg-ink-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Student ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Student Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Roll No</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Class/Sec</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Records</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Present</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Absent</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-200 bg-white">
                                    {reportData.map((row, idx) => (
                                        <tr key={row.studentId || idx} className="hover:bg-ink-50/60">
                                            <td className="px-4 py-3 text-sm text-ink-900">{row.studentId || '-'}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-ink-900">{row.name}</td>
                                            <td className="px-4 py-3 text-sm text-ink-500">{row.rollNumber || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-ink-700">
                                                {row.class ? `${row.class}-${row.section}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-ink-700">{row.total}</td>
                                            <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{row.present}</td>
                                            <td className="px-4 py-3 text-sm text-red-600 font-medium">{row.absent}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium 
                                                    ${row.percentage >= 75 ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        : row.percentage >= 60 ? 'border-amber-200 bg-amber-50 text-amber-700'
                                                            : 'border-red-200 bg-red-50 text-red-700'}`}>
                                                    {row.percentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
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
