import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import { academicApi } from '../../services/moduleApi';
import { getTeachers } from '../../services/teacherApi';
import { getStudents } from '../../services/studentApi';
import { PageHeader, Tabs, DataTable, StatusPill, Field, Alert, inputClass, errorMessage, formatDate, formatLabel, toDateInput } from '../../components/common/ui';

// ---------------- Academic years ----------------
const EMPTY_YEAR = { name: '', startDate: '', endDate: '', terms: [] };

function AcademicYears() {
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY_YEAR);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setYears(await academicApi.listYears());
        } catch (err) {
            setError(errorMessage(err, 'Unable to load academic years.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setForm(EMPTY_YEAR); setFormError(''); setModal({ mode: 'create' }); };
    const openEdit = (y) => {
        setForm({ name: y.name, startDate: toDateInput(y.startDate), endDate: toDateInput(y.endDate), terms: (y.terms || []).map((t) => ({ name: t.name, startDate: toDateInput(t.startDate), endDate: toDateInput(t.endDate) })) });
        setFormError('');
        setModal({ mode: 'edit', record: y });
    };

    const setTerm = (index, key, value) => setForm((f) => ({ ...f, terms: f.terms.map((t, i) => (i === index ? { ...t, [key]: value } : t)) }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');
        try {
            if (modal.mode === 'create') await academicApi.createYear(form);
            else await academicApi.updateYear(modal.record._id, form);
            setNotice(`Academic year ${form.name} saved.`);
            setModal(null);
            load();
        } catch (err) {
            setFormError(errorMessage(err, 'Unable to save academic year.'));
        } finally {
            setSaving(false);
        }
    };

    const makeCurrent = async (y) => {
        try {
            await academicApi.setCurrentYear(y._id);
            setNotice(`${y.name} is now the current academic year.`);
            load();
        } catch (err) {
            setError(errorMessage(err, 'Unable to change the current year.'));
        }
    };

    const remove = async (y) => {
        if (!window.confirm(`Delete academic year ${y.name}?`)) return;
        try {
            await academicApi.deleteYear(y._id);
            setNotice(`${y.name} deleted.`);
            load();
        } catch (err) {
            setError(errorMessage(err, 'Unable to delete academic year.'));
        }
    };

    return (
        <>
            <div className="mb-4 flex justify-end"><Button type="button" onClick={openCreate}>Add Academic Year</Button></div>
            {notice && <Alert>{notice}</Alert>}
            <DataTable
                loading={loading}
                error={error}
                onRetry={load}
                rows={years}
                emptyTitle="No academic years configured"
                emptyDescription="Add the current year (e.g. 2026-2027). The first year added becomes current."
                columns={[
                    { key: 'name', label: 'Year', render: (y) => <span className="font-medium text-ink-900">{y.name}</span> },
                    { key: 'range', label: 'Duration', render: (y) => `${formatDate(y.startDate)} – ${formatDate(y.endDate)}` },
                    { key: 'terms', label: 'Terms', render: (y) => (y.terms?.length ? y.terms.map((t) => t.name).join(', ') : '—') },
                    { key: 'isCurrent', label: 'Status', render: (y) => (y.isCurrent ? <StatusPill value="CURRENT" tone="green" /> : <StatusPill value="INACTIVE" tone="gray" />) },
                    {
                        key: 'actions', label: '', className: 'text-right', render: (y) => (
                            <div className="flex justify-end gap-3">
                                {!y.isCurrent && <button type="button" className="font-medium text-emerald-700 hover:text-emerald-800" onClick={() => makeCurrent(y)}>Set current</button>}
                                <button type="button" className="font-medium text-brand-700 hover:text-brand-800" onClick={() => openEdit(y)}>Edit</button>
                                {!y.isCurrent && <button type="button" className="font-medium text-red-600 hover:text-red-700" onClick={() => remove(y)}>Delete</button>}
                            </div>
                        ),
                    },
                ]}
            />
            <Modal isOpen={!!modal} onClose={() => !saving && setModal(null)} title={modal?.mode === 'edit' ? 'Edit Academic Year' : 'Add Academic Year'}>
                <form onSubmit={submit} className="space-y-4">
                    {formError && <Alert tone="error">{formError}</Alert>}
                    <Field label="Name" htmlFor="ay-name" required hint="Format YYYY-YYYY, e.g. 2026-2027">
                        <input id="ay-name" required pattern="\d{4}-\d{4}" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Start date" htmlFor="ay-start" required><input id="ay-start" type="date" required className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
                        <Field label="End date" htmlFor="ay-end" required><input id="ay-end" type="date" required className={inputClass} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
                    </div>
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-ink-700">Terms</p>
                            <button type="button" className="text-sm font-medium text-brand-700" onClick={() => setForm((f) => ({ ...f, terms: [...f.terms, { name: '', startDate: '', endDate: '' }] }))}>+ Add term</button>
                        </div>
                        {form.terms.map((t, i) => (
                            <div key={i} className="mb-2 grid grid-cols-1 gap-2 rounded-md border border-ink-200 p-2 sm:grid-cols-[1fr_auto]">
                                <div className="grid gap-2">
                                    <input aria-label={`Term ${i + 1} name`} required placeholder="Term name" className={inputClass} value={t.name} onChange={(e) => setTerm(i, 'name', e.target.value)} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input aria-label={`Term ${i + 1} start`} type="date" required className={inputClass} value={t.startDate} onChange={(e) => setTerm(i, 'startDate', e.target.value)} />
                                        <input aria-label={`Term ${i + 1} end`} type="date" required className={inputClass} value={t.endDate} onChange={(e) => setTerm(i, 'endDate', e.target.value)} />
                                    </div>
                                </div>
                                <button type="button" className="self-start text-sm font-medium text-red-600" onClick={() => setForm((f) => ({ ...f, terms: f.terms.filter((_, j) => j !== i) }))}>Remove</button>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

// ---------------- Classes & sections ----------------
const EMPTY_CLASS = { className: '', section: '', classTeacher: '', capacity: 40, room: '', status: 'ACTIVE' };

function ClassSections() {
    const [rows, setRows] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY_CLASS);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [list, teacherData] = await Promise.all([academicApi.listClassSections(), getTeachers({ limit: 100 })]);
            setRows(list);
            setTeachers(teacherData?.teachers || []);
        } catch (err) {
            setError(errorMessage(err, 'Unable to load classes.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setForm(EMPTY_CLASS); setFormError(''); setModal({ mode: 'create' }); };
    const openEdit = (r) => { setForm({ ...EMPTY_CLASS, ...r, classTeacher: r.classTeacher?._id || '' }); setFormError(''); setModal({ mode: 'edit', record: r }); };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');
        const body = { className: form.className, section: form.section, classTeacher: form.classTeacher || null, capacity: Number(form.capacity), room: form.room, status: form.status };
        try {
            if (modal.mode === 'create') await academicApi.createClassSection(body);
            else await academicApi.updateClassSection(modal.record._id, body);
            setNotice(`Class ${body.className}-${body.section.toUpperCase()} saved.`);
            setModal(null);
            load();
        } catch (err) {
            setFormError(errorMessage(err, 'Unable to save class.'));
        } finally {
            setSaving(false);
        }
    };

    const importExisting = async () => {
        try {
            const result = await academicApi.importClassSections();
            setNotice(`${result?.created ?? 0} class/section(s) imported from existing student records.`);
            load();
        } catch (err) {
            setError(errorMessage(err, 'Unable to import classes.'));
        }
    };

    const remove = async (r) => {
        if (!window.confirm(`Delete class ${r.className}-${r.section}?`)) return;
        try {
            await academicApi.deleteClassSection(r._id);
            setNotice(`Class ${r.className}-${r.section} deleted.`);
            load();
        } catch (err) {
            setError(errorMessage(err, 'Unable to delete class.'));
        }
    };

    return (
        <>
            <div className="mb-4 flex flex-wrap justify-end gap-3">
                <Button type="button" variant="secondary" onClick={importExisting}>Import from student records</Button>
                <Button type="button" onClick={openCreate}>Add Class / Section</Button>
            </div>
            {notice && <Alert>{notice}</Alert>}
            <DataTable
                loading={loading}
                error={error}
                onRetry={load}
                rows={rows}
                emptyTitle="No classes configured"
                emptyDescription="Add classes manually or import the class/section pairs already used by your students."
                columns={[
                    { key: 'cls', label: 'Class', render: (r) => <span className="font-medium text-ink-900">{r.className}-{r.section}</span> },
                    { key: 'teacher', label: 'Class teacher', render: (r) => (r.classTeacher ? `${r.classTeacher.firstName} ${r.classTeacher.lastName}` : '—') },
                    { key: 'strength', label: 'Strength', render: (r) => <span className={r.studentCount > r.capacity ? 'font-semibold text-red-600' : ''}>{r.studentCount} / {r.capacity}</span> },
                    { key: 'room', label: 'Room', render: (r) => r.room || '—' },
                    { key: 'status', label: 'Status', render: (r) => <StatusPill value={r.status} tone={r.status === 'ACTIVE' ? 'green' : 'gray'} /> },
                    {
                        key: 'actions', label: '', className: 'text-right', render: (r) => (
                            <div className="flex justify-end gap-3">
                                <button type="button" className="font-medium text-brand-700 hover:text-brand-800" onClick={() => openEdit(r)}>Edit</button>
                                <button type="button" className="font-medium text-red-600 hover:text-red-700" onClick={() => remove(r)}>Delete</button>
                            </div>
                        ),
                    },
                ]}
            />
            <Modal isOpen={!!modal} onClose={() => !saving && setModal(null)} title={modal?.mode === 'edit' ? 'Edit Class / Section' : 'Add Class / Section'}>
                <form onSubmit={submit} className="space-y-4">
                    {formError && <Alert tone="error">{formError}</Alert>}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Class" htmlFor="cs-class" required><input id="cs-class" required className={inputClass} value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} /></Field>
                        <Field label="Section" htmlFor="cs-section" required><input id="cs-section" required className={inputClass} value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /></Field>
                        <Field label="Capacity" htmlFor="cs-cap" required><input id="cs-cap" type="number" min="1" required className={inputClass} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
                        <Field label="Room" htmlFor="cs-room"><input id="cs-room" className={inputClass} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></Field>
                    </div>
                    <Field label="Class teacher" htmlFor="cs-teacher">
                        <select id="cs-teacher" className={inputClass} value={form.classTeacher} onChange={(e) => setForm({ ...form, classTeacher: e.target.value })}>
                            <option value="">Not assigned</option>
                            {teachers.map((t) => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}
                        </select>
                    </Field>
                    <Field label="Status" htmlFor="cs-status">
                        <select id="cs-status" className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </Field>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

// ---------------- Promotion & lifecycle ----------------
function Promotion() {
    const [classes, setClasses] = useState([]);
    const [source, setSource] = useState('');
    const [students, setStudents] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [action, setAction] = useState('PROMOTE');
    const [target, setTarget] = useState({ toClass: '', toSection: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        academicApi.listClassSections().then(setClasses).catch((err) => setError(errorMessage(err, 'Unable to load classes.')));
    }, []);

    const [fromClass, fromSection] = useMemo(() => (source ? source.split('|') : ['', '']), [source]);

    const loadStudents = useCallback(async () => {
        if (!fromClass) { setStudents([]); return; }
        setLoading(true);
        setError('');
        try {
            const data = await getStudents({ class: fromClass, section: fromSection, status: 'ACTIVE', limit: 100 });
            const list = (data?.students || []).sort((a, b) => String(a.rollNumber).localeCompare(String(b.rollNumber), undefined, { numeric: true }));
            setStudents(list);
            setSelected(new Set(list.map((s) => s._id)));
        } catch (err) {
            setError(errorMessage(err, 'Unable to load students.'));
        } finally {
            setLoading(false);
        }
    }, [fromClass, fromSection]);

    useEffect(() => { loadStudents(); }, [loadStudents]);

    const toggle = (id) => setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

    const run = async () => {
        const verb = action === 'PROMOTE' ? `promote to ${target.toClass}-${(target.toSection || fromSection).toUpperCase()}` : 'mark as graduated (their logins will be deactivated)';
        if (!window.confirm(`${selected.size} student(s) will ${verb}. Continue?`)) return;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const body = { fromClass, fromSection, action, studentIds: [...selected] };
            if (action === 'PROMOTE') { body.toClass = target.toClass; body.toSection = target.toSection || fromSection; }
            const result = await academicApi.promoteStudents(body);
            setNotice(`${result?.data?.affected ?? selected.size} student(s) ${action === 'PROMOTE' ? 'promoted' : 'graduated'}.`);
            loadStudents();
        } catch (err) {
            setError(errorMessage(err, 'Unable to complete the operation.'));
        } finally {
            setBusy(false);
        }
    };

    const changeStatus = async (student, status) => {
        if (!status || !window.confirm(`Mark ${student.firstName} ${student.lastName} as ${formatLabel(status)}? Only active students keep login access.`)) return;
        try {
            await academicApi.setStudentStatus(student._id, status);
            setNotice(`${student.firstName} ${student.lastName} marked ${formatLabel(status)}.`);
            loadStudents();
        } catch (err) {
            setError(errorMessage(err, 'Unable to change student status.'));
        }
    };

    const canRun = selected.size > 0 && fromClass && (action === 'GRADUATE' || target.toClass);

    return (
        <>
            <Card className="mb-4 grid gap-4 md:grid-cols-4">
                <Field label="From class" htmlFor="pr-from" required>
                    <select id="pr-from" className={inputClass} value={source} onChange={(e) => setSource(e.target.value)}>
                        <option value="">Select class...</option>
                        {classes.map((c) => <option key={c._id} value={`${c.className}|${c.section}`}>{c.className}-{c.section} ({c.studentCount})</option>)}
                    </select>
                </Field>
                <Field label="Action" htmlFor="pr-action">
                    <select id="pr-action" className={inputClass} value={action} onChange={(e) => setAction(e.target.value)}>
                        <option value="PROMOTE">Promote to next class</option>
                        <option value="GRADUATE">Graduate (final year)</option>
                    </select>
                </Field>
                {action === 'PROMOTE' && (
                    <>
                        <Field label="To class" htmlFor="pr-to" required><input id="pr-to" className={inputClass} value={target.toClass} onChange={(e) => setTarget({ ...target, toClass: e.target.value })} /></Field>
                        <Field label="To section" htmlFor="pr-tosec" hint="Blank keeps the current section"><input id="pr-tosec" className={inputClass} value={target.toSection} onChange={(e) => setTarget({ ...target, toSection: e.target.value })} /></Field>
                    </>
                )}
                <div className="flex items-end md:col-span-4 md:justify-end">
                    <Button type="button" onClick={run} disabled={!canRun || busy}>{busy ? 'Working...' : `${action === 'PROMOTE' ? 'Promote' : 'Graduate'} ${selected.size} student(s)`}</Button>
                </div>
            </Card>
            {notice && <Alert>{notice}</Alert>}
            {error && <Alert tone="error">{error}</Alert>}
            <DataTable
                loading={loading}
                rows={students}
                emptyTitle={fromClass ? 'No active students in this class' : 'Select a class'}
                emptyDescription={fromClass ? '' : 'Choose a source class to promote, graduate, transfer or withdraw students.'}
                columns={[
                    { key: 'sel', label: <input type="checkbox" aria-label="Select all" checked={students.length > 0 && selected.size === students.length} onChange={(e) => setSelected(e.target.checked ? new Set(students.map((s) => s._id)) : new Set())} />, render: (s) => <input type="checkbox" aria-label={`Select ${s.firstName}`} checked={selected.has(s._id)} onChange={() => toggle(s._id)} /> },
                    { key: 'rollNumber', label: 'Roll' },
                    { key: 'name', label: 'Student', render: (s) => <div><p className="font-medium text-ink-900">{s.firstName} {s.lastName}</p><p className="text-xs text-ink-500">{s.studentId}</p></div> },
                    {
                        key: 'lifecycle', label: 'Transfer / withdraw', render: (s) => (
                            <select aria-label={`Change status of ${s.firstName}`} className={`${inputClass} min-w-[150px]`} value="" onChange={(e) => changeStatus(s, e.target.value)}>
                                <option value="">Change status...</option>
                                <option value="TRANSFERRED">Transferred</option>
                                <option value="INACTIVE">Withdrawn / inactive</option>
                            </select>
                        ),
                    },
                ]}
            />
        </>
    );
}

export default function AcademicSetupPage() {
    const [tab, setTab] = useState('years');
    return (
        <div className="mx-auto w-full max-w-6xl">
            <PageHeader title="Academic Setup" description="Academic years and terms, class & section configuration, and year-end promotion." />
            <Tabs tabs={[{ key: 'years', label: 'Academic Years' }, { key: 'classes', label: 'Classes & Sections' }, { key: 'promotion', label: 'Promotion & Status' }]} active={tab} onChange={setTab} />
            {tab === 'years' && <AcademicYears />}
            {tab === 'classes' && <ClassSections />}
            {tab === 'promotion' && <Promotion />}
        </div>
    );
}
