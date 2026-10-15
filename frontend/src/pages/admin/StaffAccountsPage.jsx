import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import CredentialsModal from '../../components/students/CredentialsModal';
import { staffApi } from '../../services/moduleApi';
import { PageHeader, DataTable, PaginationBar, StatusPill, Field, Alert, inputClass, errorMessage, formatLabel, toDateInput } from '../../components/common/ui';

const ROLES = ['ACCOUNTANT', 'LIBRARIAN'];
const EMPTY = { role: 'ACCOUNTANT', firstName: '', lastName: '', phone: '', email: '', department: '', designation: '', joiningDate: '' };

export default function StaffAccountsPage() {
    const [filters, setFilters] = useState({ search: '', role: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ staff: [], pagination: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [modal, setModal] = useState(null); // { mode: 'create' | 'edit', record? }
    const [form, setForm] = useState(EMPTY);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [credentials, setCredentials] = useState(null);

    useEffect(() => {
        const t = setTimeout(() => { setPage(1); setFilters((f) => ({ ...f, search })); }, 350);
        return () => clearTimeout(t);
    }, [search]);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await staffApi.list({ page, search: filters.search || undefined, role: filters.role || undefined });
            setData({ staff: result?.staff || [], pagination: result?.pagination || null });
        } catch (err) {
            setError(errorMessage(err, 'Unable to load staff accounts.'));
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setForm(EMPTY); setFormError(''); setModal({ mode: 'create' }); };
    const openEdit = (record) => {
        setForm({ ...EMPTY, ...record, role: record.user?.role, email: record.email || '', joiningDate: toDateInput(record.joiningDate) });
        setFormError('');
        setModal({ mode: 'edit', record });
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');
        try {
            const body = { firstName: form.firstName, lastName: form.lastName, phone: form.phone, email: form.email, department: form.department, designation: form.designation, joiningDate: form.joiningDate || null };
            if (modal.mode === 'create') {
                const result = await staffApi.create({ ...body, role: form.role });
                setCredentials({ credentials: result.credentials });
                setNotice(`${formatLabel(form.role)} account created.`);
            } else {
                await staffApi.update(modal.record._id, body);
                setNotice('Staff details updated.');
            }
            setModal(null);
            load();
        } catch (err) {
            setFormError(errorMessage(err, 'Unable to save staff member.'));
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (record) => {
        const activate = !record.user?.isActive;
        try {
            await staffApi.setActive(record._id, activate);
            setNotice(`${record.firstName} ${record.lastName} ${activate ? 'activated' : 'deactivated'}.`);
            load();
        } catch (err) {
            setError(errorMessage(err, 'Unable to change account status.'));
        }
    };

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    return (
        <div className="mx-auto w-full max-w-6xl">
            <PageHeader
                title="Staff Accounts"
                description="Non-teaching staff logins: accountants (fees & finance) and librarians (library). Teachers are managed under Teachers."
                actions={<Button type="button" onClick={openCreate}>Add Staff Member</Button>}
            />
            {notice && <Alert>{notice}</Alert>}
            <Card className="mb-4 flex flex-col gap-3 sm:flex-row">
                <input aria-label="Search staff" placeholder="Search name, phone, email, department..." className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} />
                <select aria-label="Filter by role" className={`${inputClass} sm:w-56`} value={filters.role} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, role: e.target.value })); }}>
                    <option value="">All roles</option>
                    {ROLES.map((r) => <option key={r} value={r}>{formatLabel(r)}</option>)}
                </select>
            </Card>
            <DataTable
                loading={loading}
                error={error}
                onRetry={load}
                rows={data.staff}
                emptyTitle="No staff accounts yet"
                emptyDescription="Create an accountant or librarian account to delegate fee or library work."
                columns={[
                    { key: 'name', label: 'Name', render: (r) => <div><p className="font-medium text-ink-900">{r.firstName} {r.lastName}</p><p className="text-xs text-ink-500">{r.designation || '—'}{r.department ? ` · ${r.department}` : ''}</p></div> },
                    { key: 'role', label: 'Role', render: (r) => formatLabel(r.user?.role) },
                    { key: 'loginId', label: 'Login ID', render: (r) => r.user?.loginId || '—' },
                    { key: 'contact', label: 'Contact', render: (r) => <div><p>{r.phone}</p>{r.email && <p className="text-xs text-ink-500">{r.email}</p>}</div> },
                    { key: 'status', label: 'Status', render: (r) => <StatusPill value={r.user?.isActive ? 'ACTIVE' : 'INACTIVE'} tone={r.user?.isActive ? 'green' : 'red'} /> },
                    {
                        key: 'actions', label: '', className: 'text-right', render: (r) => (
                            <div className="flex justify-end gap-3">
                                <button type="button" className="font-medium text-brand-700 hover:text-brand-800" onClick={() => openEdit(r)}>Edit</button>
                                <button type="button" className={`font-medium ${r.user?.isActive ? 'text-red-600 hover:text-red-700' : 'text-emerald-700 hover:text-emerald-800'}`} onClick={() => toggleActive(r)}>{r.user?.isActive ? 'Deactivate' : 'Activate'}</button>
                            </div>
                        ),
                    },
                ]}
                footer={!loading && !error && <PaginationBar pagination={data.pagination} onPage={setPage} loading={loading} />}
            />

            <Modal isOpen={!!modal} onClose={() => !saving && setModal(null)} title={modal?.mode === 'edit' ? 'Edit Staff Member' : 'Add Staff Member'}>
                <form onSubmit={submit} className="space-y-4">
                    {formError && <Alert tone="error">{formError}</Alert>}
                    {modal?.mode === 'create' && (
                        <Field label="Role" htmlFor="st-role" required>
                            <select id="st-role" className={inputClass} value={form.role} onChange={set('role')}>
                                {ROLES.map((r) => <option key={r} value={r}>{formatLabel(r)}</option>)}
                            </select>
                        </Field>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="First name" htmlFor="st-first" required><input id="st-first" required className={inputClass} value={form.firstName} onChange={set('firstName')} /></Field>
                        <Field label="Last name" htmlFor="st-last" required><input id="st-last" required className={inputClass} value={form.lastName} onChange={set('lastName')} /></Field>
                        <Field label="Phone" htmlFor="st-phone" required><input id="st-phone" required className={inputClass} value={form.phone} onChange={set('phone')} /></Field>
                        <Field label="Email" htmlFor="st-email"><input id="st-email" type="email" className={inputClass} value={form.email} onChange={set('email')} /></Field>
                        <Field label="Designation" htmlFor="st-desig"><input id="st-desig" className={inputClass} value={form.designation} onChange={set('designation')} /></Field>
                        <Field label="Department" htmlFor="st-dept"><input id="st-dept" className={inputClass} value={form.department} onChange={set('department')} /></Field>
                        <Field label="Joining date" htmlFor="st-join"><input id="st-join" type="date" className={inputClass} value={form.joiningDate} onChange={set('joiningDate')} /></Field>
                    </div>
                    {modal?.mode === 'create' && <p className="text-xs text-ink-500">A login ID and a one-time temporary password are generated. The user must change it at first login.</p>}
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </div>
                </form>
            </Modal>
            <CredentialsModal isOpen={!!credentials} data={credentials} onDone={() => setCredentials(null)} />
        </div>
    );
}
