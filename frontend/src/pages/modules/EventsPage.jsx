import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import { eventsApi } from '../../services/moduleApi';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader, DataTable, PaginationBar, StatusPill, Field, Alert, inputClass, errorMessage, formatDate, formatLabel, toDateInput } from '../../components/common/ui';

const TYPES = ['ACADEMIC', 'SPORTS', 'CULTURAL', 'MEETING', 'HOLIDAY', 'EXAMINATION', 'WORKSHOP', 'OTHER'];
const AUDIENCES = ['ALL', 'STUDENTS', 'TEACHERS', 'PARENTS'];
const STATUSES = ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'];
const STATUS_TONE = { DRAFT: 'gray', PUBLISHED: 'green', CANCELLED: 'red', COMPLETED: 'blue' };
const EMPTY = { title: '', description: '', eventDate: '', startTime: '', endTime: '', location: '', eventType: 'ACADEMIC', targetAudience: 'ALL', applicableClasses: '', section: '', status: 'DRAFT' };

export default function EventsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [filters, setFilters] = useState({ search: '', eventType: '', status: '', when: 'upcoming' });
    const [debounced, setDebounced] = useState(filters);
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ events: [], pagination: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { const t = setTimeout(() => { setPage(1); setDebounced(filters); }, 300); return () => clearTimeout(t); }, [filters]);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = { page, limit: 10, search: debounced.search || undefined, eventType: debounced.eventType || undefined, status: debounced.status || undefined };
            const today = new Date(); today.setHours(0, 0, 0, 0);
            if (debounced.when === 'upcoming') params.startDate = today.toISOString();
            if (debounced.when === 'past') params.endDate = today.toISOString();
            const result = await eventsApi.list(params);
            const p = result?.pagination;
            setData({ events: result?.events || [], pagination: p ? { ...p, totalPages: p.totalPages ?? p.pages } : null });
        } catch (err) {
            setError(errorMessage(err, 'Unable to load events.'));
        } finally {
            setLoading(false);
        }
    }, [page, debounced]);

    useEffect(() => { load(); }, [load]);

    const openEdit = (ev) => {
        setForm({ ...EMPTY, ...ev, eventDate: toDateInput(ev.eventDate), startTime: ev.startTime || '', endTime: ev.endTime || '', applicableClasses: (ev.applicableClasses || []).join(', '), section: ev.section || '' });
        setFormError('');
        setModal({ mode: 'edit', record: ev });
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');
        const body = {
            title: form.title, description: form.description, eventDate: form.eventDate, startTime: form.startTime || undefined, endTime: form.endTime || undefined,
            location: form.location, eventType: form.eventType, targetAudience: form.targetAudience, status: form.status, section: form.section,
            applicableClasses: form.applicableClasses.split(',').map((c) => c.trim()).filter(Boolean),
        };
        try {
            if (modal.mode === 'create') await eventsApi.create(body);
            else await eventsApi.update(modal.record._id, body);
            setNotice(`Event "${form.title}" saved.`);
            setModal(null);
            load();
        } catch (err) {
            setFormError(errorMessage(err, 'Unable to save event.'));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (ev) => {
        if (!window.confirm(`Delete event "${ev.title}"?`)) return;
        try { await eventsApi.remove(ev._id); setNotice('Event deleted.'); load(); } catch (err) { setError(errorMessage(err, 'Unable to delete event.')); }
    };

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const columns = [
        { key: 'date', label: 'Date', render: (ev) => <div><p className="font-medium text-ink-900">{formatDate(ev.eventDate)}</p>{(ev.startTime || ev.endTime) && <p className="text-xs text-ink-500">{ev.startTime}{ev.endTime ? `–${ev.endTime}` : ''}</p>}</div> },
        { key: 'title', label: 'Event', render: (ev) => <div><p className="font-medium text-ink-900">{ev.title}</p>{ev.description && <p className="line-clamp-2 max-w-md text-xs text-ink-500">{ev.description}</p>}</div> },
        { key: 'type', label: 'Type', render: (ev) => formatLabel(ev.eventType) },
        { key: 'location', label: 'Location', render: (ev) => ev.location || '—' },
        { key: 'audience', label: 'For', render: (ev) => `${formatLabel(ev.targetAudience)}${ev.applicableClasses?.length ? ` · Class ${ev.applicableClasses.join(', ')}` : ''}` },
        { key: 'status', label: 'Status', render: (ev) => <StatusPill value={ev.status} tone={STATUS_TONE[ev.status]} /> },
    ];
    if (isAdmin) {
        columns.push({
            key: 'actions', label: '', className: 'text-right', render: (ev) => (
                <div className="flex justify-end gap-3">
                    <button type="button" className="font-medium text-brand-700" onClick={() => openEdit(ev)}>Edit</button>
                    <button type="button" className="font-medium text-red-600" onClick={() => remove(ev)}>Delete</button>
                </div>
            ),
        });
    }

    return (
        <div className="mx-auto w-full max-w-6xl">
            <PageHeader
                eyebrow={isAdmin ? 'Admin module' : 'School calendar'}
                title="Events & Calendar"
                description={isAdmin ? 'Plan school events. Only published events are visible to their audience.' : 'Upcoming school events, holidays and meetings.'}
                actions={isAdmin && <Button type="button" onClick={() => { setForm(EMPTY); setFormError(''); setModal({ mode: 'create' }); }}>Add Event</Button>}
            />
            {notice && <Alert>{notice}</Alert>}
            <Card className="mb-4 flex flex-col gap-3 lg:flex-row">
                <input aria-label="Search events" placeholder="Search title or location..." className={inputClass} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                <select aria-label="When" className={`${inputClass} lg:w-40`} value={filters.when} onChange={(e) => setFilters({ ...filters, when: e.target.value })}>
                    <option value="upcoming">Upcoming</option><option value="past">Past</option><option value="">All dates</option>
                </select>
                <select aria-label="Event type" className={`${inputClass} lg:w-44`} value={filters.eventType} onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}>
                    <option value="">All types</option>{TYPES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}
                </select>
                {isAdmin && (
                    <select aria-label="Status" className={`${inputClass} lg:w-40`} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                        <option value="">All statuses</option>{STATUSES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}
                    </select>
                )}
            </Card>
            <DataTable
                loading={loading}
                error={error}
                onRetry={load}
                rows={data.events}
                emptyTitle="No events found"
                emptyDescription={filters.when === 'upcoming' ? 'Nothing scheduled yet.' : ''}
                columns={columns}
                footer={!loading && !error && <PaginationBar pagination={data.pagination} onPage={setPage} loading={loading} />}
            />
            <Modal isOpen={!!modal} onClose={() => !saving && setModal(null)} title={modal?.mode === 'edit' ? 'Edit Event' : 'Add Event'} size="max-w-lg">
                <form onSubmit={submit} className="space-y-4">
                    {formError && <Alert tone="error">{formError}</Alert>}
                    <Field label="Title" htmlFor="ev-title" required><input id="ev-title" required maxLength={255} className={inputClass} value={form.title} onChange={set('title')} /></Field>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Date" htmlFor="ev-date" required><input id="ev-date" type="date" required className={inputClass} value={form.eventDate} onChange={set('eventDate')} /></Field>
                        <Field label="Start" htmlFor="ev-start"><input id="ev-start" type="time" className={inputClass} value={form.startTime} onChange={set('startTime')} /></Field>
                        <Field label="End" htmlFor="ev-end"><input id="ev-end" type="time" className={inputClass} value={form.endTime} onChange={set('endTime')} /></Field>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Type" htmlFor="ev-type"><select id="ev-type" className={inputClass} value={form.eventType} onChange={set('eventType')}>{TYPES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}</select></Field>
                        <Field label="Audience" htmlFor="ev-aud"><select id="ev-aud" className={inputClass} value={form.targetAudience} onChange={set('targetAudience')}>{AUDIENCES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}</select></Field>
                        <Field label="Classes" htmlFor="ev-classes" hint="Comma separated; blank for all"><input id="ev-classes" className={inputClass} value={form.applicableClasses} onChange={set('applicableClasses')} /></Field>
                        <Field label="Section" htmlFor="ev-section"><input id="ev-section" className={inputClass} value={form.section} onChange={set('section')} /></Field>
                        <Field label="Location" htmlFor="ev-loc"><input id="ev-loc" className={inputClass} value={form.location} onChange={set('location')} /></Field>
                        <Field label="Status" htmlFor="ev-status"><select id="ev-status" className={inputClass} value={form.status} onChange={set('status')}>{STATUSES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}</select></Field>
                    </div>
                    <Field label="Description" htmlFor="ev-desc"><textarea id="ev-desc" rows={3} className={inputClass} value={form.description} onChange={set('description')} /></Field>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
