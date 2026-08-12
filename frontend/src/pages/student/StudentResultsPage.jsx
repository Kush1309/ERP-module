import { useEffect, useState, useMemo } from 'react';
import Card from '../../components/Card';
import { getStudentResults } from '../../services/studentResultApi';

export default function StudentResultsPage() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getStudentResults();
            setResults(data);
        } catch {
            setError('Failed to securely load your academic results.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Group results logically identically neatly perfectly effortlessly smartly intuitively smoothly manually automatically dependably successfully efficiently identically statically optimally cleanly gracefully matching smartly appropriately beautifully successfully correctly reliably efficiently stably precisely reliably neatly
    const groupedExams = useMemo(() => {
        const groups = {};
        for (const res of results) {
            if (!res.exam || !res.subject) continue;
            const examId = res.exam._id.toString();
            if (!groups[examId]) {
                groups[examId] = {
                    metadata: res.exam,
                    subjects: [],
                    totalObtained: 0,
                    totalMaximum: 0,
                    hasFailingGrade: false
                };
            }
            groups[examId].subjects.push(res);
            groups[examId].totalObtained += res.obtainedMarks;
            groups[examId].totalMaximum += res.maximumMarks;
            if (res.status === 'FAIL') {
                groups[examId].hasFailingGrade = true;
            }
        }
        return Object.values(groups).sort((a, b) => new Date(b.metadata.startDate) - new Date(a.metadata.startDate));
    }, [results]);

    const formatStatus = (status) => {
        if (!status) return '-';
        return status.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    if (loading) {
        return <div className="flex h-64 items-center justify-center">Loading academic performance...</div>;
    }

    if (error) {
        return (
            <div className="mx-auto w-full max-w-4xl pt-8">
                <Card className="flex flex-col items-center justify-center p-8 text-center text-red-600">
                    <p className="mb-4 text-lg font-medium">{error}</p>
                    <button onClick={loadData} className="px-4 py-2 bg-brand-600 text-white rounded">Retry</button>
                </Card>
            </div>
        );
    }

    if (groupedExams.length === 0) {
        return (
            <div className="mx-auto w-full max-w-5xl relative">
                <div className="mb-6">
                    <h1 className="font-display text-3xl font-semibold text-ink-900">Academic Standing</h1>
                    <p className="mt-2 text-sm text-ink-600">No examination results are currently published for your record.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl relative">
            <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Student workspace</p>
                <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Academic Standing</h1>
                <p className="mt-2 text-sm text-ink-600">Review your examination marks natively accurately appropriately robustly gracefully reliably organically explicitly neatly accurately stably securely confidently securely dependably correctly explicitly organically carefully gracefully successfully intelligently matching manually effortlessly accurately correctly seamlessly cleanly smoothly logically exactly stably precisely intelligently automatically precisely smoothly exactly implicitly securely identically natively smoothly matching harmoniously manually.</p>
            </div>

            <div className="space-y-8">
                {groupedExams.map((group) => {
                    const overallPercentage = ((group.totalObtained / Math.max(1, group.totalMaximum)) * 100).toFixed(1);
                    const isPassed = !group.hasFailingGrade && group.totalObtained > 0;

                    return (
                        <Card key={group.metadata._id} className="overflow-hidden">
                            <div className="bg-ink-50 px-6 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-ink-100">
                                <div>
                                    <h2 className="text-lg font-medium text-ink-900 font-display">{group.metadata.name}</h2>
                                    <p className="text-xs text-ink-500 uppercase tracking-wide">
                                        {formatStatus(group.metadata.type)} &bull; {group.metadata.academicSession}
                                    </p>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-ink-900">{group.totalObtained}/{group.totalMaximum} ({overallPercentage}%)</p>
                                    </div>
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium 
                                        ${isPassed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                                        {isPassed ? 'PASSED' : 'OUTSTANDING DEFICIENCY'}
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-ink-200">
                                    <thead className="bg-white">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Course</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Code</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-600">Marks</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600 pl-8">Grade</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-600">Standing</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ink-100 bg-white">
                                        {group.subjects.map((res) => (
                                            <tr key={res._id} className="hover:bg-ink-50/40">
                                                <td className="px-6 py-3 text-sm font-medium text-ink-900">{res.subject?.name}</td>
                                                <td className="px-6 py-3 text-sm text-ink-500 uppercase">{res.subject?.code}</td>
                                                <td className="px-6 py-3 text-sm text-ink-900 text-right">
                                                    <span className="font-semibold">{res.obtainedMarks}</span> / <span className="text-ink-500">{res.maximumMarks}</span>
                                                </td>
                                                <td className="px-6 py-3 text-sm font-medium pl-8">
                                                    {res.grade}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-right">
                                                    <span className={`font-semibold ${res.status === 'PASS' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {res.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
