import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import StudentPicker from '../../components/common/StudentPicker';
import { hostelApi } from '../../services/moduleApi';
import { PageHeader, Tabs, DataTable, StatusPill, StatCard, Field, Alert, LoadingState, ErrorState, inputClass, errorMessage, formatDate, formatLabel, formatCurrency, downloadCsv } from '../../components/common/ui';

const ROOM_TYPES = ['BOYS', 'GIRLS', 'STAFF', 'MIXED'];
const ROOM_STATUSES = ['AVAILABLE', 'MAINTENANCE', 'CLOSED'];
const EMPTY_ROOM = { block: '', roomNumber: '', type: 'BOYS', capacity: 2, feePerTerm: 0, status: 'AVAILABLE', notes: '' };

function Rooms() {
    const [filters, setFilters] = useState({ search: '', type: '', status: '' });
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY_ROOM);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
            setRooms(await hostelApi.listRooms(params));
        } catch (err) {
            setError(errorMessage(err, 'Unable to load rooms.'));
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');
        const body = { block: form.block, roomNumber: form.roomNumber, type: form.type, capacity: Number(form.capacity), feePerTerm: Number(form.feePerTerm), status: form.status, notes: form.notes };
        try {
            if (modal.mode === 'create') await hostelApi.createRoom(body);
            else await hostelApi.updateRoom(modal.record._id, body);
            setNotice(`Room ${body.block} / ${body.roomNumber} saved.`);
            setModal(null);
            load();
        } catch (err) {
            setFormError(errorMessage(err, 'Unable to save room.'));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (r) => {
        if (!window.confirm(`Delete room ${r.block} / ${r.roomNumber}?`)) return;
        try { await hostelApi.deleteRoom(r._id); setNotice('Room deleted.'); load(); } catch (err) { setError(errorMessage(err, 'Unable to delete room.')); }
    };

    return (
        <>
            <Card className="mb-4 flex flex-col gap-3 lg:flex-row">
                <input aria-label="Search rooms" placeholder="Search block or room number..." className={inputClass} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                <select aria-label="Room type" className={`${inputClass} lg:w-40`} value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                    <option value="">All types</option>{ROOM_TYPES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}
                </select>
                <select aria-label="Room status" className={`${inputClass} lg:w-44`} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                    <option value="">All statuses</option>{ROOM_STATUSES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}
                </select>
                <Button type="button" className="shrink-0" onClick={() => { setForm(EMPTY_ROOM); setFormError(''); setModal({ mode: 'create' }); }}>Add Room</Button>
            </Card>
            {notice && <Alert>{notice}</Alert>}
            <DataTable
                loading={loading}
                error={error}
                onRetry={load}
                rows={rooms}
                emptyTitle="No hostel rooms"
                emptyDescription="Add blocks and rooms with their bed capacity."
                columns={[
                    { key: 'room', label: 'Room', render: (r) => <div><p className="font-medium text-ink-900">{r.block} / {r.roomNumber}</p><p className="text-xs text-ink-500">{formatLabel(r.type)}</p></div> },
                    { key: 'beds', label: 'Occupancy', render: (r) => <span className={r.available === 0 ? 'font-semibold text-amber-700' : ''}>{r.occupied} / {r.capacity}</span> },
                    { key: 'available', label: 'Free beds' },
                    { key: 'feePerTerm', label: 'Fee / term', render: (r) => formatCurrency(r.feePerTerm) },
                    { key: 'status', label: 'Status', render: (r) => <StatusPill value={r.status} tone={r.status === 'AVAILABLE' ? 'green' : r.status === 'MAINTENANCE' ? 'amber' : 'gray'} /> },
                    {
                        key: 'actions', label: '', className: 'text-right', render: (r) => (
                            <div className="flex justify-end gap-3">
                                <button type="button" className="font-medium text-brand-700" onClick={() => { setForm({ ...EMPTY_ROOM, ...r }); setFormError(''); setModal({ mode: 'edit', record: r }); }}>Edit</button>
                                <button type="button" className="font-medium text-red-600" onClick={() => remove(r)}>Delete</button>
                            </div>
                        ),
                    },
                ]}
            />
            <Modal isOpen={!!modal} onClose={() => !saving && setModal(null)} title={modal?.mode === 'edit' ? 'Edit Room' : 'Add Room'}>
                <form onSubmit={submit} className="space-y-4">
                    {formError && <Alert tone="error">{formError}</Alert>}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Hostel / block" htmlFor="hr-block" required><input id="hr-block" required className={inputClass} value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} /></Field>
                        <Field label="Room number" htmlFor="hr-no" required><input id="hr-no" required className={inputClass} value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} /></Field>
                        <Field label="Type" htmlFor="hr-type"><select id="hr-type" className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{ROOM_TYPES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}</select></Field>
                        <Field label="Beds (capacity)" htmlFor="hr-cap" required><input id="hr-cap" type="number" min="1" required className={inputClass} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
                        <Field label="Fee per term" htmlFor="hr-fee"><input id="hr-fee" type="number" min="0" className={inputClass} value={form.feePerTerm} onChange={(e) => setForm({ ...form, feePerTerm: e.target.value })} /></Field>
                        <Field label="Status" htmlFor="hr-status"><select id="hr-status" className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{ROOM_STATUSES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}</select></Field>
                    </div>
                    <Field label="Notes" htmlFor="hr-notes"><input id="hr-notes" className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

function Allocations() {
    const [status, setStatus] = useState('ACTIVE');
    const [rows, setRows] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ room: '', student: '', studentObj: null, bedNumber: '', startDate: '', notes: '' });
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [list, roomList] = await Promise.all([hostelApi.listAllocations({ status: status || undefined }), hostelApi.listRooms({ status: 'AVAILABLE' })]);
            setRows(list);
            setRooms(roomList);
        } catch (err) {
            setError(errorMessage(err, 'Unable to load allocations.'));
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => { load(); }, [load]);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.student) { setFormError('Select a student.'); return; }
        setSaving(true);
        setFormError('');
        try {
            await hostelApi.allocate({ room: form.room, student: form.student, bedNumber: form.bedNumber, startDate: form.startDate || undefined, notes: form.notes });
            setNotice('Bed allocated.');
            setOpen(false);
            load();
        } catch (err) {
            setFormError(errorMessage(err, 'Unable to allocate.'));
        } finally {
            setSaving(false);
        }
    };

    const vacate = async (a) => {
        if (!window.confirm(`Vacate ${a.student?.firstName} ${a.student?.lastName} from ${a.room?.block} / ${a.room?.roomNumber}?`)) return;
        try { await hostelApi.vacate(a._id); setNotice('Allocation vacated.'); load(); } catch (err) { setError(errorMessage(err, 'Unable to vacate.')); }
    };

    return (
        <>
            <Card className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <select aria-label="Allocation status" className={`${inputClass} sm:w-48`} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="ACTIVE">Current residents</option><option value="VACATED">Vacated</option><option value="">All</option>
                </select>
                <Button type="button" onClick={() => { setForm({ room: '', student: '', studentObj: null, bedNumber: '', startDate: '', notes: '' }); setFormError(''); setOpen(true); }}>Allocate Bed</Button>
            </Card>
            {notice && <Alert>{notice}</Alert>}
            <DataTable
                loading={loading}
                error={error}
                onRetry={load}
                rows={rows}
                emptyTitle="No allocations"
                columns={[
                    { key: 'student', label: 'Student', render: (a) => (a.student ? <div><p className="font-medium text-ink-900">{a.student.firstName} {a.student.lastName}</p><p className="text-xs text-ink-500">{a.student.studentId} · Class {a.student.class}-{a.student.section}</p></div> : '—') },
                    { key: 'room', label: 'Room / bed', render: (a) => `${a.room?.block || '?'} / ${a.room?.roomNumber || '?'}${a.bedNumber ? ` · Bed ${a.bedNumber}` : ''}` },
                    { key: 'dates', label: 'Period', render: (a) => `${formatDate(a.startDate)}${a.endDate ? ` – ${formatDate(a.endDate)}` : ''}` },
                    { key: 'status', label: 'Status', render: (a) => <StatusPill value={a.status} tone={a.status === 'ACTIVE' ? 'green' : 'gray'} /> },
                    { key: 'actions', label: '', className: 'text-right', render: (a) => (a.status === 'ACTIVE' ? <button type="button" className="font-medium text-red-600" onClick={() => vacate(a)}>Vacate</button> : null) },
                ]}
            />
            <Modal isOpen={open} onClose={() => !saving && setOpen(false)} title="Allocate Hostel Bed">
                <form onSubmit={submit} className="space-y-4">
                    {formError && <Alert tone="error">{formError}</Alert>}
                    <Field label="Student" htmlFor="ha-student" required>
                        <StudentPicker id="ha-student" value={form.student} selected={form.studentObj} onChange={(id, obj) => setForm((f) => ({ ...f, student: id, studentObj: obj }))} />
                    </Field>
                    <Field label="Room" htmlFor="ha-room" required>
                        <select id="ha-room" required className={inputClass} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}>
                            <option value="">Select room...</option>
                            {rooms.map((r) => <option key={r._id} value={r._id} disabled={r.available === 0}>{r.block} / {r.roomNumber} ({formatLabel(r.type)}) — {r.available} free</option>)}
                        </select>
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Bed number" htmlFor="ha-bed"><input id="ha-bed" className={inputClass} value={form.bedNumber} onChange={(e) => setForm({ ...form, bedNumber: e.target.value })} /></Field>
                        <Field label="Start date" htmlFor="ha-start"><input id="ha-start" type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Allocate'}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

