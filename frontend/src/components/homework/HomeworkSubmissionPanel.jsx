import { useCallback, useEffect, useState } from 'react';
import Button from '../Button';
import { homeworkSubmissionApi } from '../../services/moduleApi';
import { parentApi } from '../../services/parentApi';
import { Alert, StatusPill, inputClass, errorMessage } from '../common/ui';

const STATUS_TONE = { SUBMITTED: 'blue', GRADED: 'green', RETURNED: 'amber' };

function SubmissionSummary({ submission }) {
    if (!submission) return null;
    return (
        <div className="space-y-2 rounded-md border border-ink-200 bg-ink-50 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
                <StatusPill value={submission.status} tone={STATUS_TONE[submission.status]} />
                {submission.isLate && <StatusPill value="LATE" tone="red" />}
                <span className="text-xs text-ink-500">Submitted {new Date(submission.submittedAt).toLocaleString()}</span>
            </div>
            {submission.content && <p className="whitespace-pre-wrap text-ink-800">{submission.content}</p>}
            {submission.attachmentUrl && <a href={submission.attachmentUrl} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-brand-700">Open attachment</a>}
            {(submission.grade || submission.feedback) && (
                <div className="border-t border-ink-200 pt-2">
                    {submission.grade && <p><span className="text-ink-500">Grade:</span> <span className="font-semibold text-ink-900">{submission.grade}</span></p>}
                    {submission.feedback && <p><span className="text-ink-500">Feedback:</span> {submission.feedback}</p>}
                </div>
            )}
        </div>
    );
}

// Student: submit / resubmit own work
function StudentSubmission({ homework }) {
    const [state, setState] = useState(null);
    const [form, setForm] = useState({ content: '', attachmentUrl: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await homeworkSubmissionApi.mine(homework._id);
            setState(data);
            setForm({ content: data?.submission?.content || '', attachmentUrl: data?.submission?.attachmentUrl || '' });
        } catch (err) {
            setError(errorMessage(err, 'Unable to load your submission.'));
        } finally {
            setLoading(false);
        }
    }, [homework._id]);

    useEffect(() => { load(); }, [load]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setNotice('');
        try {
            await homeworkSubmissionApi.submit(homework._id, form);
            setNotice('Submission saved.');
            load();
        } catch (err) {
            setError(errorMessage(err, 'Unable to submit.'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p className="text-sm text-ink-500">Loading your submission...</p>;
    const submission = state?.submission;
    const locked = submission?.status === 'GRADED';
    return (
        <div className="space-y-3">
            {notice && <Alert>{notice}</Alert>}
            {error && <Alert tone="error">{error}</Alert>}
            <SubmissionSummary submission={submission} />
            {!locked && state && (
                <form onSubmit={submit} className="space-y-3">
                    {state.isPastDue && <Alert tone="warning">The due date has passed. Your submission will be marked late.</Alert>}
                    {submission?.status === 'RETURNED' && <Alert tone="warning">Your teacher returned this for changes. Update and resubmit.</Alert>}
                    <div>
                        <label htmlFor="hw-answer" className="mb-1 block text-sm font-medium text-ink-700">Your answer</label>
                        <textarea id="hw-answer" rows={4} maxLength={5000} className={inputClass} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                    </div>
                    <div>
                        <label htmlFor="hw-link" className="mb-1 block text-sm font-medium text-ink-700">Attachment link (optional)</label>
                        <input id="hw-link" type="url" placeholder="https://drive.google.com/..." className={inputClass} value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} />
                        <p className="mt-1 text-xs text-ink-500">Share a link to your file (e.g. Google Drive). File uploads are not stored on the school server.</p>
                    </div>
                    <div className="flex justify-end"><Button type="submit" disabled={saving || (!form.content.trim() && !form.attachmentUrl.trim())}>{saving ? 'Submitting...' : submission ? 'Resubmit' : 'Submit'}</Button></div>
                </form>
            )}
        </div>
    );
}

// Parent: read-only view of a linked child's submission
function ParentSubmission({ homework }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await parentApi.getStudents();
                const children = (res?.data || []).filter((s) => s.class === homework.class && String(s.section).toUpperCase() === String(homework.section).toUpperCase());
                const results = await Promise.all(children.map(async (child) => {
                    try { return { child, ...(await homeworkSubmissionApi.mine(homework._id, child._id)) }; } catch (err) { return { child, error: errorMessage(err, 'Unavailable') }; }
                }));
                if (active) setRows(results);
            } catch (err) {
                if (active) setError(errorMessage(err, 'Unable to load submissions.'));
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [homework]);

    if (loading) return <p className="text-sm text-ink-500">Loading...</p>;
    if (error) return <Alert tone="error">{error}</Alert>;
    if (!rows.length) return <p className="text-sm text-ink-500">None of your linked children are in this class.</p>;
    return (
        <div className="space-y-3">
            {rows.map((r) => (
                <div key={r.child._id}>
                    <p className="mb-1 text-sm font-medium text-ink-800">{r.child.firstName} {r.child.lastName}</p>
                    {r.error ? <p className="text-sm text-ink-500">{r.error}</p> : r.submission ? <SubmissionSummary submission={r.submission} /> : <p className="text-sm text-amber-700">Not submitted yet{r.isPastDue ? ' (past due)' : ''}.</p>}
                </div>
            ))}
        </div>
    );
}

// Teacher / admin: completion tracking and grading
function TeacherReview({ homework }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(null);
    const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '', status: 'GRADED' });
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setData(await homeworkSubmissionApi.list(homework._id));
        } catch (err) {
            setError(errorMessage(err, 'Unable to load submissions.'));
        } finally {
            setLoading(false);
        }
    }, [homework._id]);

    useEffect(() => { load(); }, [load]);

    const saveGrade = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await homeworkSubmissionApi.grade(editing, gradeForm);
            setEditing(null);
            load();
        } catch (err) {
            setError(errorMessage(err, 'Unable to save grade.'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p className="text-sm text-ink-500">Loading submissions...</p>;
    if (!data) return <Alert tone="error">{error}</Alert>;
    const s = data.summary;
    return (
        <div className="space-y-3">
            {error && <Alert tone="error">{error}</Alert>}
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {[['Students', s.total], ['Submitted', s.submitted], ['Missing', s.missing], ['Late', s.late], ['Graded', s.graded]].map(([k, v]) => (
                    <div key={k} className="rounded-md border border-ink-200 p-2"><p className="text-ink-500">{k}</p><p className="text-base font-semibold text-ink-900">{v}</p></div>
                ))}
            </div>
            {homework.status !== 'PUBLISHED' && <p className="text-xs text-amber-700">Students can submit once this homework is published.</p>}
            <ul className="max-h-80 divide-y divide-ink-200 overflow-y-auto rounded-md border border-ink-200">
                {data.rows.length === 0 && <li className="p-3 text-sm text-ink-500">No active students in this class.</li>}
                {data.rows.map(({ student, submission }) => (
                    <li key={student._id} className="space-y-2 p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-ink-900">{student.rollNumber}. {student.firstName} {student.lastName}</span>
                            {submission ? (
                                <button type="button" className="text-xs font-medium text-brand-700" onClick={() => { setEditing(submission._id); setGradeForm({ grade: submission.grade || '', feedback: submission.feedback || '', status: 'GRADED' }); }}>
                                    {submission.status === 'GRADED' ? 'Edit grade' : 'Grade'}
                                </button>
                            ) : <span className="text-xs text-amber-700">Not submitted</span>}
                        </div>
                        {submission && <SubmissionSummary submission={submission} />}
                        {editing === submission?._id && (
                            <form onSubmit={saveGrade} className="grid gap-2 rounded-md border border-brand-200 p-2 sm:grid-cols-3">
                                <input aria-label="Grade" placeholder="Grade e.g. A or 8/10" maxLength={20} className={inputClass} value={gradeForm.grade} onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })} />
                                <select aria-label="Outcome" className={inputClass} value={gradeForm.status} onChange={(e) => setGradeForm({ ...gradeForm, status: e.target.value })}>
                                    <option value="GRADED">Graded</option><option value="RETURNED">Return for changes</option>
                                </select>
                                <textarea aria-label="Feedback" rows={2} placeholder="Feedback" className={`${inputClass} sm:col-span-3`} value={gradeForm.feedback} onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })} />
                                <div className="flex justify-end gap-2 sm:col-span-3">
                                    <Button type="button" variant="secondary" className="!px-3 !py-1.5" onClick={() => setEditing(null)}>Cancel</Button>
                                    <Button type="submit" className="!px-3 !py-1.5" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                                </div>
                            </form>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function HomeworkSubmissionPanel({ homework, role }) {
    return (
        <div className="border-t border-ink-200 pt-4">
            <p className="mb-3 text-sm font-semibold text-ink-900">{role === 'STUDENT' ? 'Your submission' : role === 'PARENT' ? 'Submission status' : 'Submissions'}</p>
            {role === 'STUDENT' && <StudentSubmission homework={homework} />}
            {role === 'PARENT' && <ParentSubmission homework={homework} />}
            {(role === 'TEACHER' || role === 'ADMIN') && <TeacherReview homework={homework} />}
        </div>
    );
}
