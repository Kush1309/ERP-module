import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { staffAttendanceApi } from '../../services/moduleApi';
import { PageHeader, Tabs, DataTable, Alert, LoadingState, ErrorState, EmptyState, inputClass, errorMessage, formatLabel, localToday, downloadCsv } from '../../components/common/ui';

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'];

function DailyMarking() {
    const [date, setDate] = useState(localToday());
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState('');
    const [saveError, setSaveError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        setNotice('');
        try {
            const data = await staffAttendanceApi.roster(date);
            setRows((data?.staff || []).map((s) => ({ ...s, status: s.status || '', remarks: s.remarks || '' })));
        } catch (err) {
            setError(errorMessage(err, 'Unable to load the staff roster.'));
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => { load(); }, [load]);

    const update = (userId, key, value) => setRows((list) => list.map((r) => (r.userId === userId ? { ...r, [key]: value } : r)));
    const markAll = (status) => setRows((list) => list.map((r) => ({ ...r, status })));
    const marked = rows.filter((r) => r.status);

    const save = async () => {
        setSaving(true);
        setSaveError('');
        setNotice('');
        try {
            const data = await staffAttendanceApi.save({ date, records: marked.map((r) => ({ user: r.userId, status: r.status, remarks: r.remarks })) });
            setRows((data?.staff || []).map((s) => ({ ...s, status: s.status || '', remarks: s.remarks || '' })));
            setNotice(`Attendance saved for ${marked.length} staff member(s).`);
        } catch (err) {
            setSaveError(errorMessage(err, 'Unable to save attendance.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Card className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <label htmlFor="sa-date" className="mb-1 block text-sm font-medium text-ink-700">Date</label>
                    <input id="sa-date" type="date" max={localToday()} className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => markAll('PRESENT')} disabled={!rows.length}>Mark all present</Button>
                    <Button type="button" onClick={save} disabled={saving || !marked.length}>{saving ? 'Saving...' : `Save (${marked.length}/${rows.length})`}</Button>
                </div>
            </Card>
            {notice && <Alert>{notice}</Alert>}
            {saveError && <Alert tone="error">{saveError}</Alert>}
            <DataTable
                loading={loading}
                error={error}
                onRetry={load}
                rows={rows}
                rowKey="userId"
                emptyTitle="No active staff"
                emptyDescription="Teachers, accountants and librarians with active logins appear here."
                columns={[
                    { key: 'name', label: 'Staff member', render: (r) => <div><p className="font-medium text-ink-900">{r.name}</p><p className="text-xs text-ink-500">{r.loginId} · {r.detail}</p></div> },
                    { key: 'role', label: 'Role', render: (r) => formatLabel(r.role) },
                    {
                        key: 'status', label: 'Status', render: (r) => (
                            <select aria-label={`Status for ${r.name}`} className={`${inputClass} min-w-[140px]`} value={r.status} onChange={(e) => update(r.userId, 'status', e.target.value)}>
                                <option value="">Not marked</option>
                                {STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                            </select>
                        ),
                    },
                    { key: 'remarks', label: 'Remarks', render: (r) => <input aria-label={`Remarks for ${r.name}`} maxLength={300} className={`${inputClass} min-w-[180px]`} value={r.remarks} onChange={(e) => update(r.userId, 'remarks', e.target.value)} /> },
                ]}
            />
        </>
    );
}

function MonthlySummary() {
    const [month, setMonth] = useState(localToday().slice(0, 7));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setData(await staffAttendanceApi.summary(month));
        } catch (err) {
            setError(errorMessage(err, 'Unable to load the summary.'));
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => { load(); }, [load]);

    const rows = data?.staff || [];
    const exportCsv = () => downloadCsv(`staff-attendance-${month}.csv`, [
        { label: 'Name', key: 'name' }, { label: 'Login ID', key: 'loginId' }, { label: 'Role', key: 'role' },
        ...STATUSES.map((s) => ({ label: formatLabel(s), key: s })),
        { label: 'Days recorded', key: 'total' }, { label: 'Attendance %', key: 'percentage' },
    ], rows);

    return (
        <>
            <Card className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <label htmlFor="sa-month" className="mb-1 block text-sm font-medium text-ink-700">Month</label>
                    <input id="sa-month" type="month" className={inputClass} value={month} onChange={(e) => setMonth(e.target.value)} />
                </div>
                <Button type="button" variant="secondary" onClick={exportCsv} disabled={!rows.length}>Export CSV</Button>
            </Card>
            <p className="mb-3 text-xs text-ink-500">Late counts as attended; half day counts as half.</p>
            <DataTable
                loading={loading}
                error={error}
                onRetry={load}
                rows={rows}
                rowKey="userId"
                emptyTitle="No staff found"
                columns={[
                    { key: 'name', label: 'Staff member', render: (r) => <div><p className="font-medium text-ink-900">{r.name}</p><p className="text-xs text-ink-500">{formatLabel(r.role)}</p></div> },
                    ...STATUSES.map((s) => ({ key: s, label: formatLabel(s) })),
                    { key: 'total', label: 'Days' },
                    { key: 'percentage', label: 'Attendance', render: (r) => (r.percentage === null ? '—' : `${r.percentage}%`) },
                ]}
            />
        </>
    );
}

export default function StaffAttendancePage() {
    const [tab, setTab] = useState('daily');
    return (
        <div className="mx-auto w-full max-w-6xl">
            <PageHeader title="Staff Attendance" description="Daily attendance for teachers and non-teaching staff, with monthly summaries." />
            <Tabs tabs={[{ key: 'daily', label: 'Daily Marking' }, { key: 'summary', label: 'Monthly Summary' }]} active={tab} onChange={setTab} />
            {tab === 'daily' ? <DailyMarking /> : <MonthlySummary />}
        </div>
    );
}

export function MyAttendancePage() {
    const [month, setMonth] = useState(localToday().slice(0, 7));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setData(await staffAttendanceApi.mine(month));
        } catch (err) {
            setError(errorMessage(err, 'Unable to load your attendance.'));
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => { load(); }, [load]);
    const summary = data?.summary;
    const cards = useMemo(() => (summary ? [
        ['Attendance', summary.percentage === null ? '—' : `${summary.percentage}%`],
        ['Present', summary.PRESENT], ['Late', summary.LATE], ['Half day', summary.HALF_DAY], ['Absent', summary.ABSENT], ['On leave', summary.ON_LEAVE],
    ] : []), [summary]);

    return (
        <div className="mx-auto w-full max-w-4xl">
            <PageHeader eyebrow="Staff" title="My Attendance" description="Your attendance as recorded by the school office." />
            <Card className="mb-4">
                <label htmlFor="my-month" className="mb-1 block text-sm font-medium text-ink-700">Month</label>
                <input id="my-month" type="month" className={`${inputClass} sm:w-56`} value={month} onChange={(e) => setMonth(e.target.value)} />
            </Card>
            {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : (
                <>
                    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {cards.map(([label, value]) => (
                            <Card key={label} className="!p-4"><p className="text-xs text-ink-600">{label}</p><p className="mt-1 text-xl font-semibold text-ink-900">{value}</p></Card>
                        ))}
                    </div>
                    {data?.records?.length ? (
                        <DataTable
                            rows={data.records}
                            columns={[
                                { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString(undefined, { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }) },
                                { key: 'status', label: 'Status', render: (r) => formatLabel(r.status) },
                                { key: 'remarks', label: 'Remarks', render: (r) => r.remarks || '—' },
                            ]}
                        />
                    ) : <Card><EmptyState title="No attendance recorded this month" /></Card>}
                </>
            )}
        </div>
    );
}
