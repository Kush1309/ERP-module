import { useState, useEffect } from 'react';
import { getTeacherTimetables } from '../../services/teacherTimetableApi';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function TeacherTimetablePage() {
    const [timetables, setTimetables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filters, setFilters] = useState({ dayOfWeek: '' });

    const fetchTimetables = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await getTeacherTimetables({ ...filters, limit: 100 });
            // Setting high limit simplifying pagination for weekly view.
            setTimetables(result?.timetables || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load teacher timetable');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimetables();
    }, [filters]);

    return (
        <div className="mx-auto w-full max-w-6xl pb-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-ink-900">My Timetable</h1>
                    <p className="mt-2 text-ink-600">View your class schedule.</p>
                </div>
            </div>

            <Card className="p-6 mb-6">
                <div className="flex gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">Day of Week</label>
                        <select
                            className="w-full rounded-lg border border-ink-200 px-3 py-2"
                            value={filters.dayOfWeek}
                            onChange={(e) => setFilters({ ...filters, dayOfWeek: e.target.value })}
                        >
                            <option value="">All Days</option>
                            <option value="MONDAY">Monday</option>
                            <option value="TUESDAY">Tuesday</option>
                            <option value="WEDNESDAY">Wednesday</option>
                            <option value="THURSDAY">Thursday</option>
                            <option value="FRIDAY">Friday</option>
                            <option value="SATURDAY">Saturday</option>
                            <option value="SUNDAY">Sunday</option>
                        </select>
                    </div>
                </div>
            </Card>

            {loading ? (
                <div className="flex justify-center p-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"></div>
                </div>
            ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-red-700">{error}</p>
                    <Button type="button" onClick={fetchTimetables} className="mt-4">Retry</Button>
                </div>
            ) : timetables.length === 0 ? (
                <div className="rounded-xl border border-ink-200 bg-white p-10 text-center">
                    <p className="text-ink-500">No timetable entries found.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {timetables.map((t) => (
                        <Card key={t._id} className="p-4 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-ink-900">{t.dayOfWeek}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{t.status}</span>
                            </div>
                            <div className="text-sm text-ink-600 mb-1">{t.startTime} - {t.endTime}</div>
                            <div className="text-sm font-medium text-ink-800">{t.subject?.name || t.subject?.subjectName}</div>
                            <div className="text-sm text-ink-600 mt-2">Class: {t.class} ({t.section})</div>
                            <div className="text-sm text-ink-600">Room: {t.room}</div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
