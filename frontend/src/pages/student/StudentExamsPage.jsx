import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getStudentExams } from '../../services/studentResultApi';

const formatLabel = (value) =>
    (value || '').toLowerCase().split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

const formatDate = (value) => (value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '-');

const STATUS_STYLES = {
    UPCOMING: 'border-amber-200 bg-amber-50 text-amber-700',
    ACTIVE: 'border-blue-200 bg-blue-50 text-blue-700',
    COMPLETED: 'border-ink-200 bg-ink-50 text-ink-700',
    PUBLISHED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export default function StudentExamsPage() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadExams = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setExams(await getStudentExams());
        } catch (err) {
            setError(err?.response?.data?.message || 'Unable to load your examination schedule.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadExams();
    }, [loadExams]);

    return (
        <div className="mx-auto w-full max-w-5xl">
            <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Student workspace</p>
                <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Examinations</h1>
                <p className="mt-2 text-sm text-ink-600">Examination schedule for your class. Marks become visible once results are published.</p>
            </div>

            <Card className="overflow-hidden p-0">
                {loading ? (
                    <div className="flex min-h-[200px] items-center justify-center gap-3 text-sm text-ink-600">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                        Loading examinations...
                    </div>
                ) : error ? (
                    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 text-center">
                        <p className="text-sm text-red-600">{error}</p>
                        <Button type="button" onClick={loadExams}>Retry</Button>
                    </div>
                ) : exams.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-sm font-medium text-ink-800">No examinations scheduled</p>
                        <p className="mt-1 text-sm text-ink-500">Your examination schedule will appear here once it is announced.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-ink-200">
                            <thead className="bg-ink-50">
                                <tr>
                                    {['Examination', 'Type', 'Session', 'Dates', 'Status', ''].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-200 bg-white">
                                {exams.map((exam) => (
                                    <tr key={exam._id} className="hover:bg-ink-50/60">
                                        <td className="px-4 py-3 text-sm font-medium text-ink-900">{exam.name}</td>
                                        <td className="px-4 py-3 text-sm text-ink-700">{formatLabel(exam.type)}</td>
                                        <td className="px-4 py-3 text-sm text-ink-700">{exam.academicSession}</td>
                                        <td className="px-4 py-3 text-sm text-ink-700">{formatDate(exam.startDate)} – {formatDate(exam.endDate)}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[exam.status] || STATUS_STYLES.COMPLETED}`}>
                                                {formatLabel(exam.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm">
                                            {exam.resultsPublished ? (
                                                <Link to="/student/results" className="font-medium text-brand-700 hover:text-brand-800">View results</Link>
                                            ) : (
                                                <span className="text-ink-400">Results pending</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
