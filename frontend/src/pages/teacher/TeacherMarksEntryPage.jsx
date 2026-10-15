import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import {
    getTeacherExamById,
    getTeacherSubjects,
    getTeacherExamStudents,
    getTeacherExamResults,
    createTeacherResult,
    updateTeacherResult,
} from '../../services/teacherExamApi';

const selectClass = 'w-full rounded-md border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');

export default function TeacherMarksEntryPage() {
    const { id } = useParams();
    const [exam, setExam] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingResult, setEditingResult] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [modalError, setModalError] = useState('');
    const [formData, setFormData] = useState({ student: '', subject: '', obtainedMarks: '' });

    const loadResults = useCallback(async () => {
        const data = await getTeacherExamResults(id);
        setResults(data);
    }, [id]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const examData = await getTeacherExamById(id);
            setExam(examData);

            const [subjectData, studentData, resultData] = await Promise.all([
                getTeacherSubjects(),
                getTeacherExamStudents(id),
                getTeacherExamResults(id),
            ]);
            setSubjects(subjectData);
            setStudents(studentData);
            setResults(resultData);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load this examination. You may not be authorized to view it.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(''), 3000);
        return () => clearTimeout(timer);
    }, [notice]);

    const selectedSubject = useMemo(
        () => subjects.find((s) => s._id === (editingResult ? editingResult.subject?._id : formData.subject)),
        [subjects, formData.subject, editingResult]
    );

    const visibleResults = useMemo(
        () => (subjectFilter ? results.filter((r) => r.subject?._id === subjectFilter) : results),
        [results, subjectFilter]
    );

    const openCreateModal = () => {
        setEditingResult(null);
        setFormData({ student: '', subject: subjectFilter || '', obtainedMarks: '' });
        setModalError('');
        setModalOpen(true);
    };

    const openEditModal = (result) => {
        setEditingResult(result);
        setFormData({ student: result.student?._id || '', subject: result.subject?._id || '', obtainedMarks: String(result.obtainedMarks) });
        setModalError('');
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setModalError('');

        const marks = Number(formData.obtainedMarks);
        const maxMarks = selectedSubject?.maximumMarks;
        if (formData.obtainedMarks === '' || Number.isNaN(marks) || marks < 0) {
            setModalError('Enter a valid, non-negative mark.');
            return;
        }
        if (maxMarks !== undefined && marks > maxMarks) {
            setModalError(`Marks cannot exceed the maximum of ${maxMarks}.`);
            return;
        }

        setIsSaving(true);
        try {
            if (editingResult) {
                await updateTeacherResult(editingResult._id, { obtainedMarks: marks });
                setNotice('Marks updated successfully.');
            } else {
                await createTeacherResult(id, { student: formData.student, subject: formData.subject, obtainedMarks: marks });
                setNotice('Marks saved successfully.');
            }
            setModalOpen(false);
            await loadResults();
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to save marks. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center gap-3 text-sm text-ink-600">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                Loading examination...
            </div>
        );
    }

    if (error || !exam) {
        return (
            <div className="mx-auto w-full max-w-4xl pt-8">
                <Card className="flex flex-col items-center justify-center p-8 text-center text-red-600">
                    <p className="mb-4 text-lg font-medium">{error || 'Examination not found.'}</p>
                    <div className="flex gap-3">
                        <Button type="button" variant="secondary" onClick={loadData}>Retry</Button>
                        <Button as={Link} to="/teacher/examinations">Back</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl relative">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <Link to="/teacher/examinations" className="text-sm font-medium text-brand-600 hover:text-brand-800 mb-2 flex items-center">
                        ← Back to Examinations
                    </Link>
                    <h1 className="font-display text-3xl font-semibold text-ink-900">{exam.name} — Marks</h1>
                    <p className="mt-2 text-sm text-ink-600">
                        Class {exam.class}{exam.section ? `-${exam.section}` : ''} · {exam.academicSession} · {formatDate(exam.startDate)} to {formatDate(exam.endDate)}
                    </p>
                </div>
                <Button type="button" onClick={openCreateModal} disabled={students.length === 0 || subjects.length === 0}>Enter Marks</Button>
            </div>

            {notice && <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

            {(students.length === 0 || subjects.length === 0) && (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {students.length === 0 ? 'There are no active students in your class/section yet.' : 'No subjects have been configured yet. Ask the administrator to add subjects.'}
                </div>
            )}

            <Card className="p-0 overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-ink-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-ink-800">{visibleResults.length} result(s) recorded</p>
                    <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className={`${selectClass} sm:w-56`} aria-label="Filter by subject">
                        <option value="">All subjects</option>
                        {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                </div>
                {visibleResults.length === 0 ? (
                    <div className="py-12 text-center text-sm text-ink-500">No marks have been entered{subjectFilter ? ' for this subject' : ''} yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-ink-200">
                            <thead className="bg-ink-50">
                                <tr>
                                    {['Roll No.', 'Student', 'Subject', 'Marks', 'Grade', 'Status', ''].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-200 bg-white">
                                {visibleResults.map((r) => (
                                    <tr key={r._id} className="hover:bg-ink-50/60">
                                        <td className="px-4 py-3 text-sm text-ink-700">{r.student?.rollNumber || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-ink-900">{r.student ? `${r.student.firstName} ${r.student.lastName}` : 'Unknown'}</td>
                                        <td className="px-4 py-3 text-sm text-ink-700">{r.subject?.name || '-'}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-ink-900">{r.obtainedMarks} / {r.maximumMarks}</td>
                                        <td className="px-4 py-3 text-sm text-ink-700">{r.grade || '-'}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${r.status === 'PASS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                {r.status === 'PASS' ? 'Pass' : 'Fail'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm">
                                            <button type="button" onClick={() => openEditModal(r)} className="font-medium text-brand-700 hover:text-brand-800">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal isOpen={modalOpen} onClose={() => { if (!isSaving) setModalOpen(false); }} title={editingResult ? 'Update Student Marks' : 'Enter Student Marks'}>
                <form onSubmit={handleSave} className="space-y-4">
                    {modalError && <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{modalError}</div>}

                    <div>
                        <label htmlFor="marks-student" className="block text-sm font-medium text-ink-700 mb-1">Student</label>
                        <select id="marks-student" required disabled={!!editingResult} value={formData.student} onChange={(e) => setFormData({ ...formData, student: e.target.value })} className={`${selectClass} disabled:bg-ink-50`}>
                            <option value="">Select student...</option>
                            {(editingResult && !students.some((s) => s._id === editingResult.student?._id) ? [editingResult.student, ...students] : students).map((s) => (
                                <option key={s._id} value={s._id}>{s.firstName} {s.lastName} (Roll {s.rollNumber})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="marks-subject" className="block text-sm font-medium text-ink-700 mb-1">Subject</label>
                        <select id="marks-subject" required disabled={!!editingResult} value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className={`${selectClass} disabled:bg-ink-50`}>
                            <option value="">Select subject...</option>
                            {subjects.map((s) => (
                                <option key={s._id} value={s._id}>{s.name} (Max {s.maximumMarks}, Pass {s.passingMarks})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="marks-value" className="block text-sm font-medium text-ink-700 mb-1">
                            Obtained Marks{selectedSubject ? ` (0 – ${selectedSubject.maximumMarks})` : ''}
                        </label>
                        <input id="marks-value" required type="number" step="0.5" min="0" max={selectedSubject?.maximumMarks} value={formData.obtainedMarks} onChange={(e) => setFormData({ ...formData, obtainedMarks: e.target.value })} className={selectClass} />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Marks'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
