import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { reportsApi } from '../../services/moduleApi';
import { PageHeader, Tabs, DataTable, StatCard, LoadingState, ErrorState, inputClass, errorMessage, formatLabel, formatCurrency, localToday, downloadCsv } from '../../components/common/ui';

const pct = (v) => (v === null || v === undefined ? '—' : `${v}%`);

function Bar({ value }) {
    const width = Math.max(0, Math.min(100, Number(value) || 0));
    return (
        <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${width}%` }} /></div>
            <span>{pct(value)}</span>
        </div>
    );
}

function CountList({ title, counts }) {
    const entries = Object.entries(counts || {});
    return (
        <Card>
            <p className="mb-3 text-sm font-semibold text-ink-900">{title}</p>
            {entries.length === 0 ? <p className="text-sm text-ink-500">No data in this period.</p> : (
                <ul className="space-y-1 text-sm">
                    {entries.map(([k, v]) => <li key={k} className="flex justify-between"><span className="text-ink-600">{formatLabel(k)}</span><span className="font-medium text-ink-900">{v}</span></li>)}
                </ul>
            )}
        </Card>
    );
}

function ExportButton({ onClick, disabled }) {
    return <Button type="button" variant="secondary" className="print:hidden" onClick={onClick} disabled={disabled}>Export CSV</Button>;
}

export default function ReportsPage() {
    const today = localToday();
    const [range, setRange] = useState({ startDate: `${today.slice(0, 7)}-01`, endDate: today });
    const [applied, setApplied] = useState(range);
    const [tab, setTab] = useState('strength');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setData(await reportsApi.overview(applied));
        } catch (err) {
            setError(errorMessage(err, 'Unable to load reports.'));
        } finally {
            setLoading(false);
        }
    }, [applied]);

    useEffect(() => { load(); }, [load]);

    const tag = `${applied.startDate}_to_${applied.endDate}`;

    return (
        <div className="mx-auto w-full max-w-6xl">
            <PageHeader
                title="Reports & Analytics"
                description="Calculated live from school records. Date range applies to attendance, exams, admissions and staff attendance."
                actions={<Button type="button" variant="secondary" className="print:hidden" onClick={() => window.print()}>Print</Button>}
            />
            <Card className="mb-4 print:hidden">
                <form onSubmit={(e) => { e.preventDefault(); setApplied(range); }} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div><label htmlFor="rp-start" className="mb-1 block text-sm font-medium text-ink-700">From</label><input id="rp-start" type="date" className={inputClass} value={range.startDate} max={range.endDate} onChange={(e) => setRange({ ...range, startDate: e.target.value })} /></div>
                    <div><label htmlFor="rp-end" className="mb-1 block text-sm font-medium text-ink-700">To</label><input id="rp-end" type="date" className={inputClass} value={range.endDate} onChange={(e) => setRange({ ...range, endDate: e.target.value })} /></div>
                    <Button type="submit">Apply</Button>
                </form>
            </Card>
            {loading ? <LoadingState label="Calculating reports..." /> : error ? <ErrorState message={error} onRetry={load} /> : (
                <>
                    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <StatCard label="Active students" value={data.strength.totalActive} />
                        <StatCard label="Student attendance" value={pct(data.attendance.overallPercentage)} hint={`${data.attendance.totalRecords} records`} />
                        <StatCard label="Fees collected" value={formatCurrency(data.fees.totals.collected)} hint={`${pct(data.fees.totals.collectionRate)} of net billed`} />
                        <StatCard label="Outstanding dues" value={formatCurrency(data.fees.totals.outstanding)} hint={`${data.fees.totals.overdueCount} overdue record(s)`} />
                    </div>
                    <div className="print:hidden">
                        <Tabs
                            tabs={[{ key: 'strength', label: 'Student Strength' }, { key: 'attendance', label: 'Attendance' }, { key: 'exams', label: 'Examinations' }, { key: 'fees', label: 'Fees' }, { key: 'admissions', label: 'Admissions' }, { key: 'staff', label: 'Staff' }]}
                            active={tab}
                            onChange={setTab}
                        />
                    </div>

                    {tab === 'strength' && (
                        <>
                            <div className="mb-3 flex justify-end"><ExportButton disabled={!data.strength.byClass.length} onClick={() => downloadCsv('student-strength.csv', [{ label: 'Class', value: (r) => `${r.className}-${r.section}` }, { label: 'Total', key: 'total' }, { label: 'Male', key: 'male' }, { label: 'Female', key: 'female' }, { label: 'Other', key: 'other' }], data.strength.byClass)} /></div>
                            <div className="mb-4 grid gap-3 sm:grid-cols-3"><CountList title="Students by status" counts={data.strength.byStatus} /></div>
                            <DataTable rows={data.strength.byClass} rowKey={(r) => `${r.className}-${r.section}`} emptyTitle="No active students" columns={[
                                { key: 'cls', label: 'Class', render: (r) => `${r.className}-${r.section}` },
                                { key: 'total', label: 'Total' }, { key: 'male', label: 'Male' }, { key: 'female', label: 'Female' }, { key: 'other', label: 'Other' },
                            ]} />
                        </>
                    )}

                    {tab === 'attendance' && (
                        <>
                            <div className="mb-3 flex justify-end gap-2">
                                <ExportButton disabled={!data.attendance.byClass.length} onClick={() => downloadCsv(`attendance-by-class_${tag}.csv`, [{ label: 'Class', value: (r) => `${r.className}-${r.section}` }, { label: 'Present', key: 'present' }, { label: 'Absent', key: 'absent' }, { label: 'Attendance %', key: 'percentage' }], data.attendance.byClass)} />
                            </div>
                            <DataTable rows={data.attendance.byClass} rowKey={(r) => `${r.className}-${r.section}`} emptyTitle="No attendance recorded in this period" columns={[
                                { key: 'cls', label: 'Class', render: (r) => `${r.className}-${r.section}` },
                                { key: 'present', label: 'Present' }, { key: 'absent', label: 'Absent' },
                                { key: 'percentage', label: 'Attendance', render: (r) => <Bar value={r.percentage} /> },
                            ]} />
                            <div className="mb-3 mt-6 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-ink-900">Below {data.attendance.threshold}% attendance</h2>
                                <ExportButton disabled={!data.attendance.lowAttendance.length} onClick={() => downloadCsv(`low-attendance_${tag}.csv`, [{ label: 'Student ID', key: 'studentId' }, { label: 'Name', key: 'name' }, { label: 'Class', key: 'className' }, { label: 'Present', key: 'present' }, { label: 'Absent', key: 'absent' }, { label: 'Attendance %', key: 'percentage' }], data.attendance.lowAttendance)} />
                            </div>
                            <DataTable rows={data.attendance.lowAttendance} rowKey="studentId" emptyTitle="No students below the threshold" columns={[
                                { key: 'name', label: 'Student', render: (r) => <div><p className="font-medium text-ink-900">{r.name}</p><p className="text-xs text-ink-500">{r.studentId}</p></div> },
                                { key: 'className', label: 'Class' }, { key: 'present', label: 'Present' }, { key: 'absent', label: 'Absent' },
                                { key: 'percentage', label: 'Attendance', render: (r) => <span className="font-semibold text-red-600">{pct(r.percentage)}</span> },
                            ]} />
                        </>
                    )}

                    {tab === 'exams' && (
                        <>
                            <div className="mb-3 flex justify-end"><ExportButton disabled={!data.exams.length} onClick={() => downloadCsv(`exam-performance_${tag}.csv`, [{ label: 'Exam', key: 'name' }, { label: 'Class', key: 'className' }, { label: 'Status', key: 'status' }, { label: 'Students', key: 'students' }, { label: 'Average %', key: 'averagePercentage' }, { label: 'Pass rate %', key: 'passRate' }], data.exams)} /></div>
                            <DataTable rows={data.exams} emptyTitle="No examinations in this period" columns={[
                                { key: 'name', label: 'Examination', render: (r) => <span className="font-medium text-ink-900">{r.name}</span> },
                                { key: 'className', label: 'Class' }, { key: 'status', label: 'Status', render: (r) => formatLabel(r.status) },
                                { key: 'students', label: 'Students' },
                                { key: 'averagePercentage', label: 'Average', render: (r) => pct(r.averagePercentage) },
                                { key: 'passRate', label: 'Pass rate', render: (r) => <Bar value={r.passRate} /> },
                                { key: 'link', label: '', className: 'text-right print:hidden', render: (r) => <Link to={`/admin/examinations/${r._id}/analytics`} className="font-medium text-brand-700">Analytics</Link> },
                            ]} />
                        </>
                    )}

                    {tab === 'fees' && (
                        <>
                            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <StatCard label="Gross billed" value={formatCurrency(data.fees.totals.gross)} />
                                <StatCard label="Concessions" value={formatCurrency(data.fees.totals.discount)} />
                                <StatCard label="Net payable" value={formatCurrency(data.fees.totals.net)} />
                                <StatCard label="Overdue amount" value={formatCurrency(data.fees.totals.overdueAmount)} />
                            </div>
                            <p className="mb-3 text-xs text-ink-500">Fee figures cover all fee records (not limited to the date range).</p>
                            <div className="mb-3 flex justify-end"><ExportButton disabled={!data.fees.byClass.length} onClick={() => downloadCsv('fees-by-class.csv', [{ label: 'Class', key: 'className' }, { label: 'Net payable', key: 'net' }, { label: 'Collected', key: 'collected' }, { label: 'Outstanding', key: 'outstanding' }], data.fees.byClass)} /></div>
                            <DataTable rows={data.fees.byClass} rowKey="className" emptyTitle="No fee records" columns={[
                                { key: 'className', label: 'Class' },
                                { key: 'net', label: 'Net payable', render: (r) => formatCurrency(r.net) },
                                { key: 'collected', label: 'Collected', render: (r) => formatCurrency(r.collected) },
                                { key: 'outstanding', label: 'Outstanding', render: (r) => formatCurrency(r.outstanding) },
                            ]} />
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <CountList title="Records by status" counts={data.fees.byStatus} />
                                <Card><p className="mb-3 text-sm font-semibold text-ink-900">Collections by month</p>{data.fees.byMonth.length ? <ul className="space-y-1 text-sm">{data.fees.byMonth.map((m) => <li key={m.month} className="flex justify-between"><span className="text-ink-600">{m.month}</span><span className="font-medium">{formatCurrency(m.amount)}</span></li>)}</ul> : <p className="text-sm text-ink-500">No payments.</p>}</Card>
                                <Card><p className="mb-3 text-sm font-semibold text-ink-900">Collections by method</p>{data.fees.byMethod.length ? <ul className="space-y-1 text-sm">{data.fees.byMethod.map((m) => <li key={m.method} className="flex justify-between"><span className="text-ink-600">{formatLabel(m.method)}</span><span className="font-medium">{formatCurrency(m.amount)}</span></li>)}</ul> : <p className="text-sm text-ink-500">No payments.</p>}</Card>
                            </div>
                        </>
                    )}

                    {tab === 'admissions' && (
                        <>
                            <div className="mb-4 grid grid-cols-3 gap-3">
                                <StatCard label="Enquiries" value={data.admissions.enquiries} />
                                <StatCard label="Applications" value={data.admissions.applications} />
                                <StatCard label="Enrolled" value={data.admissions.enrolled} />
                            </div>
                            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                                <CountList title="Enquiries by source" counts={data.admissions.enquiriesBySource} />
                                <CountList title="Enquiries by status" counts={data.admissions.enquiriesByStatus} />
                                <CountList title="Applications by status" counts={data.admissions.applicationsByStatus} />
                            </div>
                            <div className="mb-3 flex justify-end"><ExportButton disabled={!data.admissions.byMonth.length} onClick={() => downloadCsv(`admission-trends_${tag}.csv`, [{ label: 'Month', key: 'month' }, { label: 'Enquiries', key: 'enquiries' }, { label: 'Applications', key: 'applications' }, { label: 'Enrolled', key: 'enrolled' }], data.admissions.byMonth)} /></div>
                            <DataTable rows={data.admissions.byMonth} rowKey="month" emptyTitle="No admission activity in this period" columns={[
                                { key: 'month', label: 'Month' }, { key: 'enquiries', label: 'Enquiries' }, { key: 'applications', label: 'Applications' }, { key: 'enrolled', label: 'Enrolled' },
                            ]} />
                        </>
                    )}

                    {tab === 'staff' && (
                        <>
                            <div className="mb-4 grid grid-cols-3 gap-3">
                                <StatCard label="Teachers" value={data.staff.teachers} />
                                <StatCard label="Staff attendance records" value={data.staff.records} />
                                <StatCard label="Staff attendance rate" value={pct(data.staff.attendanceRate)} />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3"><CountList title="Staff attendance by status" counts={data.staff.byStatus} /></div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
