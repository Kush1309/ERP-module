import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import StudentPicker from '../../components/common/StudentPicker';
import CredentialsModal from '../../components/students/CredentialsModal';
import { createParent, getParents, setParentActive, updateParent } from '../../services/parentAdminApi';

const inputClass =
    'w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

const emptyForm = { firstName: '', lastName: '', phone: '', email: '', students: [] };

export default function ParentManagementPage() {
    const [parents, setParents] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [pickerKey, setPickerKey] = useState(0);
    const [credentials, setCredentials] = useState(null);
    const [togglingId, setTogglingId] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const loadParents = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getParents({ page, limit: 10, search: debouncedSearch });
            setParents(data?.parents || []);
            setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
        } catch (err) {
            setError(err?.response?.data?.message || 'Unable to load parent accounts.');
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        loadParents();
    }, [loadParents]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setFormError('');
        setPickerKey((k) => k + 1);
        setModalOpen(true);
    };

    const openEdit = (parent) => {
        setEditing(parent);
        setForm({
            firstName: parent.firstName || '',
            lastName: parent.lastName || '',
            phone: parent.phone || '',
            email: parent.email || '',
            students: parent.students || [],
        });
        setFormError('');
        setPickerKey((k) => k + 1);
        setModalOpen(true);
    };

    const addStudent = (studentId, student) => {
        if (!studentId || !student) return;
        setForm((prev) => (prev.students.some((s) => s._id === studentId)
            ? prev
            : { ...prev, students: [...prev.students, student] }));
        setPickerKey((k) => k + 1);
    };

    const removeStudent = (studentId) => {
        setForm((prev) => ({ ...prev, students: prev.students.filter((s) => s._id !== studentId) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
            setFormError('First name, last name and phone are required.');
            return;
        }

        const payload = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            studentIds: form.students.map((s) => s._id),
        };

        setSaving(true);
        try {
            if (editing) {
                await updateParent(editing._id, payload);
                setNotice('Parent account updated successfully.');
            } else {
                const result = await createParent(payload);
                setCredentials(result);
            }
            setModalOpen(false);
            loadParents();
        } catch (err) {
            setFormError(err?.response?.data?.message || 'Unable to save the parent account.');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (parent) => {
        const nextActive = !parent.user?.isActive;
        setTogglingId(parent._id);
        setError('');
        try {
            await setParentActive(parent._id, nextActive);
            setNotice(`Parent account ${nextActive ? 'activated' : 'deactivated'} successfully.`);
            loadParents();
        } catch (err) {
            setError(err?.response?.data?.message || 'Unable to update account status.');
        } finally {
            setTogglingId(null);
        }
    };

    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(''), 3000);
        return () => clearTimeout(timer);
    }, [notice]);

    const totalPages = Math.max(pagination.totalPages || 1, 1);

    return (
        <div className="mx-auto w-full max-w-6xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Admin module</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Parent Portal</h1>
                    <p className="mt-2 text-sm text-ink-600">Create parent logins and link them to their children.</p>
                </div>
                <Button type="button" variant="secondary" onClick={openCreate} className="min-w-[150px] whitespace-nowrap">
                    + Add Parent
                </Button>
            </div>

            {notice && (
                <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>
            )}

            <Card className="mb-6 p-4">
                <label htmlFor="parent-search" className="mb-1 block text-sm font-medium text-ink-700">Search</label>
                <input
                    id="parent-search"
                    type="text"
                    placeholder="Search by name, phone, email or login ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={inputClass}
                />
            </Card>

            <Card className="p-0 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center gap-3 py-16 text-sm text-ink-500">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                        Loading parent accounts...
                    </div>
                ) : error ? (
                    <div className="py-12 text-center">
                        <p className="text-sm text-red-600">{error}</p>
                        <Button type="button" variant="secondary" className="mt-4" onClick={loadParents}>Retry</Button>
                    </div>
                ) : parents.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-sm font-medium text-ink-800">No parent accounts found</p>
                        <p className="mt-1 text-sm text-ink-500">
                            {debouncedSearch ? 'Try a different search term.' : 'Add a parent to give families access to the parent portal.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-ink-200">
                                <thead className="bg-ink-50">
                                    <tr>
                                        {['Login ID', 'Parent Name', 'Contact', 'Linked Students', 'Status', 'Actions'].map((h) => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-200 bg-white">
                                    {parents.map((parent) => {
                                        const isActive = parent.user?.isActive;
                                        return (
                                            <tr key={parent._id} className="hover:bg-ink-50/60">
                                                <td className="px-4 py-3 text-sm font-medium text-ink-900">{parent.user?.loginId || '—'}</td>
                                                <td className="px-4 py-3 text-sm text-ink-900">{`${parent.firstName || ''} ${parent.lastName || ''}`.trim() || '—'}</td>
                                                <td className="px-4 py-3 text-sm text-ink-700">
                                                    <div>{parent.phone || '—'}</div>
                                                    {parent.email && <div className="text-xs text-ink-500">{parent.email}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-ink-700">
                                                    {parent.students?.length ? (
                                                        <ul className="space-y-0.5">
                                                            {parent.students.map((s) => (
                                                                <li key={s._id}>{s.firstName} {s.lastName} <span className="text-xs text-ink-500">({s.class}-{s.section})</span></li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-ink-400">None linked</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${isActive
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-red-50 text-red-700 border-red-200'
                                                        }`}>
                                                        {isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <button type="button" onClick={() => openEdit(parent)} className="font-medium text-brand-700 transition hover:text-brand-800">Edit</button>
                                                        <button
                                                            type="button"
                                                            disabled={togglingId === parent._id}
                                                            onClick={() => toggleActive(parent)}
                                                            className={`font-medium transition disabled:opacity-50 ${isActive ? 'text-red-600 hover:text-red-700' : 'text-emerald-700 hover:text-emerald-800'}`}
                                                        >
                                                            {togglingId === parent._id ? 'Saving…' : isActive ? 'Deactivate' : 'Activate'}
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
                            <div className="text-sm text-ink-600">Page {pagination.page || 1} of {totalPages} · {pagination.total || 0} parent(s)</div>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="secondary" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1 || loading} className="!px-3 !py-2">Previous</Button>
                                <Button type="button" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page >= totalPages || loading} className="!px-3 !py-2">Next</Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>

            <Modal isOpen={modalOpen} onClose={() => { if (!saving) setModalOpen(false); }} title={editing ? 'Edit Parent Account' : 'Add Parent Account'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {formError && <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{formError}</div>}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="p-first" className="mb-1 block text-sm font-medium text-ink-700">First Name *</label>
                            <input id="p-first" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="p-last" className="mb-1 block text-sm font-medium text-ink-700">Last Name *</label>
                            <input id="p-last" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="p-phone" className="mb-1 block text-sm font-medium text-ink-700">Phone *</label>
                            <input id="p-phone" required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="p-email" className="mb-1 block text-sm font-medium text-ink-700">Email</label>
                            <input id="p-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="p-student" className="mb-1 block text-sm font-medium text-ink-700">Linked Students</label>
                        <StudentPicker key={pickerKey} id="p-student" value="" onChange={addStudent} placeholder="Search and add a student..." />
                        {form.students.length > 0 ? (
                            <ul className="mt-2 divide-y divide-ink-100 rounded-md border border-ink-200">
                                {form.students.map((s) => (
                                    <li key={s._id} className="flex items-center justify-between px-3 py-2 text-sm">
                                        <span className="text-ink-800">{s.firstName} {s.lastName} <span className="text-xs text-ink-500">({s.studentId}, {s.class}-{s.section})</span></span>
                                        <button type="button" onClick={() => removeStudent(s._id)} className="text-xs font-semibold text-red-600 hover:text-red-700">Remove</button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-2 text-xs text-ink-500">No students linked yet. The parent will only see linked students.</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-ink-100 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Parent'}</Button>
                    </div>
                </form>
            </Modal>

            <CredentialsModal isOpen={!!credentials} data={credentials} onDone={() => setCredentials(null)} />
        </div>
    );
}
