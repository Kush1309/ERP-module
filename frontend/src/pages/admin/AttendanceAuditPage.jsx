import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getAttendanceAuditLogs } from '../../services/attendanceApi';

const DEFAULT_LIMIT = 10;

const AttendanceAuditPage = () => {
    const [logs, setLogs] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        action: '',
        status: '',
        search: ''
    });

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 1
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const filterParamsRef = useRef({ ...filters });

    const loadAuditLogs = useCallback(
        async (nextPage = 1, currentFilters = {}) => {
            setLoading(true);
            setError('');
            try {
                const queryParams = { page: nextPage, limit: DEFAULT_LIMIT };
                if (currentFilters.startDate) queryParams.startDate = currentFilters.startDate;
                if (currentFilters.endDate) queryParams.endDate = currentFilters.endDate;
                if (currentFilters.action) queryParams.action = currentFilters.action;
                if (currentFilters.status) queryParams.status = currentFilters.status;
                if (currentFilters.search) queryParams.search = currentFilters.search;

                const result = await getAttendanceAuditLogs(queryParams);

                setLogs(result?.data ?? []);
                setPagination(
                    result?.pagination ?? {
                        page: nextPage, limit: DEFAULT_LIMIT, total: 0, totalPages: 1
                    }
                );
            } catch {
                setLogs([]);
                setError('Unable to load attendance audit logs.');
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        const newFilterParams = { ...filters };
        let targetPage = page;

        if (JSON.stringify(filterParamsRef.current) !== JSON.stringify(newFilterParams)) {
            targetPage = 1;
            if (page !== 1) setPage(1);
            filterParamsRef.current = newFilterParams;
        }

        loadAuditLogs(targetPage, newFilterParams);
    }, [page, filters, loadAuditLogs]);

    const totalPages = useMemo(() => Math.max(1, pagination.totalPages || 1), [pagination.totalPages]);
    const handleRetry = () => loadAuditLogs(page, filters);
    const handlePrevious = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ startDate: '', endDate: '', action: '', status: '', search: '' });
        setPage(1);
    };

    const hasActiveFilters = Object.values(filters).some(val => val !== '');

    const formatAction = (action) => {
        if (!action) return 'Unknown';
        switch (action) {
            case 'CREATED': return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-medium">CREATED</span>;
            case 'UPDATED': return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-medium">UPDATED</span>;
            case 'DELETED': return <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full text-xs font-medium">DELETED</span>;
            default: return <span className="bg-ink-100 text-ink-700 px-2.5 py-0.5 rounded-full text-xs font-medium">{action}</span>;
        }
    };

    const formatStatusValue = (status) => {
        if (!status) return <span className="text-ink-400 italic">None</span>;
        if (status === 'PRESENT') return <span className="text-emerald-600 font-medium">PRESENT</span>;
        if (status === 'ABSENT') return <span className="text-red-600 font-medium">ABSENT</span>;
        return status;
    };

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="mx-auto w-full max-w-6xl relative">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Admin module</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Attendance Audit Trail</h1>
                    <p className="mt-2 text-sm text-ink-600">Read-only view of all attendance modifications.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/admin/attendance">
                        <Button type="button" variant="secondary" className="w-full sm:w-auto">
                            Back to Management
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="mb-6 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-7 items-end">
                    <div className="col-span-1 lg:col-span-2 xl:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-ink-700">Search</label>
                        <input
                            type="text"
                            name="search"
                            placeholder="Student Name, ID, User..."
                            value={filters.search}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Action</label>
                        <select
                            name="action"
                            value={filters.action}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                            <option value="">All Actions</option>
                            <option value="CREATED">Created</option>
                            <option value="UPDATED">Updated</option>
                            <option value="DELETED">Deleted</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Status</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                            <option value="">Any Status</option>
                            <option value="PRESENT">Present</option>
                            <option value="ABSENT">Absent</option>
                        </select>
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

                    <div className="flex gap-2 col-span-1 lg:col-span-6 xl:col-span-1 xl:justify-end">
                        {hasActiveFilters && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={clearFilters}
                                className="w-full xl:w-auto"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden">
                {loading && logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
                        <p className="mt-4 text-sm text-ink-500">Loading audit trail...</p>
                    </div>
                ) : error ? (
                    <div className="px-6 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                            <span className="text-red-600 font-bold">!</span>
                        </div>
                        <h3 className="text-lg font-medium text-ink-900 mb-2">Error Loading Data</h3>
                        <p className="text-ink-600 mb-6 max-w-md mx-auto">{error}</p>
                        <Button type="button" onClick={handleRetry} variant="secondary">
                            Try Again
                        </Button>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <h3 className="text-lg font-medium text-ink-900 mb-1">No audit logs found</h3>
                        <p className="text-ink-600">
                            {hasActiveFilters
                                ? 'No logs match the current filters. Try adjusting your search criteria.'
                                : 'No attendance modifications have been recorded yet.'}
                        </p>
                        {hasActiveFilters && (
                            <Button type="button" onClick={clearFilters} variant="secondary" className="mt-6">
                                Clear Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-ink-600">
                                <thead className="bg-ink-50 text-xs uppercase text-ink-700">
                                    <tr>
                                        <th className="whitespace-nowrap px-6 py-3 font-medium">Date/Time</th>
                                        <th className="whitespace-nowrap px-6 py-3 font-medium">Action</th>
                                        <th className="whitespace-nowrap px-6 py-3 font-medium">Student</th>
                                        <th className="whitespace-nowrap px-6 py-3 font-medium">Previous</th>
                                        <th className="whitespace-nowrap px-6 py-3 font-medium">New</th>
                                        <th className="whitespace-nowrap px-6 py-3 font-medium">Performed By</th>
                                        <th className="whitespace-nowrap px-6 py-3 font-medium">Role</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-200 bg-white">
                                    {logs.map((log, index) => (
                                        <tr key={index} className="hover:bg-ink-50 transition-colors">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {formatDate(log.createdAt)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {formatAction(log.action)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {log.student ? (
                                                    <div>
                                                        <div className="font-medium text-ink-900">
                                                            {log.student.firstName} {log.student.lastName}
                                                        </div>
                                                        <div className="text-xs text-ink-500">
                                                            ID: {log.student.studentId} • Roll: {log.student.rollNumber}
                                                        </div>
                                                        <div className="text-xs text-ink-500">
                                                            Class {log.student.class} - {log.student.section}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-ink-400 italic">Unknown</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {formatStatusValue(log.previousStatus)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {formatStatusValue(log.newStatus)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="font-medium text-ink-900">
                                                    {log.performedBy ? log.performedBy.loginId : <span className="text-ink-400 italic">Unknown</span>}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {log.performedBy && log.performedBy.role && (
                                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-ink-100 text-ink-700">
                                                        {log.performedBy.role}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination footer */}
                        <div className="flex items-center justify-between border-t border-ink-200 bg-white px-6 py-3">
                            <p className="text-sm text-ink-700">
                                Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                                <span className="font-medium">{totalPages}</span>
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handlePrevious}
                                    disabled={pagination.page <= 1}
                                    className="px-3 py-1 text-sm disabled:opacity-50"
                                >
                                    Previous
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleNext}
                                    disabled={pagination.page >= totalPages}
                                    className="px-3 py-1 text-sm disabled:opacity-50"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default AttendanceAuditPage;
