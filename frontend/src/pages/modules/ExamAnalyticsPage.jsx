import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { reportsApi } from '../../services/moduleApi';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader, DataTable, StatCard, StatusPill, LoadingState, ErrorState, errorMessage, formatLabel, downloadCsv } from '../../components/common/ui';

const pct = (v) => (v === null || v === undefined ? '—' : `${v}%`);

export default function ExamAnalyticsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setData(await reportsApi.examAnalytics(id));
        } catch (err) {
            setError(errorMessage(err, 'Unable to load analytics for this examination.'));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const back = isAdmin ? `/admin/examinations/${id}` : '/teacher/examinations';
    if (loading) return <LoadingState label="Calculating results..." />;
    if (error) return <div className="mx-auto max-w-4xl"><ErrorState message={error} onRetry={load} /><p className="text-center"><Link to={back} className="text-sm font-medium text-brand-700">← Back</Link></p></div>;

    const { exam, overview, subjects, gradeDistribution, standings } = data;
    const maxGrade = Math.max(1, ...Object.values(gradeDistribution));

    return (
        <div className="mx-auto w-full max-w-6xl">
            <Link to={back} className="mb-2 inline-block text-sm font-medium text-brand-600 hover:text-brand-800">← Back</Link>
            <PageHeader
                eyebrow="Examination analytics"
                title={exam.name}
                description={`Class ${exam.class}${exam.section ? `-${exam.section}` : ''} · ${exam.academicSession} · ${formatLabel(exam.status)}`}
                actions={<Button type="button" variant="secondary" disabled={!standings.length} onClick={() => downloadCsv(`${exam.name}-results.csv`, [{ label: 'Rank', key: 'rank' }, { label: 'Student ID', value: (r) => r.student?.studentId }, { label: 'Name', value: (r) => r.student?.name }, { label: 'Roll', value: (r) => r.student?.rollNumber }, { label: 'Obtained', key: 'obtained' }, { label: 'Maximum', key: 'maximum' }, { label: 'Percentage', key: 'percentage' }, { label: 'Grade', key: 'grade' }, { label: 'Result', key: 'result' }], standings)}>Export CSV</Button>}
            />
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
                <StatCard label="Students in scope" value={overview.studentsInScope} />
                <StatCard label="With results" value={overview.studentsWithResults} />
                <StatCard label="Class average" value={pct(overview.averagePercentage)} />
                <StatCard label="Pass rate" value={pct(overview.passRate)} />
                <StatCard label="Highest" value={pct(overview.highestPercentage)} />
            </div>
            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <h2 className="mb-3 text-lg font-semibold text-ink-900">Subject-wise performance</h2>
                    <DataTable rows={subjects} rowKey="subject" emptyTitle="No marks entered yet" columns={[
                        { key: 'subject', label: 'Subject', render: (s) => <span className="font-medium text-ink-900">{s.subject}{s.code ? ` (${s.code})` : ''}</span> },
                        { key: 'students', label: 'Students' },
                        { key: 'average', label: 'Average', render: (s) => pct(s.average) },
                        { key: 'highest', label: 'Highest', render: (s) => pct(s.highest) },
                        { key: 'lowest', label: 'Lowest', render: (s) => pct(s.lowest) },
                        { key: 'passRate', label: 'Pass rate', render: (s) => pct(s.passRate) },
                    ]} />
                </div>
                <div>
                    <h2 className="mb-3 text-lg font-semibold text-ink-900">Grade distribution</h2>
                    <Card>
                        <p className="mb-3 text-xs text-ink-500">Subject-level grades across all marks entered.</p>
                        <ul className="space-y-2">
                            {Object.entries(gradeDistribution).map(([grade, count]) => (
                                <li key={grade} className="flex items-center gap-3 text-sm">
                                    <span className="w-8 font-medium text-ink-800">{grade}</span>
                                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${(count / maxGrade) * 100}%` }} /></div>
                                    <span className="w-8 text-right text-ink-700">{count}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
            <h2 className="mb-3 text-lg font-semibold text-ink-900">Class standings</h2>
            <DataTable rows={standings} rowKey={(r) => r.student?._id || r.rank} emptyTitle="No results yet" columns={[
                { key: 'rank', label: 'Rank' },
                { key: 'student', label: 'Student', render: (r) => <div><p className="font-medium text-ink-900">{r.student?.name || 'Unknown'}</p><p className="text-xs text-ink-500">{r.student?.studentId} · Roll {r.student?.rollNumber}</p></div> },
                { key: 'marks', label: 'Marks', render: (r) => `${r.obtained} / ${r.maximum}` },
                { key: 'percentage', label: '%', render: (r) => pct(r.percentage) },
                { key: 'grade', label: 'Grade' },
                { key: 'result', label: 'Result', render: (r) => <StatusPill value={r.result} tone={r.result === 'PASS' ? 'green' : 'red'} /> },
                { key: 'card', label: '', className: 'text-right', render: (r) => (r.student ? <Link to={`/report-card/${exam._id}/${r.student._id}`} className="font-medium text-brand-700">Report card</Link> : null) },
            ]} />
        </div>
    );
}
