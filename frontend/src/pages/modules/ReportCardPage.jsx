import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import { reportsApi } from '../../services/moduleApi';
import { LoadingState, ErrorState, errorMessage, formatDate } from '../../components/common/ui';

// Printable report card for one student in one examination
export default function ReportCardPage() {
    const { examId, studentId } = useParams();
    const navigate = useNavigate();
    const [card, setCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setCard(await reportsApi.reportCard(examId, studentId));
        } catch (err) {
            setError(errorMessage(err, 'Unable to load the report card.'));
        } finally {
            setLoading(false);
        }
    }, [examId, studentId]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <LoadingState label="Preparing report card..." />;
    if (error) return <div className="mx-auto max-w-3xl"><ErrorState message={error} onRetry={load} /><div className="text-center"><Button type="button" variant="secondary" onClick={() => navigate(-1)}>Go back</Button></div></div>;

    const { school, exam, student, subjects, summary, attendance } = card;
    return (
        <div className="mx-auto w-full max-w-3xl">
            <div className="mb-4 flex justify-between print:hidden">
                <Button type="button" variant="secondary" onClick={() => navigate(-1)}>← Back</Button>
                <Button type="button" onClick={() => window.print()}>Print / Save as PDF</Button>
            </div>
            <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm print:border-0 print:p-0 print:shadow-none sm:p-8">
                <div className="border-b border-ink-200 pb-4 text-center">
                    <h1 className="font-display text-2xl font-semibold text-ink-900">{school.name}</h1>
                    {school.address && <p className="text-sm text-ink-600">{school.address}</p>}
                    {(school.phone || school.email) && <p className="text-xs text-ink-500">{[school.phone, school.email].filter(Boolean).join(' · ')}</p>}
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Report Card</p>
                    <p className="text-sm font-medium text-ink-800">{exam.name} · {exam.academicSession}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-ink-200 py-4 text-sm sm:grid-cols-3">
                    <p><span className="text-ink-500">Name:</span> <span className="font-medium text-ink-900">{student.name}</span></p>
                    <p><span className="text-ink-500">Student ID:</span> {student.studentId}</p>
                    <p><span className="text-ink-500">Class:</span> {student.class}-{student.section}</p>
                    <p><span className="text-ink-500">Roll No.:</span> {student.rollNumber}</p>
                    <p><span className="text-ink-500">Admission No.:</span> {student.admissionNumber}</p>
                    <p><span className="text-ink-500">Exam dates:</span> {formatDate(exam.startDate)} – {formatDate(exam.endDate)}</p>
                </div>
                <div className="overflow-x-auto py-4">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-ink-300 text-left text-xs uppercase tracking-wide text-ink-600">
                                <th className="py-2 pr-3">Subject</th><th className="py-2 pr-3">Marks</th><th className="py-2 pr-3">Max</th><th className="py-2 pr-3">%</th><th className="py-2 pr-3">Grade</th><th className="py-2">Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map((s) => (
                                <tr key={s.subject} className="border-b border-ink-100">
                                    <td className="py-2 pr-3 font-medium text-ink-900">{s.subject}</td>
                                    <td className="py-2 pr-3">{s.obtainedMarks}</td>
                                    <td className="py-2 pr-3">{s.maximumMarks}</td>
                                    <td className="py-2 pr-3">{s.percentage}</td>
                                    <td className="py-2 pr-3">{s.grade}</td>
                                    <td className={`py-2 font-medium ${s.status === 'PASS' ? 'text-emerald-700' : 'text-red-600'}`}>{s.status === 'PASS' ? 'Pass' : 'Fail'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-semibold text-ink-900"><td className="py-2 pr-3">Total</td><td className="py-2 pr-3">{summary.obtained}</td><td className="py-2 pr-3">{summary.maximum}</td><td className="py-2 pr-3">{summary.percentage}</td><td className="py-2 pr-3">{summary.grade}</td><td className={`py-2 ${summary.result === 'PASS' ? 'text-emerald-700' : 'text-red-600'}`}>{summary.result === 'PASS' ? 'Pass' : 'Fail'}</td></tr>
                        </tfoot>
                    </table>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-ink-200 pt-4 text-sm sm:grid-cols-4">
                    <div><p className="text-ink-500">Overall</p><p className="text-lg font-semibold text-ink-900">{summary.percentage}%</p></div>
                    <div><p className="text-ink-500">Grade</p><p className="text-lg font-semibold text-ink-900">{summary.grade}</p></div>
                    <div><p className="text-ink-500">Class rank</p><p className="text-lg font-semibold text-ink-900">{summary.rank} / {summary.classSize}</p></div>
                    <div><p className="text-ink-500">Attendance</p><p className="text-lg font-semibold text-ink-900">{attendance.percentage === null ? '—' : `${attendance.percentage}%`}</p><p className="text-xs text-ink-500">{attendance.present} of {attendance.total} days</p></div>
                </div>
                <div className="mt-12 grid grid-cols-3 gap-6 text-center text-xs text-ink-600">
                    <div className="border-t border-ink-300 pt-2">Class Teacher</div>
                    <div className="border-t border-ink-300 pt-2">Parent / Guardian</div>
                    <div className="border-t border-ink-300 pt-2">Principal{school.principalName ? ` (${school.principalName})` : ''}</div>
                </div>
                <p className="mt-6 text-right text-[11px] text-ink-400">Generated {new Date(card.generatedAt).toLocaleString()}</p>
            </div>
        </div>
    );
}
