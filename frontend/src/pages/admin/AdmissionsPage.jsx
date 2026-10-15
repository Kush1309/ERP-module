import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import CredentialsModal from '../../components/students/CredentialsModal';
import { admissionsApi } from '../../services/moduleApi';
import { PageHeader, Tabs, DataTable, PaginationBar, StatusPill, Field, Alert, inputClass, errorMessage, formatDate, formatLabel, toDateInput } from '../../components/common/ui';

const ENQUIRY_STATUSES = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'APPLIED', 'CLOSED'];
const SOURCES = ['WALK_IN', 'PHONE', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'OTHER'];
const APP_STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ENROLLED'];
const TRANSITIONS = { PENDING: ['UNDER_REVIEW', 'APPROVED', 'REJECTED'], UNDER_REVIEW: ['APPROVED', 'REJECTED', 'PENDING'], APPROVED: ['UNDER_REVIEW', 'REJECTED'], REJECTED: ['UNDER_REVIEW'], ENROLLED: [] };
const TONE = { NEW: 'blue', CONTACTED: 'amber', FOLLOW_UP: 'amber', APPLIED: 'green', CLOSED: 'gray', PENDING: 'gray', UNDER_REVIEW: 'amber', APPROVED: 'green', REJECTED: 'red', ENROLLED: 'blue' };
const DEFAULT_DOCS = 'Birth certificate\nPrevious school report\nTransfer certificate\nAddress proof\nPhotograph';

const EMPTY_ENQUIRY = { studentName: '', parentName: '', phone: '', email: '', classApplied: '', source: 'WALK_IN', notes: '', nextFollowUpDate: '' };
const EMPTY_APP = { firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE', classApplied: '', guardianName: '', phone: '', email: '', address: '', city: '', state: '', postalCode: '', previousSchool: '', documents: DEFAULT_DOCS };

function useDebounced(value, delay = 350) {
    const [v, setV] = useState(value);
    useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
    return v;
}

// ---------------- Application form (shared by create / convert / edit) ----------------
function ApplicationForm({ initial, onCancel, onSubmit, saving, error }) {
    const [form, setForm] = useState(initial);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
            {error && <Alert tone="error">{error}</Alert>}
            <div className="grid gap-3 sm:grid-cols-2">
                <Field label="First name" htmlFor="ap-first" required><input id="ap-first" required className={inputClass} value={form.firstName} onChange={set('firstName')} /></Field>
                <Field label="Last name" htmlFor="ap-last" required><input id="ap-last" required className={inputClass} value={form.lastName} onChange={set('lastName')} /></Field>
                <Field label="Date of birth" htmlFor="ap-dob" required><input id="ap-dob" type="date" required className={inputClass} value={form.dateOfBirth} onChange={set('dateOfBirth')} /></Field>
                <Field label="Gender" htmlFor="ap-gender" required>
                    <select id="ap-gender" className={inputClass} value={form.gender} onChange={set('gender')}>
                        <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                    </select>
                </Field>
                <Field label="Class applied for" htmlFor="ap-class" required><input id="ap-class" required className={inputClass} value={form.classApplied} onChange={set('classApplied')} /></Field>
                <Field label="Previous school" htmlFor="ap-prev"><input id="ap-prev" className={inputClass} value={form.previousSchool} onChange={set('previousSchool')} /></Field>
                <Field label="Guardian name" htmlFor="ap-guardian" required><input id="ap-guardian" required className={inputClass} value={form.guardianName} onChange={set('guardianName')} /></Field>
                <Field label="Phone" htmlFor="ap-phone" required><input id="ap-phone" required className={inputClass} value={form.phone} onChange={set('phone')} /></Field>
                <Field label="Email" htmlFor="ap-email"><input id="ap-email" type="email" className={inputClass} value={form.email} onChange={set('email')} /></Field>
                <Field label="City" htmlFor="ap-city" required><input id="ap-city" required className={inputClass} value={form.city} onChange={set('city')} /></Field>
                <Field label="State" htmlFor="ap-state" required><input id="ap-state" required className={inputClass} value={form.state} onChange={set('state')} /></Field>
                <Field label="Postal code" htmlFor="ap-postal" required><input id="ap-postal" required className={inputClass} value={form.postalCode} onChange={set('postalCode')} /></Field>
            </div>
            <Field label="Address" htmlFor="ap-address" required><textarea id="ap-address" rows={2} required className={inputClass} value={form.address} onChange={set('address')} /></Field>
            <Field label="Documents to collect" htmlFor="ap-docs" hint="One per line. Each must be verified before the application can be approved.">
                <textarea id="ap-docs" rows={4} className={inputClass} value={form.documents} onChange={set('documents')} />
            </Field>
            <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save application'}</Button>
            </div>
        </form>
    );
}

