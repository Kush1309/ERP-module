import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import {
    getAdminAttendanceRecords,
    getAdminAttendanceById,
    updateAdminAttendance,
    deleteAdminAttendance
} from '../../services/attendanceApi';

const DEFAULT_LIMIT = 10;
const STATUSES = ['PRESENT', 'ABSENT'];

export default function AttendanceManagementPage() {
    const [attendances, setAttendances] = useState([]);

    // Filters
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

    const filterParamsRef = useRef({ ...filters });

    // Modals state
    const [viewRecord, setViewRecord] = useState(null);
    const [editRecord, setEditRecord] = useState(null);
    const [deleteRecord, setDeleteRecord] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [modalError, setModalError] = useState('');

    const loadAttendances = useCallback(
        async (nextPage = 1, currentFilters = {}) => {
            setLoading(true);
            setError('');
            try {
                const queryParams = { page: nextPage, limit: DEFAULT_LIMIT };
                if (currentFilters.startDate) queryParams.startDate = currentFilters.startDate;
                if (currentFilters.endDate) queryParams.endDate = currentFilters.endDate;
                if (currentFilters.status) queryParams.status = currentFilters.status;
                if (currentFilters.class) queryParams.class = currentFilters.class;
                if (currentFilters.section) queryParams.section = currentFilters.section;
                if (currentFilters.search) queryParams.search = currentFilters.search;

                const result = await getAdminAttendanceRecords(queryParams);

                setAttendances(result?.records ?? []);
                setPagination(
                    result?.pagination ?? {
                        page: nextPage, limit: DEFAULT_LIMIT, total: 0, totalPages: 1
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

        if (JSON.stringify(filterParamsRef.current) !== JSON.stringify(newFilterParams)) {
            targetPage = 1;
            if (page !== 1) setPage(1);
            filterParamsRef.current = newFilterParams;
        }

        loadAttendances(targetPage, newFilterParams);
    }, [page, filters, loadAttendances]);

    const totalPages = useMemo(() => Math.max(1, pagination.totalPages || 1), [pagination.totalPages]);
    const handleRetry = () => loadAttendances(page, filters);
    const handlePrevious = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ startDate: '', endDate: '', status: '', class: '', section: '', search: '' });
        setPage(1);
    };

    const hasActiveFilters = Object.values(filters).some(val => val !== '');

    const formatStatus = (status) => {
        if (!status) return 'Unknown';
        return status.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    };

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        return new Date(isoString).toISOString().split('T')[0];
    };

    const handleView = async (id) => {
        try {
            setModalError('');
            const data = await getAdminAttendanceById(id);
            setViewRecord(data);
        } catch (err) {
            alert('Failed to load record details');
        }
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        if (!editRecord) return;
        setIsSaving(true);
        setModalError('');
        try {
            await updateAdminAttendance(editRecord._id, editRecord.status);
            setEditRecord(null);
            loadAttendances(page, filters);
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to update attendance');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteRecord) return;
        setIsDeleting(true);
        setModalError('');
        try {
            await deleteAdminAttendance(deleteRecord._id);
            setDeleteRecord(null);
            if (attendances.length === 1 && page > 1) {
                setPage(page - 1);
            } else {
                loadAttendances(page, filters);
            }
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to delete attendance record');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-6xl relative">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Admin module</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Attendance Management</h1>
                    <p className="mt-2 text-sm text-ink-600">View and manage student attendance records.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="button" variant="secondary" className="min-w-[150px] whitespace-nowrap opacity-50 cursor-not-allowed">
                        + Mark Attendance
                    </Button>
                    <Link to="/admin/attendance/report">
                        <Button type="button" className="w-full sm:w-auto">
                            Attendance Report
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters Section */}
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
                            <option value="">All Status</option>
                            {STATUSES.map((st) => (<option key={st} value={st}>{formatStatus(st)}</option>))}
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
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-ink-200">
                                <thead className="bg-ink-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Student Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Roll No</th>
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
                                                <td className="px-4 py-3 text-sm text-ink-900">{student.firstName} {student.lastName}</td>
                                                <td className="px-4 py-3 text-sm text-ink-700">{student.rollNumber || '-'}</td>
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
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleView(record._id)}
                                                            className="font-medium text-brand-600 hover:text-brand-800"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditRecord(record)}
                                                            className="font-medium text-amber-600 hover:text-amber-800"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteRecord(record)}
                                                            className="font-medium text-red-600 hover:text-red-800"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
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

            <Modal isOpen={!!viewRecord} onClose={() => setViewRecord(null)} title="Attendance Details">
                {viewRecord && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm text-ink-900">
                            <div>
                                <span className="block font-medium text-ink-500">Student Name</span>
                                {viewRecord.student?.firstName} {viewRecord.student?.lastName}
                            </div>
                            <div>
                                <span className="block font-medium text-ink-500">Student ID</span>
                                {viewRecord.student?.studentId || '-'}
                            </div>
                            <div>
                                <span className="block font-medium text-ink-500">Roll Number</span>
                                {viewRecord.student?.rollNumber || '-'}
                            </div>
                            <div>
                                <span className="block font-medium text-ink-500">Class/Section</span>
                                {viewRecord.student?.class}-{viewRecord.student?.section}
                            </div>
                            <div>
                                <span className="block font-medium text-ink-500">Date</span>
                                {formatDate(viewRecord.date)}
                            </div>
                            <div>
                                <span className="block font-medium text-ink-500">Status</span>
                                <span className="font-semibold text-brand-600">{formatStatus(viewRecord.status)}</span>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button type="button" onClick={() => setViewRecord(null)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!editRecord} onClose={() => { if (!isSaving) setEditRecord(null) }} title="Edit Attendance">
                {editRecord && (
                    <form onSubmit={handleEditSave} className="space-y-4">
                        {modalError && <p className="text-sm text-red-600">{modalError}</p>}
                        <div className="grid grid-cols-2 gap-4 text-sm text-ink-900 border-b border-ink-100 pb-4">
                            <div>
                                <span className="block font-medium text-ink-500">Student</span>
                                {editRecord.student?.firstName} {editRecord.student?.lastName}
                            </div>
                            <div>
                                <span className="block font-medium text-ink-500">Date</span>
                                {formatDate(editRecord.date)}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1">Status</label>
                            <select
                                value={editRecord.status}
                                onChange={(e) => setEditRecord({ ...editRecord, status: e.target.value })}
                                disabled={isSaving}
                                className="w-full rounded-md border border-ink-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            >
                                {STATUSES.map(st => <option key={st} value={st}>{formatStatus(st)}</option>)}
                            </select>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button type="button" variant="secondary" onClick={() => setEditRecord(null)} disabled={isSaving}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Saving..." : "Confirm Change"}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal isOpen={!!deleteRecord} onClose={() => { if (!isDeleting) setDeleteRecord(null) }} title="Delete Attendance">
                {deleteRecord && (
                    <div className="space-y-4">
                        {modalError && <p className="text-sm text-red-600">{modalError}</p>}
                        <p className="text-sm text-ink-700">
                            Are you sure you want to delete this attendance record for <span className="font-semibold text-ink-900">{deleteRecord.student?.firstName} {deleteRecord.student?.lastName}</span> on <span className="font-semibold text-ink-900">{formatDate(deleteRecord.date)}</span>?
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button type="button" variant="secondary" onClick={() => setDeleteRecord(null)} disabled={isDeleting}>Cancel</Button>
                            <Button type="button" onClick={handleDelete} disabled={isDeleting} className="!bg-red-600 hover:!bg-red-700 text-white border-0">
                                {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
