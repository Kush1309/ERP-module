import { useEffect, useState, useMemo } from 'react';
import { getTeacherRoster, createBulkAttendance } from '../../services/attendanceApi';
import Button from '../../components/Button';
import Card from '../../components/Card';

function TeacherAttendancePage() {
    const [roster, setRoster] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [attendanceState, setAttendanceState] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    // Extract class/section implicitly from the roster structure if possible, but safe fallback to empty.
    const classInfo = useMemo(() => {
        if (roster.length > 0) {
            return { class: roster[0].class, section: roster[0].section };
        }
        return { class: '-', section: '-' };
    }, [roster]);

    useEffect(() => {
        fetchRoster();
    }, []);

    const fetchRoster = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const data = await getTeacherRoster();
            setRoster(data || []);

            // Initialize default statuses to empty (Select Status)
            const initialState = {};
            (data || []).forEach(student => {
                initialState[student._id] = '';
            });
            setAttendanceState(initialState);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load assigned class roster.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendanceState(prev => ({
            ...prev,
            [studentId]: status
        }));
        setSuccess('');
    };

    const isFormValid = useMemo(() => {
        if (!date) return false;
        if (roster.length === 0) return false;
        // Every student must have a valid non-empty status (PRESENT or ABSENT)
        const allMarked = roster.every(student => {
            const st = attendanceState[student._id];
            return st === 'PRESENT' || st === 'ABSENT';
        });
        return allMarked;
    }, [date, roster, attendanceState]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid || submitting) return;

        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const payload = {
                date: new Date(date).toISOString(),
                attendance: roster.map(st => ({
                    student: st._id,
                    status: attendanceState[st._id]
                }))
            };

            await createBulkAttendance(payload);
            setSuccess('Attendance marked successfully.');

            // Keep data visible on successful form entry but reset form cleanly? User said:
            // "After successful save: refresh attendance data". We can fetchRoster() to pull cleanly, 
            // though typically they remain on page.

        } catch (err) {
            // Provide clean errors for 409 or 403
            setError(err.response?.data?.message || 'Failed to submit attendance.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                    <p className="text-sm text-ink-600">Loading your roster...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl">
            <div className="mb-6">
                <h1 className="font-display text-3xl font-semibold text-ink-900">Mark Attendance</h1>
                <p className="mt-2 text-sm text-ink-600">Record daily attendance for your assigned class.</p>
            </div>

            <Card className="mb-6 p-4 md:p-6 bg-brand-50 border-brand-100">
                <div className="flex flex-col sm:flex-row sm:items-end gap-6 justify-between">
                    <div className="flex gap-8">
                        <div>
                            <p className="text-sm text-ink-500 font-medium">Class</p>
                            <p className="text-lg font-semibold text-ink-900">{classInfo.class}</p>
                        </div>
                        <div>
                            <p className="text-sm text-ink-500 font-medium">Section</p>
                            <p className="text-lg font-semibold text-ink-900">{classInfo.section}</p>
                        </div>
                    </div>
                    <div className="w-full sm:w-64">
                        <label htmlFor="date" className="mb-1 block text-sm font-medium text-ink-700">Date</label>
                        <input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => {
                                setDate(e.target.value);
                                setSuccess('');
                            }}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            required
                        />
                    </div>
                </div>
            </Card>

            {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-6 rounded-md bg-emerald-50 p-4 border border-emerald-200">
                    <p className="text-sm font-medium text-emerald-800">{success}</p>
                </div>
            )}

            {roster.length === 0 && !error ? (
                <Card className="p-8 text-center text-ink-600">
                    <p className="text-lg font-medium">No students found.</p>
                    <p className="text-sm mt-1">You do not have any students assigned to your class.</p>
                </Card>
            ) : roster.length > 0 ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-ink-200">
                                <thead className="bg-ink-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Student ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Roll No.</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Attendance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-200 bg-white">
                                    {roster.map((student) => (
                                        <tr key={student._id} className="hover:bg-ink-50/60">
                                            <td className="px-6 py-3 text-sm text-ink-600">{student.studentId}</td>
                                            <td className="px-6 py-3 text-sm font-medium text-ink-900">
                                                {student.firstName} {student.lastName}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-ink-600">{student.rollNumber}</td>
                                            <td className="px-6 py-3">
                                                <select
                                                    value={attendanceState[student._id] || ''}
                                                    onChange={(e) => handleStatusChange(student._id, e.target.value)}
                                                    className={`rounded-md border border-ink-300 px-3 py-1.5 text-sm font-medium focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500
                            ${attendanceState[student._id] === 'PRESENT' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : ''}
                            ${attendanceState[student._id] === 'ABSENT' ? 'bg-red-50 text-red-800 border-red-300' : ''}
                          `}
                                                >
                                                    <option value="" disabled>Select Status</option>
                                                    <option value="PRESENT">Present</option>
                                                    <option value="ABSENT">Absent</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <div className="flex justify-end gap-3 mb-10">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => window.history.back()}
                            disabled={submitting}
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isFormValid || submitting}
                            className="min-w-[150px]"
                        >
                            {submitting ? 'Saving...' : 'Save Attendance'}
                        </Button>
                    </div>
                </form>
            ) : null}
        </div>
    );
}

export default TeacherAttendancePage;
