import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import { parentApi } from '../../services/parentApi';

function ParentAttendancePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAttendance();
    }, [id]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await parentApi.getStudentAttendance(id);
            setAttendance(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load attendance.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8">Loading attendance...</div>;

    return (
        <div className="mx-auto w-full max-w-5xl relative">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-ink-900">Student Attendance</h1>
                    <p className="mt-2 text-sm text-ink-600">Review daily attendance logs securely.</p>
                </div>
                <button onClick={() => navigate(`/parent/students/${id}`)} className="px-4 py-2 border border-ink-200 text-ink-700 rounded hover:bg-ink-50">Back to profile</button>
            </div>

            {error ? (
                <Card className="p-8 text-center text-red-600">{error} <button onClick={fetchAttendance} className="ml-4 underline">Retry</button></Card>
            ) : attendance.length === 0 ? (
                <Card className="p-8"><p className="text-ink-600">No attendance records found.</p></Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-ink-200">
                            <thead className="bg-ink-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-100 bg-white">
                                {attendance.map((row) => (
                                    <tr key={row._id} className="hover:bg-ink-50/40">
                                        <td className="px-6 py-3 text-sm font-medium text-ink-900">{new Date(row.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-3 text-sm">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-ink-600">{row.remarks || '-'}</td>
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
export default ParentAttendancePage;
