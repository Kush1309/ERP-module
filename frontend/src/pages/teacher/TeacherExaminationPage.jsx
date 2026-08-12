import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getTeacherExams } from '../../services/teacherExamApi';

export default function TeacherExaminationPage() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadExams = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getTeacherExams();
            setExams(data || []);
        } catch {
            setExams([]);
            setError('Unable to load authorized examinations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadExams();
    }, []);

    const formatStatus = (status) => {
        if (!status) return 'Unknown';
        return status.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    };

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        return new Date(isoString).toISOString().split('T')[0];
    };

    return (
        <div className="mx-auto w-full max-w-5xl relative">
            <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Teacher workspace</p>
                <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Examinations & Marks</h1>
                <p className="mt-2 text-sm text-ink-600">Manage result entry constraints inherently strictly within your exact authorized class mappings implicitly cleanly reliably securely.</p>
            </div>

            <Card className="overflow-hidden">
                {loading ? (
                    <div className="flex min-h-[220px] items-center justify-center">
                        <div className="flex items-center gap-3 text-sm text-ink-600">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                            Loading authorized examinations...
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
                        <p className="text-lg font-semibold text-ink-900">{error}</p>
                        <Button type="button" onClick={loadExams}>Retry</Button>
                    </div>
                ) : exams.length === 0 ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
                        <p className="text-lg font-semibold text-ink-900">
                            No authorized examinations found mapping to your class scope.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-ink-200">
                            <thead className="bg-ink-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Examination</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Dates</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-200 bg-white">
                                {exams.map((exam) => (
                                    <tr key={exam._id} className="hover:bg-ink-50/60">
                                        <td className="px-4 py-3 text-sm font-medium text-ink-900">{exam.name} <span className="block text-xs font-normal text-ink-500">{exam.academicSession}</span></td>
                                        <td className="px-4 py-3 text-sm text-ink-700">{formatStatus(exam.type)}</td>
                                        <td className="px-4 py-3 text-sm text-ink-700">
                                            {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium 
                                                ${exam.status === 'PUBLISHED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                                    exam.status === 'COMPLETED' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                                        exam.status === 'ACTIVE' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                                            'border-ink-200 bg-ink-50 text-ink-700'}`}>
                                                {formatStatus(exam.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <Link to={`/teacher/examinations/${exam._id}/marks`} className="font-medium text-brand-600 hover:text-brand-800">
                                                Manage Marks
                                            </Link>
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
