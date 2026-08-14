import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import { parentApi } from '../../services/parentApi';

function ParentResultsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchResults();
    }, [id]);

    const fetchResults = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await parentApi.getStudentResults(id);
            setResults(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load results.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8">Loading results...</div>;

    return (
        <div className="mx-auto w-full max-w-5xl relative">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-ink-900">Examination Results</h1>
                    <p className="mt-2 text-sm text-ink-600">Review all validated marks and grades securely.</p>
                </div>
                <button onClick={() => navigate(`/parent/students/${id}`)} className="px-4 py-2 border border-ink-200 text-ink-700 rounded hover:bg-ink-50">Back to profile</button>
            </div>

            {error ? (
                <Card className="p-8 text-center text-red-600">{error} <button onClick={fetchResults} className="ml-4 underline">Retry</button></Card>
            ) : results.length === 0 ? (
                <Card className="p-8"><p className="text-ink-600">No examination results found.</p></Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-ink-200">
                            <thead className="bg-ink-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Exam</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Session</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Marks</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Percentage</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Grade</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-100 bg-white">
                                {results.map((row) => (
                                    <tr key={row._id} className="hover:bg-ink-50/40">
                                        <td className="px-6 py-3 text-sm font-medium text-ink-900">{row.exam?.name || '-'}</td>
                                        <td className="px-6 py-3 text-sm text-ink-600">{row.exam?.academicSession || '-'}</td>
                                        <td className="px-6 py-3 text-sm text-ink-600">{row.subject?.name || '-'}</td>
                                        <td className="px-6 py-3 text-sm text-ink-900">{row.obtainedMarks}/{row.maximumMarks}</td>
                                        <td className="px-6 py-3 text-sm text-ink-600">{row.percentage}%</td>
                                        <td className="px-6 py-3 text-sm font-medium">{row.grade}</td>
                                        <td className="px-6 py-3 text-sm">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                {row.status}
                                            </span>
                                        </td>
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

export default ParentResultsPage;
