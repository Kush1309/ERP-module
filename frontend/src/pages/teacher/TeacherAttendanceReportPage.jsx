import { useEffect, useState } from 'react';
import { getTeacherAttendanceReport } from '../../services/attendanceApi';
import Button from '../../components/Button';
import Card from '../../components/Card';

function TeacherAttendanceReportPage() {
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({
        totalStudents: 0,
        studentsWithAttendance: 0,
        totalPresent: 0,
        totalAbsent: 0,
        overallPercentage: 0
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
    const [statusFilter, setStatusFilter] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [pageNumber, setPageNumber] = useState(1);

    const loadReport = async (filters) => {
        setLoading(true);
        setError('');
        try {
            const data = await getTeacherAttendanceReport(filters);
            setReportData(data?.data || []);
            setSummary(data?.summary || {
                totalStudents: 0,
                studentsWithAttendance: 0,
                totalPresent: 0,
                totalAbsent: 0,
                overallPercentage: 0
            });
            setPagination({
                page: data?.pagination?.page || 1,
                limit: data?.pagination?.limit || 10,
                totalPages: data?.pagination?.pages || 1
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load attendance report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const filters = {
            page: pageNumber,
            limit: 10
        };
        if (dateFilter.startDate) filters.startDate = dateFilter.startDate;
        if (dateFilter.endDate) filters.endDate = dateFilter.endDate;
        if (statusFilter) filters.status = statusFilter;
        if (studentSearch) filters.search = studentSearch;

        loadReport(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageNumber]); // Effect fires only when pageNumber explicitly changes.

    const handleApplyFilters = () => {
        setPageNumber(1);
        const filters = {
            page: 1,
            limit: 10
        };
        if (dateFilter.startDate) filters.startDate = dateFilter.startDate;
        if (dateFilter.endDate) filters.endDate = dateFilter.endDate;
        if (statusFilter) filters.status = statusFilter;
        if (studentSearch) filters.search = studentSearch;

        loadReport(filters);
    };

    const handleClearFilters = () => {
        setDateFilter({ startDate: '', endDate: '' });
        setStatusFilter('');
        setStudentSearch('');
        setPageNumber(1);

        loadReport({
            page: 1,
            limit: 10
        });
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
                    <h1 className="font-display text-3xl font-semibold text-ink-900">Attendance Report</h1>
                    <p className="mt-2 text-sm text-ink-600">View aggregate attendance metrics for your assigned class.</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => window.history.back()}>
                    Back to Dashboard
                </Button>
            </div>

            {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                        <Button type="button" variant="secondary" onClick={() => handleApplyFilters()} className="!py-1 !text-xs !bg-white">
                            Retry
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <Card className="p-4 flex flex-col items-center justify-center bg-gray-50 border-gray-100">
                    <p className="text-xs font-medium text-ink-500 uppercase">Total Students</p>
                    <p className="mt-1 text-2xl font-bold text-ink-900">{summary.totalStudents}</p>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center bg-brand-50 border-brand-100">
                    <p className="text-xs font-medium text-brand-700 uppercase">With Records</p>
                    <p className="mt-1 text-2xl font-bold text-brand-900">{summary.studentsWithAttendance}</p>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center bg-emerald-50 border-emerald-100">
                    <p className="text-xs font-medium text-emerald-700 uppercase">Total Present</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-900">{summary.totalPresent}</p>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center bg-red-50 border-red-100">
                    <p className="text-xs font-medium text-red-700 uppercase">Total Absent</p>
                    <p className="mt-1 text-2xl font-bold text-red-900">{summary.totalAbsent}</p>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center bg-blue-50 border-blue-100">
                    <p className="text-xs font-medium text-blue-700 uppercase">Overall %</p>
                    <p className="mt-1 text-2xl font-bold text-blue-900">{summary.overallPercentage}%</p>
                </Card>
            </div>

            <Card className="mb-6 p-4 md:p-6 bg-white border-ink-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-ink-700 mb-1">Start Date</label>
                        <input
                            id="startDate"
                            type="date"
                            value={dateFilter.startDate}
                            onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-ink-700 mb-1">End Date</label>
                        <input
                            id="endDate"
                            type="date"
                            value={dateFilter.endDate}
                            onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-ink-700 mb-1">Status Contains</label>
                        <select
                            id="status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                </div>
                <div className="flex gap-3 justify-end pt-2 border-t border-ink-100">
                    <Button type="button" variant="secondary" onClick={handleClearFilters} disabled={loading}>
                        Clear Filters
                    </Button>
                    <Button type="button" onClick={handleApplyFilters} disabled={loading}>
                        Apply Filters
                    </Button>
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
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Student ID</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Roll No.</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-ink-600">Total</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-ink-600 text-emerald-700 border-l border-ink-200">Present</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-ink-600 text-red-700">Absent</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-600 border-l border-ink-200">Percentage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-200 bg-white">
                            {reportData.length > 0 ? (
                                reportData.map((row) => (
                                    <tr key={row.student._id} className="hover:bg-ink-50/60 transition-colors">
                                        <td className="px-6 py-4 text-sm text-ink-600">
                                            {row.student.studentId || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-ink-900">
                                            {row.student.firstName} {row.student.lastName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-ink-600">
                                            {row.student.rollNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center font-medium text-ink-700">
                                            {row.total}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center text-emerald-700 font-semibold border-l border-ink-100">
                                            {row.present}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center text-red-700 font-semibold">
                                            {row.absent}
                                        </td>
                                        <td className="px-6 py-4 text-right border-l border-ink-100">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${row.percentage >= 75
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : row.percentage > 0
                                                        ? 'bg-orange-50 text-orange-700'
                                                        : 'bg-red-50 text-red-700'
                                                }`}>
                                                {row.percentage}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                !loading && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <p className="text-base font-medium text-ink-900">No students found.</p>
                                            <p className="mt-1 text-sm text-ink-500">Try adjusting your search criteria.</p>
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

export default TeacherAttendanceReportPage;
