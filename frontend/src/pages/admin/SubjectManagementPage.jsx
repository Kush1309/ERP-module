import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject
} from '../../services/subjectApi';

export default function SubjectManagementPage() {
    const [subjects, setSubjects] = useState([]);

    // Filters
    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modals state
    const [createModal, setCreateModal] = useState(false);
    const [editRecord, setEditRecord] = useState(null);
    const [deleteRecord, setDeleteRecord] = useState(null);

    // Form States
    const [formData, setFormData] = useState({
        name: '', code: '', maximumMarks: 100, passingMarks: 33
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [modalError, setModalError] = useState('');

    const loadSubjects = useCallback(
        async (searchQuery = '') => {
            setLoading(true);
            setError('');
            try {
                const queryParams = {};
                if (searchQuery) queryParams.search = searchQuery;
                const result = await getSubjects(queryParams);
                setSubjects(result || []);
            } catch {
                setSubjects([]);
                setError('Unable to load subjects.');
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        const handler = setTimeout(() => {
            loadSubjects(search);
        }, 500); // 500ms debounce
        return () => clearTimeout(handler);
    }, [search, loadSubjects]);

    const handleRetry = () => loadSubjects(search);

    const openCreateModal = () => {
        setFormData({ name: '', code: '', maximumMarks: 100, passingMarks: 33 });
        setModalError('');
        setCreateModal(true);
    };

    const openEditModal = (record) => {
        setFormData({
            name: record.name,
            code: record.code,
            maximumMarks: record.maximumMarks,
            passingMarks: record.passingMarks
        });
        setModalError('');
        setEditRecord(record);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('Marks') ? Number(value) : value
        }));
    };

    const validateForm = () => {
        if (formData.maximumMarks <= 0) return 'Maximum marks must be greater than 0';
        if (formData.passingMarks < 0) return 'Passing marks cannot be negative';
        if (formData.passingMarks > formData.maximumMarks) return 'Passing marks cannot exceed maximum marks';
        return null;
    };

    const handleCreateSave = async (e) => {
        e.preventDefault();
        const err = validateForm();
        if (err) return setModalError(err);

        setIsSaving(true);
        setModalError('');
        try {
            await createSubject(formData);
            setCreateModal(false);
            loadSubjects(search);
        } catch (errorResponse) {
            setModalError(errorResponse.response?.data?.message || 'Failed to create subject. Ensure code is unique.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        if (!editRecord) return;

        const err = validateForm();
        if (err) return setModalError(err);

        setIsSaving(true);
        setModalError('');
        try {
            await updateSubject(editRecord._id, formData);
            setEditRecord(null);
            loadSubjects(search);
        } catch (errorResponse) {
            setModalError(errorResponse.response?.data?.message || 'Failed to update subject');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteRecord) return;
        setIsDeleting(true);
        setModalError('');
        try {
            await deleteSubject(deleteRecord._id);
            setDeleteRecord(null);
            loadSubjects(search);
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to delete subject');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-5xl relative">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-ink-900">Subject Configuration</h1>
                    <p className="mt-2 text-sm text-ink-600">Configure core subjects spanning exam environments safely.</p>
                </div>
                <div>
                    <Button type="button" onClick={openCreateModal} className="w-full sm:w-auto">
                        + New Subject
                    </Button>
                </div>
            </div>

            {/* Filters Section */}
            <Card className="mb-6 p-4">
                <div className="w-full max-w-md">
                    <label className="mb-1 block text-sm font-medium text-ink-700">Search Subjects</label>
                    <input
                        type="text"
                        placeholder="Subject Name or Code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                </div>
            </Card>

            <Card className="overflow-hidden">
                {loading ? (
                    <div className="flex min-h-[220px] items-center justify-center">
                        <div className="flex items-center gap-3 text-sm text-ink-600">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                            Loading subjects...
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
                        <p className="text-lg font-semibold text-ink-900">{error}</p>
                        <Button type="button" onClick={handleRetry}>Retry</Button>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
                        <p className="text-lg font-semibold text-ink-900">
                            {search ? "No subjects found matching your search." : "No subjects configured yet."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-ink-200">
                            <thead className="bg-ink-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Subject Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Maximum Marks</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Passing Marks</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-200 bg-white">
                                {subjects.map((subject) => (
                                    <tr key={subject._id} className="hover:bg-ink-50/60">
                                        <td className="px-4 py-3 text-sm font-medium text-ink-900">{subject.name}</td>
                                        <td className="px-4 py-3 text-sm text-ink-700 uppercase">{subject.code}</td>
                                        <td className="px-4 py-3 text-sm text-ink-700">{subject.maximumMarks}</td>
                                        <td className="px-4 py-3 text-sm text-ink-700">{subject.passingMarks}</td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => openEditModal(subject)} className="font-medium text-amber-600 hover:text-amber-800">
                                                    Edit
                                                </button>
                                                <button type="button" onClick={() => setDeleteRecord(subject)} className="font-medium text-red-600 hover:text-red-800">
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Create/Edit Modal */}
            {(createModal || !!editRecord) && (
                <Modal isOpen={true} onClose={() => { if (!isSaving) { setCreateModal(false); setEditRecord(null); } }} title={createModal ? "Create Subject" : "Edit Subject"}>
                    <form onSubmit={createModal ? handleCreateSave : handleEditSave} className="space-y-4">
                        {modalError && <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{modalError}</div>}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-1">Subject Name *</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g. Mathematics" className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-1">Subject Code *</label>
                                <input required type="text" name="code" value={formData.code} onChange={handleFormChange} placeholder="e.g. MATH101" className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-1">Maximum Marks *</label>
                                <input required type="number" name="maximumMarks" min="1" value={formData.maximumMarks} onChange={handleFormChange} className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink-700 mb-1">Passing Marks *</label>
                                <input required type="number" name="passingMarks" min="0" value={formData.passingMarks} onChange={handleFormChange} className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button type="button" variant="secondary" onClick={() => { setCreateModal(false); setEditRecord(null); }} disabled={isSaving}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Subject"}
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
                            Are you sure you want to delete <span className="font-semibold text-ink-900">{deleteRecord.name} ({deleteRecord.code})</span>?
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