const toApplicationBody = (form) => ({ ...form, documents: form.documents.split('\n').map((d) => d.trim()).filter(Boolean) });

// ---------------- Enquiries ----------------
function Enquiries({ onConverted }) {
    const [search, setSearch] = useState('');
    const debounced = useDebounced(search);
    const [status, setStatus] = useState('');
    const [due, setDue] = useState(false);
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ enquiries: [], pagination: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY_ENQUIRY);
    const [follow, setFollow] = useState({ note: '', nextFollowUpDate: '', status: '' });
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await admissionsApi.listEnquiries({ page, search: debounced || undefined, status: status || undefined, followUpDue: due ? 'true' : undefined });
            setData({ enquiries: result?.enquiries || [], pagination: result?.pagination || null });
        } catch (err) {
            setError(errorMessage(err, 'Unable to load enquiries.'));
        } finally {
            setLoading(false);
        }
    }, [page, debounced, status, due]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [debounced, status, due]);

    const open = (mode, record) => {
        setFormError('');
        if (mode === 'create') setForm(EMPTY_ENQUIRY);
        if (mode === 'edit') setForm({ ...EMPTY_ENQUIRY, ...record, nextFollowUpDate: toDateInput(record.nextFollowUpDate) });
        if (mode === 'follow') setFollow({ note: '', nextFollowUpDate: '', status: '' });
        setModal({ mode, record });
    };

    const run = async (fn, message) => {
        setSaving(true);
        setFormError('');
        try {
            await fn();
            setNotice(message);
            setModal(null);
            load();
        } catch (err) {
            setFormError(errorMessage(err, 'Unable to save.'));
        } finally {
            setSaving(false);
        }
    };

    const saveEnquiry = (e) => {
        e.preventDefault();
        const body = { ...form, nextFollowUpDate: form.nextFollowUpDate || null };
        delete body._id; delete body.followUps; delete body.application; delete body.createdAt; delete body.updatedAt; delete body.__v;
        run(() => (modal.mode === 'create' ? admissionsApi.createEnquiry(body) : admissionsApi.updateEnquiry(modal.record._id, body)), 'Enquiry saved.');
    };

    const saveFollowUp = (e) => {
        e.preventDefault();
        run(() => admissionsApi.addFollowUp(modal.record._id, { note: follow.note, nextFollowUpDate: follow.nextFollowUpDate || null, status: follow.status || undefined }), 'Follow-up recorded.');
    };

    const convert = (formValues) => run(async () => {
        await admissionsApi.createApplication({ ...toApplicationBody(formValues), enquiry: modal.record._id });
        onConverted();
    }, 'Application created from enquiry.');

    const remove = async (r) => {
        if (!window.confirm(`Delete the enquiry for ${r.studentName}?`)) return;
        try { await admissionsApi.deleteEnquiry(r._id); setNotice('Enquiry deleted.'); load(); } catch (err) { setError(errorMessage(err, 'Unable to delete enquiry.')); }
    };

    const [first, ...rest] = (modal?.record?.studentName || '').split(' ');

    return (
        <>
            <Card className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                <input aria-label="Search enquiries" placeholder="Search student, parent, phone, email..." className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} />
                <select aria-label="Enquiry status" className={`${inputClass} lg:w-48`} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All statuses</option>
                    {ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                </select>
                <label className="flex shrink-0 items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={due} onChange={(e) => setDue(e.target.checked)} /> Follow-up due</label>
                <Button type="button" className="shrink-0" onClick={() => open('create')}>New Enquiry</Button>
            </Card>
            {notice && <Alert>{notice}</Alert>}
            <DataTable
                loading={loading}
                error={error}
                onRetry={load}
                rows={data.enquiries}
                emptyTitle="No enquiries"
                emptyDescription="Record walk-in, phone or website enquiries from prospective families."
                columns={[
                    { key: 'student', label: 'Prospective student', render: (r) => <div><p className="font-medium text-ink-900">{r.studentName}</p><p className="text-xs text-ink-500">Class {r.classApplied} · {formatLabel(r.source)}</p></div> },
                    { key: 'parent', label: 'Parent / contact', render: (r) => <div><p>{r.parentName}</p><p className="text-xs text-ink-500">{r.phone}{r.email ? ` · ${r.email}` : ''}</p></div> },
                    { key: 'next', label: 'Next follow-up', render: (r) => formatDate(r.nextFollowUpDate) },
                    { key: 'followUps', label: 'Follow-ups', render: (r) => r.followUps?.length || 0 },
                    { key: 'status', label: 'Status', render: (r) => <StatusPill value={r.status} tone={TONE[r.status]} /> },
                    {
                        key: 'actions', label: '', className: 'text-right', render: (r) => (
                            <div className="flex flex-wrap justify-end gap-3">
                                <button type="button" className="font-medium text-brand-700" onClick={() => open('follow', r)}>Follow up</button>
                                <button type="button" className="font-medium text-brand-700" onClick={() => open('edit', r)}>Edit</button>
                                {!r.application && r.status !== 'CLOSED' && <button type="button" className="font-medium text-emerald-700" onClick={() => open('convert', r)}>Convert</button>}
                                {!r.application && <button type="button" className="font-medium text-red-600" onClick={() => remove(r)}>Delete</button>}
                            </div>
                        ),
                    },
                ]}
                footer={!loading && !error && <PaginationBar pagination={data.pagination} onPage={setPage} loading={loading} />}
            />

            <Modal isOpen={modal?.mode === 'create' || modal?.mode === 'edit'} onClose={() => !saving && setModal(null)} title={modal?.mode === 'edit' ? 'Edit Enquiry' : 'New Enquiry'}>
                <form onSubmit={saveEnquiry} className="space-y-4">
                    {formError && <Alert tone="error">{formError}</Alert>}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Student name" htmlFor="en-student" required><input id="en-student" required className={inputClass} value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} /></Field>
                        <Field label="Class applied for" htmlFor="en-class" required><input id="en-class" required className={inputClass} value={form.classApplied} onChange={(e) => setForm({ ...form, classApplied: e.target.value })} /></Field>
                        <Field label="Parent name" htmlFor="en-parent" required><input id="en-parent" required className={inputClass} value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} /></Field>
                        <Field label="Phone" htmlFor="en-phone" required><input id="en-phone" required className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                        <Field label="Email" htmlFor="en-email"><input id="en-email" type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                        <Field label="Source" htmlFor="en-source">
                            <select id="en-source" className={inputClass} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                                {SOURCES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                            </select>
                        </Field>
                        {modal?.mode === 'edit' && (
                            <Field label="Status" htmlFor="en-status">
                                <select id="en-status" className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                    {ENQUIRY_STATUSES.filter((s) => s !== 'APPLIED' || form.status === 'APPLIED').map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                                </select>
                            </Field>
                        )}
                        <Field label="Next follow-up" htmlFor="en-next"><input id="en-next" type="date" className={inputClass} value={form.nextFollowUpDate} onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })} /></Field>
                    </div>
                    <Field label="Notes" htmlFor="en-notes"><textarea id="en-notes" rows={2} className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={modal?.mode === 'follow'} onClose={() => !saving && setModal(null)} title={`Follow-up · ${modal?.record?.studentName || ''}`}>
                <div className="mb-4 max-h-48 space-y-2 overflow-y-auto">
                    {(modal?.record?.followUps || []).length === 0 ? <p className="text-sm text-ink-500">No follow-ups recorded yet.</p> : [...modal.record.followUps].reverse().map((f) => (
                        <div key={f._id} className="rounded-md border border-ink-200 p-2 text-sm"><p className="text-xs text-ink-500">{new Date(f.date).toLocaleString()}</p><p className="text-ink-800">{f.note}</p></div>
                    ))}
                </div>
                <form onSubmit={saveFollowUp} className="space-y-3">
                    {formError && <Alert tone="error">{formError}</Alert>}
                    <Field label="Note" htmlFor="fu-note" required><textarea id="fu-note" rows={2} required className={inputClass} value={follow.note} onChange={(e) => setFollow({ ...follow, note: e.target.value })} /></Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Next follow-up" htmlFor="fu-next"><input id="fu-next" type="date" className={inputClass} value={follow.nextFollowUpDate} onChange={(e) => setFollow({ ...follow, nextFollowUpDate: e.target.value })} /></Field>
                        <Field label="Update status" htmlFor="fu-status">
                            <select id="fu-status" className={inputClass} value={follow.status} onChange={(e) => setFollow({ ...follow, status: e.target.value })}>
                                <option value="">Keep / auto</option>
                                {['CONTACTED', 'FOLLOW_UP', 'CLOSED'].map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                            </select>
                        </Field>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setModal(null)} disabled={saving}>Close</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add follow-up'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={modal?.mode === 'convert'} onClose={() => !saving && setModal(null)} title="Convert Enquiry to Application" size="max-w-2xl">
                {modal?.mode === 'convert' && (
                    <ApplicationForm
                        initial={{ ...EMPTY_APP, firstName: first || '', lastName: rest.join(' '), classApplied: modal.record.classApplied, guardianName: modal.record.parentName, phone: modal.record.phone, email: modal.record.email || '' }}
                        onCancel={() => setModal(null)}
                        onSubmit={convert}
                        saving={saving}
                        error={formError}
                    />
                )}
            </Modal>
        </>
    );
}

