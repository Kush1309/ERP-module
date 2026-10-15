import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { settingsApi, auditApi } from '../../services/moduleApi';
import { PageHeader, Tabs, Field, Alert, LoadingState, ErrorState, DataTable, PaginationBar, StatusPill, inputClass, errorMessage } from '../../components/common/ui';

const PROFILE_FIELDS = [
    { key: 'schoolName', label: 'School name', required: true },
    { key: 'principalName', label: 'Principal name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'website', label: 'Website' },
    { key: 'currency', label: 'Currency code' },
];

const POLICY_FIELDS = [
    { key: 'libraryLoanDays', label: 'Library loan period (days)', min: 1, hint: 'Default due date for new book issues.' },
    { key: 'libraryMaxActiveIssues', label: 'Max books per borrower', min: 1, hint: 'Further issues are blocked once a borrower reaches this.' },
    { key: 'libraryFinePerDay', label: 'Library fine per late day', min: 0, step: '0.5', hint: 'Charged on return of an overdue book. 0 disables fines.' },
    { key: 'feeLateFeePerDay', label: 'Fee late charge per day (reference)', min: 0, step: '0.5', hint: 'Shown for reference; it is not added to fee records automatically.' },
    { key: 'attendanceLowThreshold', label: 'Low attendance threshold (%)', min: 0, max: 100, hint: 'Students below this appear in the low-attendance report.' },
];

function SettingsForm() {
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState('');
    const [saveError, setSaveError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setForm(await settingsApi.get());
        } catch (err) {
            setError(errorMessage(err, 'Unable to load settings.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveError('');
        setNotice('');
        try {
            const body = {};
            PROFILE_FIELDS.forEach((f) => { body[f.key] = form[f.key] ?? ''; });
            body.address = form.address ?? '';
            POLICY_FIELDS.forEach((f) => { body[f.key] = Number(form[f.key]); });
            setForm(await settingsApi.update(body));
            setNotice('Settings saved.');
        } catch (err) {
            setSaveError(errorMessage(err, 'Unable to save settings.'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} onRetry={load} />;

    return (
        <form onSubmit={submit} className="space-y-6">
            {notice && <Alert>{notice}</Alert>}
            {saveError && <Alert tone="error">{saveError}</Alert>}
            <Card>
                <h2 className="mb-4 text-lg font-semibold text-ink-900">School profile</h2>
                <p className="mb-4 text-sm text-ink-600">Printed on report cards and fee receipts.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                    {PROFILE_FIELDS.map((f) => (
                        <Field key={f.key} label={f.label} htmlFor={`s-${f.key}`} required={f.required}>
                            <input id={`s-${f.key}`} type={f.type || 'text'} required={f.required} className={inputClass} value={form[f.key] ?? ''} onChange={set(f.key)} />
                        </Field>
                    ))}
                    <div className="sm:col-span-2">
                        <Field label="Address" htmlFor="s-address">
                            <textarea id="s-address" rows={2} className={inputClass} value={form.address ?? ''} onChange={set('address')} />
                        </Field>
                    </div>
                </div>
            </Card>
            <Card>
                <h2 className="mb-4 text-lg font-semibold text-ink-900">Policies</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {POLICY_FIELDS.map((f) => (
                        <Field key={f.key} label={f.label} htmlFor={`s-${f.key}`} hint={f.hint} required>
                            <input id={`s-${f.key}`} type="number" required min={f.min} max={f.max} step={f.step || '1'} className={inputClass} value={form[f.key] ?? ''} onChange={set(f.key)} />
                        </Field>
                    ))}
                </div>
            </Card>
            <div className="flex justify-end">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</Button>
            </div>
        </form>
    );
}

const METHOD_TONE = { POST: 'green', PUT: 'blue', PATCH: 'amber', DELETE: 'red' };

function AuditLogTab() {
    const [filters, setFilters] = useState({ search: '', module: '', method: '', startDate: '', endDate: '' });
    const [applied, setApplied] = useState(filters);
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ logs: [], modules: [], pagination: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = { page };
            Object.entries(applied).forEach(([k, v]) => { if (v) params[k] = v; });
            const result = await auditApi.list(params);
            setData({ logs: result?.logs || [], modules: result?.modules || [], pagination: result?.pagination || null });
        } catch (err) {
            setError(errorMessage(err, 'Unable to load the audit log.'));
        } finally {
            setLoading(false);
        }
    }, [page, applied]);

    useEffect(() => { load(); }, [load]);

    const apply = (e) => {
        e.preventDefault();
        setPage(1);
        setApplied(filters);
    };

    return (
        <>
            <p className="mb-4 text-sm text-ink-600">Every successful create, update and delete made by administrators, accountants and librarians. Request contents (including passwords) are never stored.</p>
            <Card className="mb-4">
                <form onSubmit={apply} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <input aria-label="Search login ID or path" placeholder="Login ID or path" className={`${inputClass} lg:col-span-2`} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                    <select aria-label="Module" className={inputClass} value={filters.module} onChange={(e) => setFilters({ ...filters, module: e.target.value })}>
                        <option value="">All modules</option>
                        {data.modules.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select aria-label="Action" className={inputClass} value={filters.method} onChange={(e) => setFilters({ ...filters, method: e.target.value })}>
                        <option value="">All actions</option>
                        {['POST', 'PUT', 'PATCH', 'DELETE'].map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input aria-label="From date" type="date" className={inputClass} value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
                    <input aria-label="To date" type="date" className={inputClass} value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
                    <div className="flex gap-2 lg:col-span-6 lg:justify-end">
                        <Button type="button" variant="secondary" onClick={() => { const empty = { search: '', module: '', method: '', startDate: '', endDate: '' }; setFilters(empty); setApplied(empty); setPage(1); }}>Reset</Button>
                        <Button type="submit">Apply</Button>
                    </div>
                </form>
            </Card>
            <DataTable
                loading={loading}
                error={error}
                onRetry={load}
                rows={data.logs}
                emptyTitle="No audit entries"
                emptyDescription="Administrative changes will appear here."
                columns={[
                    { key: 'createdAt', label: 'When', render: (r) => new Date(r.createdAt).toLocaleString() },
                    { key: 'actor', label: 'User', render: (r) => <span>{r.actorLoginId} <span className="text-xs text-ink-500">({r.actorRole})</span></span> },
                    { key: 'method', label: 'Action', render: (r) => <StatusPill value={r.method} tone={METHOD_TONE[r.method]} /> },
                    { key: 'module', label: 'Module' },
                    { key: 'path', label: 'Path', render: (r) => <code className="break-all text-xs text-ink-700">{r.path}</code> },
                    { key: 'statusCode', label: 'Status' },
                ]}
                footer={!loading && !error && <PaginationBar pagination={data.pagination} onPage={setPage} loading={loading} />}
            />
        </>
    );
}

export default function SettingsPage() {
    const [tab, setTab] = useState('settings');
    return (
        <div className="mx-auto w-full max-w-6xl">
            <PageHeader title="Settings" description="School profile, operating policies and the administrative audit trail." />
            <Tabs tabs={[{ key: 'settings', label: 'School & Policies' }, { key: 'audit', label: 'Audit Log' }]} active={tab} onChange={setTab} />
            {tab === 'settings' ? <SettingsForm /> : <AuditLogTab />}
        </div>
    );
}
