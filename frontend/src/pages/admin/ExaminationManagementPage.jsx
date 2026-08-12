import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import {
    getExams,
    createExam,
    updateExam,
    deleteExam
} from '../../services/examApi';

const DEFAULT_LIMIT = 10;
const EXAM_TYPES = ['MID_TERM', 'FINAL', 'UNIT_TEST', 'QUARTERLY', 'OTHER'];
const STATUSES = ['UPCOMING', 'ACTIVE', 'COMPLETED', 'PUBLISHED'];

export default function ExaminationManagementPage() {
    const [exams, setExams] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        academicSession: '',
        class: '',
        section: '',
        status: '',
        search: ''
    });

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1, limit: DEFAULT_LIMIT, total: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const filterParamsRef = useRef({ ...filters });

    // Modals state
    const [createModal, setCreateModal] = useState(false);
    const [editRecord, setEditRecord] = useState(null);
    const [deleteRecord, setDeleteRecord] = useState(null);

    // Form States
    const [formData, setFormData] = useState({
        name: '', type: 'MID_TERM', academicSession: '', class: '', section: '', startDate: '', endDate: '', status: 'UPCOMING'
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [modalError, setModalError] = useState('');

    const loadExams = useCallback(
        async (nextPage = 1, currentFilters = {}) => {
            setLoading(true);
            setError('');
            try {
                const queryParams = { page: nextPage, limit: DEFAULT_LIMIT, ...currentFilters };

                // Clear empty filters
                Object.keys(queryParams).forEach(key => {
                    if (queryParams[key] === '') delete queryParams[key];
                });

                const result = await getExams(queryParams);

                setExams(result?.exams ?? []);
                setPagination({
                    page: result?.page ?? nextPage,
                    limit: result?.limit ?? DEFAULT_LIMIT,
                    total: result?.total ?? 0
                });
            } catch {
                setExams([]);
                setError('Unable to load examinations.');
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

        loadExams(targetPage, newFilterParams);
    }, [page, filters, loadExams]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(pagination.total / pagination.limit)), [pagination.total, pagination.limit]);
    const handleRetry = () => loadExams(page, filters);
    const handlePrevious = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ academicSession: '', class: '', section: '', status: '', search: '' });
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

    const openCreateModal = () => {
        setFormData({ name: '', type: 'MID_TERM', academicSession: '', class: '', section: '', startDate: '', endDate: '', status: 'UPCOMING' });
        setModalError('');
        setCreateModal(true);
    };

    const openEditModal = (record) => {
        setFormData({
            name: record.name,
            type: record.type,
            academicSession: record.academicSession,
            class: record.class,
            section: record.section || '',
            startDate: formatDate(record.startDate),
            endDate: formatDate(record.endDate),
            status: record.status
        });
        setModalError('');
        setEditRecord(record);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setModalError('');
        try {
            await createExam(formData);
            setCreateModal(false);
            loadExams(page, filters);
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to create examination');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        if (!editRecord) return;
        setIsSaving(true);
        setModalError('');
        try {
            await updateExam(editRecord._id, formData);
            setEditRecord(null);
            loadExams(page, filters);
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to update examination');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteRecord) return;
        setIsDeleting(true);
        setModalError('');
        try {
            await deleteExam(deleteRecord._id);
            setDeleteRecord(null);
            if (exams.length === 1 && page > 1) {
                setPage(page - 1);
            } else {
                loadExams(page, filters);
            }
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to delete examination');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-6xl relative">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Admin module</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Examination Management</h1>
                    <p className="mt-2 text-sm text-ink-600">Create and manage academic examinations.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/admin/subjects">
                        <Button type="button" variant="secondary" className="w-full sm:w-auto text-brand-600 bg-brand-50 border border-brand-200 hover:bg-brand-100">
                            Subject Directory
                        </Button>
                    </Link>
                    <Button type="button" onClick={openCreateModal} className="w-full sm:w-auto">
                        + New Examination
                    </Button>
                </div>
            </div>

            {/* Filters Section */}
            <Card className="mb-6 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
                    <div className="col-span-1 lg:col-span-1">
                        <label className="mb-1 block text-sm font-medium text-ink-700">Search</label>
                        <input
                            type="text"
                            name="search"
                            placeholder="Exam name..."
                            value={filters.search}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Session</label>
                        <input
                            type="text"
                            name="academicSession"
                            placeholder="e.g. 2026-2027"
                            value={filters.academicSession}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Status</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                            <option value="">All Statuses</option>
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
                            Loading examinations...
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
                        <p className="text-lg font-semibold text-ink-900">{error}</p>
                        <Button type="button" onClick={handleRetry}>Retry</Button>
                    </div>
                ) : exams.length === 0 ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
                        <p className="text-lg font-semibold text-ink-900">
                            {hasActiveFilters ? "No examinations found matching your filters." : "No examinations found."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-ink-200">
                                <thead className="bg-ink-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Exam Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Class</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Session</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Dates</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-200 bg-white">
                                    {exams.map((exam) => (
                                        <tr key={exam._id} className="hover:bg-ink-50/60">
                                            <td className="px-4 py-3 text-sm font-medium text-ink-900">{exam.name}</td>
                                            <td className="px-4 py-3 text-sm text-ink-700">{formatStatus(exam.type)}</td>
                                            <td className="px-4 py-3 text-sm text-ink-700">
                                                {exam.class}{exam.section ? `-${exam.section}` : ''}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-ink-700">{exam.academicSession}</td>
                                            <td className="px-4 py-3 text-sm text-ink-700">
                                                {formatDate(exam.startDate)} to {formatDate(exam.endDate)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium 
                                                    ${exam.status === 'PUBLISHED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                                        exam.status === 'COMPLETED' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                                            exam.status === 'ACTIVE' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                                                'border-ink-200 bg-ink-50 text-ink-700'}`}>
                                                    {formatStatus(exam.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link to={`/admin/examinations/${exam._id}`} className="font-medium text-brand-600 hover:text-brand-800">
                                                        Details
                                                    </Link>
                                                    <button type="button" onClick={() => openEditModal(exam)} className="font-medium text-amber-600 hover:text-amber-800">
                                                        Edit
                                                    </button>
                                                    <button type="button" onClick={() => setDeleteRecord(exam)} className="font-medium text-red-600 hover:text-red-800">
                                                        Delete
                                                    </button>
                                                </div>
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

            {/* Create/Edit Modal Form Components are combined below for simplicity */}
            {(createModal || !!editRecord) && (
                <Modal isOpen={true} onClose={() => { if (!isSaving) { setCreateModal(false); setEditRecord(null); } }} title={createModal ? "Create Examination" : "Edit Examination"}>
                    <form onSubmit={createModal ? handleCreateSave : handleEditSave} className="space-y-4">
                        {modalError && <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{modalError}</div>}

                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1">Exam Name *</label>
                            <input required type="text" name="name" value={formData.name} onChange={handleFormChange} className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-1">Type *</label>
                                <select required name="type" value={formData.type} onChange={handleFormChange} className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                                    {EXAM_TYPES.map(t => <option key={t} value={t}>{formatStatus(t)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-1">Status *</label>
                                <select required name="status" value={formData.status} onChange={handleFormChange} className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                                    {STATUSES.map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-1">Session *</label>
                                <input required type="text" name="academicSession" value={formData.academicSession} onChange={handleFormChange} placeholder="e.g. 2026-2027" className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-1">Class *</label>
                                <input required type="text" name="class" value={formData.class} onChange={handleFormChange} className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-1">Section</label>
                                <input type="text" name="section" value={formData.section} onChange={handleFormChange} className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-1">Start Date *</label>
                                <input required type="date" name="startDate" value={formData.startDate} onChange={handleFormChange} className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-1">End Date *</label>
                                <input required type="date" name="endDate" value={formData.endDate} onChange={handleFormChange} className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button type="button" variant="secondary" onClick={() => { setCreateModal(false); setEditRecord(null); }} disabled={isSaving}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Examination"}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            <Modal isOpen={!!deleteRecord} onClose={() => { if (!isDeleting) setDeleteRecord(null) }} title="Confirm Deletion">
                {deleteRecord && (
                    <div className="space-y-4">
                        {modalError && <p className="text-sm text-red-600">{modalError}</p>}
                        <p className="text-sm text-ink-700">
                            Are you sure you want to delete <span className="font-semibold text-ink-900">{deleteRecord.name} ({deleteRecord.academicSession})</span>?
                            This action cannot be undone and will fail if results already exist for this exam.
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
