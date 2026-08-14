import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import { parentApi } from '../../services/parentApi';

function ParentNoticesPage() {
    const navigate = useNavigate();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await parentApi.getNotices();
            setNotices(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load notices.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8">Loading notices...</div>;

    return (
        <div className="mx-auto w-full max-w-5xl relative">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-ink-900">School Notices</h1>
                    <p className="mt-2 text-sm text-ink-600">Important announcements securely filtered by linked profiles.</p>
                </div>
                <button onClick={() => navigate('/parent')} className="px-4 py-2 border border-ink-200 text-ink-700 rounded hover:bg-ink-50">Back to Dashboard</button>
            </div>

            {error ? (
                <Card className="p-8 text-center text-red-600">{error} <button onClick={fetchNotices} className="ml-4 underline">Retry</button></Card>
            ) : notices.length === 0 ? (
                <Card className="p-8"><p className="text-ink-600">No active notices available.</p></Card>
            ) : (
                <div className="space-y-4">
                    {notices.map((notice) => (
                        <Card key={notice._id} className="p-6">
                            <h2 className="text-lg font-medium text-brand-600">{notice.title}</h2>
                            <div className="mt-1 flex gap-2 text-xs text-ink-500 uppercase tracking-wide">
                                <span>Published: {new Date(notice.publishedAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>Category: {notice.category}</span>
                            </div>
                            <p className="mt-4 text-sm text-ink-800 whitespace-pre-wrap">{notice.content}</p>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ParentNoticesPage;