function Occupancy() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try { setData(await hostelApi.report()); } catch (err) { setError(errorMessage(err, 'Unable to load report.')); } finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);
    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} onRetry={load} />;
    const t = data.totals;
    return (
        <>
            <div className="mb-4 grid gap-3 sm:grid-cols-4">
                <StatCard label="Rooms" value={t.rooms} />
                <StatCard label="Beds" value={t.capacity} />
                <StatCard label="Occupied" value={t.occupied} />
                <StatCard label="Occupancy" value={t.capacity ? `${Math.round((t.occupied / t.capacity) * 1000) / 10}%` : '—'} />
            </div>
            <div className="mb-3 flex justify-end">
                <Button type="button" variant="secondary" disabled={!data.blocks.length} onClick={() => downloadCsv('hostel-occupancy.csv', [{ label: 'Block', key: 'block' }, { label: 'Rooms', key: 'rooms' }, { label: 'Beds', key: 'capacity' }, { label: 'Occupied', key: 'occupied' }, { label: 'Occupancy %', key: 'occupancyRate' }], data.blocks)}>Export CSV</Button>
            </div>
            <DataTable
                rows={data.blocks}
                rowKey="block"
                emptyTitle="No rooms configured"
                columns={[
                    { key: 'block', label: 'Block' },
                    { key: 'rooms', label: 'Rooms' },
                    { key: 'capacity', label: 'Beds' },
                    { key: 'occupied', label: 'Occupied' },
                    { key: 'occupancyRate', label: 'Occupancy', render: (b) => (b.occupancyRate === null ? '—' : `${b.occupancyRate}%`) },
                ]}
            />
        </>
    );
}

export default function HostelPage() {
    const [tab, setTab] = useState('rooms');
    return (
        <div className="mx-auto w-full max-w-6xl">
            <PageHeader title="Hostel" description="Blocks, rooms and beds, student allocations and occupancy." />
            <Tabs tabs={[{ key: 'rooms', label: 'Rooms' }, { key: 'allocations', label: 'Allocations' }, { key: 'report', label: 'Occupancy Report' }]} active={tab} onChange={setTab} />
            {tab === 'rooms' && <Rooms />}
            {tab === 'allocations' && <Allocations />}
            {tab === 'report' && <Occupancy />}
        </div>
    );
}
