import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getTeacherRoster } from '../../services/attendanceApi';

export default function TeacherStudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getTeacherRoster();
            setStudents(Array.isArray(data) ? data : (data?.data || []));
        } catch (err) {
            setError(err?.response?.data?.message || 'Unable to load your students.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return students;
        return students.filter((s) =>
            `${s.firstName} ${s.lastName}`.toLowerCase().includes(term)
            || String(s.rollNumber || '').toLowerCase().includes(term)
            || String(s.studentId || '').toLowerCase().includes(term));
    }, [students, search]);

    const classLabel = students[0] ? `Class ${students[0].class} - ${students[0].section}` : 'your class';

    return (
        <div className="mx-auto w-full max-w-5xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Teacher workspace</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">My Students</h1>
                    <p className="mt-2 text-sm text-ink-600">Active students of {classLabel}.</p>
                </div>
                <Button as={Link} to="/teacher/attendance" variant="secondary">Mark attendance</Button>
            </div>

            <Card className="mb-6 p-4">
                <label htmlFor="student-search" className="mb-1 block text-sm font-medium text-ink-700">Search</label>
                <input
                    id="student-search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name, roll number or student ID..."
                    className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
            </Card>

            <Card className="overflow-hidden p-0">
                {loading ? (
                    <div className="flex min-h-[200px] items-center justify-center gap-3 text-sm text-ink-600">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                        Loading students...
                    </div>
                ) : error ? (
                    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 text-center">
                        <p className="text-sm text-red-600">{error}</p>
                        <Button type="button" onClick={load}>Retry</Button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-sm text-ink-500">
                        {students.length === 0 ? 'No active students are assigned to your class yet.' : 'No students match your search.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-ink-200">
                            <thead className="bg-ink-50">
                                <tr>
                                    {['Roll No.', 'Student ID', 'Name', 'Class'].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-200 bg-white">
                                {filtered.map((s) => (
                                    <tr key={s._id} className="hover:bg-ink-50/60">
                                        <td className="px-4 py-3 text-sm text-ink-700">{s.rollNumber}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-ink-900">{s.studentId}</td>
                                        <td className="px-4 py-3 text-sm text-ink-900">{s.firstName} {s.lastName}</td>
                                        <td className="px-4 py-3 text-sm text-ink-700">{s.class} - {s.section}</td>
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