// ---------------- Applications ----------------
function Applications() {
    const [search, setSearch] = useState('');
    const debounced = useDebounced(search);
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ applications: [], counts: {}, pagination: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [modal, setModal] = useState(null);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [decision, setDecision] = useState({ status: '', note: '' });
    const [enroll, setEnroll] = useState({ section: '', rollNumber: '', admissionNumber: '', admissionDate: '', allowPossibleDuplicate: false });
    const [credentials, setCredentials] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await admissionsApi.listApplications({ page, search: debounced || undefined, status: status || undefined });
            setData({ applications: result?.applications || [], counts: result?.counts || {}, pagination: result?.pagination || null });
        } catch (err) {
            setError(errorMessage(err, 'Unable to load applications.'));
        } finally {
            setLoading(false);
        }
    }, [page, debounced, status]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [debounced, status]);

    // Keep the open record in sync after an update
    const refreshRecord = (record) => { setModal((m) => (m ? { ...m, record } : m)); load(); };

    const open = (mode, record) => {
        setFormError('');
        if (mode === 'review') setDecision({ status: '', note: '' });
        if (mode === 'enroll') setEnroll({ section: '', rollNumber: '', admissionNumber: '', admissionDate: '', allowPossibleDuplicate: false });
        setModal({ mode, record });
    };

    const create = async (form) => {
        setSaving(true);
        setFormError('');
        try {
            if (modal.mode === 'edit') await admissionsApi.updateApplication(modal.record._id, toApplicationBody(form));
            else await admissionsApi.createApplication(toApplicationBody(form));
            setNotice('Application saved.');
            setModal(null);
            load();
        } catch (err) {
            setFormError(errorMessage(err, 'Unable to save application.'));
        } finally {
            setSaving(false);
        }
    };

    const verify = async (doc) => {
        setFormError('');
        try { refreshRecord(await admissionsApi.verifyDocument(modal.record._id, doc._id, !doc.verified)); } catch (err) { setFormError(errorMessage(err, 'Unable to update document.')); }
    };

    const decide = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');
        try {
            refreshRecord(await admissionsApi.changeStatus(modal.record._id, decision.status, decision.note));
            setNotice(`Application ${modal.record.applicationNumber} marked ${formatLabel(decision.status)}.`);
            setDecision({ status: '', note: '' });
        } catch (err) {
            setFormError(errorMessage(err, 'Unable to change status.'));
        } finally {
            setSaving(false);
        }
    };

    const doEnroll = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');
        try {
            const result = await admissionsApi.enroll(modal.record._id, { ...enroll, admissionDate: enroll.admissionDate || undefined });
            setCredentials({ student: { studentId: result.student.studentId }, credentials: result.credentials });
            setNotice(`Enrolled as ${result.student.studentId} in Class ${result.student.class}-${result.student.section}.`);
            setModal(null);
            load();
        } catch (err) {
            setFormError(errorMessage(err, 'Unable to enroll.'));
        } finally {
            setSaving(false);
        }
    };

    const rec = modal?.record;
    const asForm = (r) => ({ ...EMPTY_APP, ...r, email: r.email || '', previousSchool: r.previousSchool || '', dateOfBirth: toDateInput(r.dateOfBirth), documents: (r.documents || []).map((d) => d.name).join('\n') });

    return (
        <>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {APP_STATUSES.map((s) => (
                    <button key={s} type="button" onClick={() => setStatus(status === s ? '' : s)} className={`rounded-xl border bg-white p-3 text-left shadow-sm transition ${status === s ? 'border-brand-500 ring-1 ring-brand-500' : 'border-ink-200 hover:border-ink-300'}`}>
                        <p className="text-xs text-ink-600">{formatLabel(s)}</p>
                        <p className="mt-1 text-xl font-semibold text-ink-900">{data.counts[s] || 0}</p>
                    </button>
                ))}
            </div>
            <Card className="mb-4 flex flex-col gap-3 sm:flex-row">
                <input aria-label="Search applications" placeholder="Search name, guardian, phone, application no..." className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} />
                <Button type="button" className="shrink-0" onClick={() => open('create')}>New Application</Button>
            </Card>
            {notice && <Alert>{notice}</Alert>}
            <DataTable
                loading={loading}
                error={error}
                onRetry={load}
                rows={data.applications}
                emptyTitle="No applications"
                emptyDescription="Create an application directly or convert an enquiry."
                columns={[
                    { key: 'no', label: 'Application', render: (r) => <div><p className="font-mono text-xs text-ink-700">{r.applicationNumber}</p><p className="text-xs text-ink-500">{formatDate(r.createdAt)}</p></div> },
                    { key: 'name', label: 'Applicant', render: (r) => <div><p className="font-medium text-ink-900">{r.firstName} {r.lastName}</p><p className="text-xs text-ink-500">Class {r.classApplied} · DOB {formatDate(r.dateOfBirth)}</p></div> },
                    { key: 'guardian', label: 'Guardian', render: (r) => <div><p>{r.guardianName}</p><p className="text-xs text-ink-500">{r.phone}</p></div> },
                    { key: 'docs', label: 'Documents', render: (r) => `${(r.documents || []).filter((d) => d.verified).length}/${(r.documents || []).length} verified` },
                    { key: 'status', label: 'Status', render: (r) => <div><StatusPill value={r.status} tone={TONE[r.status]} />{r.student?.studentId && <p className="mt-1 text-xs text-ink-500">{r.student.studentId}</p>}</div> },
                    {
                        key: 'actions', label: '', className: 'text-right', render: (r) => (
                            <div className="flex flex-wrap justify-end gap-3">
                                <button type="button" className="font-medium text-brand-700" onClick={() => open('review', r)}>Review</button>
                                {r.status !== 'ENROLLED' && <button type="button" className="font-medium text-brand-700" onClick={() => open('edit', r)}>Edit</button>}
                                {r.status === 'APPROVED' && <button type="button" className="font-medium text-emerald-700" onClick={() => open('enroll', r)}>Enroll</button>}
                            </div>
                        ),
                    },
                ]}
                footer={!loading && !error && <PaginationBar pagination={data.pagination} onPage={setPage} loading={loading} />}
            />

            <Modal isOpen={modal?.mode === 'create' || modal?.mode === 'edit'} onClose={() => !saving && setModal(null)} title={modal?.mode === 'edit' ? 'Edit Application' : 'New Application'} size="max-w-2xl">
                {(modal?.mode === 'create' || modal?.mode === 'edit') && (
                    <ApplicationForm initial={modal.mode === 'edit' ? asForm(rec) : EMPTY_APP} onCancel={() => setModal(null)} onSubmit={create} saving={saving} error={formError} />
                )}
            </Modal>

            <Modal isOpen={modal?.mode === 'review'} onClose={() => !saving && setModal(null)} title={`Application ${rec?.applicationNumber || ''}`} size="max-w-lg">
                {modal?.mode === 'review' && (
                    <div className="space-y-4 text-sm">
                        {formError && <Alert tone="error">{formError}</Alert>}
                        <div className="grid grid-cols-2 gap-2 text-ink-700">
                            <p><span className="text-ink-500">Applicant:</span> {rec.firstName} {rec.lastName}</p>
                            <p><span className="text-ink-500">Class:</span> {rec.classApplied}</p>
                            <p><span className="text-ink-500">Guardian:</span> {rec.guardianName}</p>
                            <p><span className="text-ink-500">Phone:</span> {rec.phone}</p>
                            <p className="col-span-2"><span className="text-ink-500">Address:</span> {rec.address}, {rec.city}, {rec.state} {rec.postalCode}</p>
                            <p className="col-span-2"><span className="text-ink-500">Status:</span> <StatusPill value={rec.status} tone={TONE[rec.status]} /> {rec.decisionNote && <span className="text-ink-500">· {rec.decisionNote}</span>}</p>
                        </div>
                        <div>
                            <p className="mb-2 font-medium text-ink-800">Document verification</p>
                            {(rec.documents || []).length === 0 ? <p className="text-ink-500">No documents listed.</p> : (
                                <ul className="divide-y divide-ink-200 rounded-md border border-ink-200">
                                    {rec.documents.map((d) => (
                                        <li key={d._id} className="flex items-center justify-between px-3 py-2">
                                            <span>{d.name}</span>
                                            <label className="flex items-center gap-2 text-xs">
                                                <input type="checkbox" checked={d.verified} disabled={rec.status === 'ENROLLED'} onChange={() => verify(d)} />
                                                {d.verified ? 'Verified' : 'Not verified'}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {(TRANSITIONS[rec.status] || []).length > 0 && (
                            <form onSubmit={decide} className="space-y-3 rounded-md border border-ink-200 p-3">
                                <p className="font-medium text-ink-800">Decision</p>
                                <select aria-label="New status" required className={inputClass} value={decision.status} onChange={(e) => setDecision({ ...decision, status: e.target.value })}>
                                    <option value="">Change status to...</option>
                                    {TRANSITIONS[rec.status].map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                                </select>
                                <textarea aria-label="Decision note" rows={2} placeholder="Note (optional)" className={inputClass} value={decision.note} onChange={(e) => setDecision({ ...decision, note: e.target.value })} />
                                <div className="flex justify-end"><Button type="submit" disabled={saving || !decision.status}>{saving ? 'Saving...' : 'Update status'}</Button></div>
                            </form>
                        )}
                        <div className="flex justify-end"><Button type="button" variant="secondary" onClick={() => setModal(null)}>Close</Button></div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={modal?.mode === 'enroll'} onClose={() => !saving && setModal(null)} title={`Enroll ${rec?.firstName || ''} ${rec?.lastName || ''}`}>
                <form onSubmit={doEnroll} className="space-y-4">
                    {formError && <Alert tone="error">{formError}</Alert>}
                    <p className="text-sm text-ink-600">Creates the student record and login for Class {rec?.classApplied}. The application can only be enrolled once.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Section" htmlFor="enr-sec" required><input id="enr-sec" required className={inputClass} value={enroll.section} onChange={(e) => setEnroll({ ...enroll, section: e.target.value })} /></Field>
                        <Field label="Roll number" htmlFor="enr-roll" required><input id="enr-roll" required className={inputClass} value={enroll.rollNumber} onChange={(e) => setEnroll({ ...enroll, rollNumber: e.target.value })} /></Field>
                        <Field label="Admission number" htmlFor="enr-adm" required><input id="enr-adm" required className={inputClass} value={enroll.admissionNumber} onChange={(e) => setEnroll({ ...enroll, admissionNumber: e.target.value })} /></Field>
                        <Field label="Admission date" htmlFor="enr-date"><input id="enr-date" type="date" className={inputClass} value={enroll.admissionDate} onChange={(e) => setEnroll({ ...enroll, admissionDate: e.target.value })} /></Field>
                    </div>
                    {formError.includes('same name and date of birth') && (
                        <label className="flex items-center gap-2 text-sm text-amber-800"><input type="checkbox" checked={enroll.allowPossibleDuplicate} onChange={(e) => setEnroll({ ...enroll, allowPossibleDuplicate: e.target.checked })} /> I've checked — this is a different student. Enroll anyway.</label>
                    )}
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Enrolling...' : 'Enroll student'}</Button>
                    </div>
                </form>
            </Modal>
            <CredentialsModal isOpen={!!credentials} data={credentials} onDone={() => setCredentials(null)} />
        </>
    );
}

export default function AdmissionsPage() {
    const [tab, setTab] = useState('enquiries');
    const [appsKey, setAppsKey] = useState(0);
    return (
        <div className="mx-auto w-full max-w-6xl">
            <PageHeader title="Admissions" description="Enquiries and follow-ups, applications, document verification, approval and enrollment." />
            <Tabs tabs={[{ key: 'enquiries', label: 'Enquiries' }, { key: 'applications', label: 'Applications' }]} active={tab} onChange={setTab} />
            {tab === 'enquiries' ? <Enquiries onConverted={() => setAppsKey((k) => k + 1)} /> : <Applications key={appsKey} />}
        </div>
    );
}
