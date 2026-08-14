import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import { parentApi } from '../../services/parentApi';

function ParentStudentDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStudent();
    }, [id]);

    const fetchStudent = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await parentApi.getStudentById(id);
            setStudent(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load student details.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8 text-ink-600">Loading student details...</div>;
    }

    if (error || !student) {
        return (
            <div className="mx-auto w-full max-w-4xl pt-8">
                <Card className="flex flex-col items-center justify-center p-8 text-center text-red-600">
                    <p className="mb-4">{error || 'Student not found.'}</p>
                    <button onClick={() => navigate('/parent')} className="px-4 py-2 border border-brand-600 text-brand-600 rounded">Back</button>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl relative">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Student Profile</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">{student.firstName} {student.lastName}</h1>
                    <p className="mt-2 text-sm text-ink-600">{student.class ? `Class ${student.class} - ${student.section || ''}` : 'Class not assigned'}</p>
                </div>
                <button onClick={() => navigate('/parent')} className="px-4 py-2 border border-ink-200 text-ink-700 rounded hover:bg-ink-50">Back</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 text-center flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-display font-medium text-ink-900 mb-2">Attendance</h2>
                        <p className="text-sm text-ink-500 mb-6">View daily attendance records, tracking present and absent days.</p>
                    </div>
                    <button onClick={() => navigate(`/parent/attendance/${id}`)} className="w-full px-4 py-2 bg-brand-600 text-white rounded">View Attendance</button>
                </Card>

                <Card className="p-6 text-center flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-display font-medium text-ink-900 mb-2">Examinations</h2>
                        <p className="text-sm text-ink-500 mb-6">Review marks, grades, and academic status across sessions.</p>
                    </div>
                    <button onClick={() => navigate(`/parent/results/${id}`)} className="w-full px-4 py-2 bg-brand-600 text-white rounded">View Results</button>
                </Card>

                <Card className="p-6 text-center flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-display font-medium text-ink-900 mb-2">Timetable</h2>
                        <p className="text-sm text-ink-500 mb-6">Check weekly class schedules, subjects, and teachers.</p>
                    </div>
                    <button onClick={() => navigate(`/parent/timetable/${id}`)} className="w-full px-4 py-2 bg-brand-600 text-white rounded">View Timetable</button>
                </Card>
            </div>
        </div>
    );
}

export default ParentStudentDetailsPage;
