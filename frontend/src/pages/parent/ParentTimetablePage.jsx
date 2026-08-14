import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import { parentApi } from '../../services/parentApi';

function ParentTimetablePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTimetable();
    }, [id]);

    const fetchTimetable = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await parentApi.getStudentTimetable(id);
            setTimetable(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load timetable.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8">Loading timetable...</div>;

    return (
        <div className="mx-auto w-full max-w-5xl relative">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-ink-900">Class Timetable</h1>
                    <p className="mt-2 text-sm text-ink-600">View weekly academic schedules linked securely.</p>
                </div>
                <button onClick={() => navigate(`/parent/students/${id}`)} className="px-4 py-2 border border-ink-200 text-ink-700 rounded hover:bg-ink-50">Back to profile</button>
            </div>

            {error ? (
                <Card className="p-8 text-center text-red-600">{error} <button onClick={fetchTimetable} className="ml-4 underline">Retry</button></Card>
            ) : timetable.length === 0 ? (
                <Card className="p-8"><p className="text-ink-600">No timetable records found.</p></Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-ink-200">
                            <thead className="bg-ink-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Day</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Room</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Teacher</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-100 bg-white">
                                {timetable.map((row) => (
                                    <tr key={row._id} className="hover:bg-ink-50/40">
                                        <td className="px-6 py-3 text-sm font-medium text-ink-900">{row.dayOfWeek}</td>
                                        <td className="px-6 py-3 text-sm text-ink-600">{row.subject?.name || '-'}</td>
                                        <td className="px-6 py-3 text-sm text-ink-600">{row.startTime} - {row.endTime}</td>
                                        <td className="px-6 py-3 text-sm text-ink-600">{row.room}</td>
                                        <td className="px-6 py-3 text-sm text-ink-600">{row.teacher ? `${row.teacher.firstName} ${row.teacher.lastName}` : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

export default ParentTimetablePage;
