import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { parentApi } from '../services/parentApi';

function ParentDashboardPage() {
  const [students, setStudents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [studentsRes, noticesRes] = await Promise.all([
        parentApi.getStudents(),
        parentApi.getNotices()
      ]);

      setStudents(studentsRes?.data || []);
      setNotices(noticesRes?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load parent dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8 text-ink-600">Loading your dashboard...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl pt-8 relative relative relative">
        <Card className="flex flex-col items-center justify-center p-8 text-center text-red-600">
          <p className="mb-4">{error}</p>
          <button onClick={fetchDashboardData} className="px-4 py-2 bg-brand-600 text-white rounded">Retry</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl relative">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Parent workspace</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Welcome</h1>
          <p className="mt-2 text-sm text-ink-600">You have {students.length} linked student(s).</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate('/homework')} className="px-5 py-2 font-medium bg-brand-100 text-brand-700 rounded-lg hover:bg-brand-200 transition-colors border border-brand-200">Homework</button>
          <button onClick={() => navigate('/leaves')} className="px-5 py-2 font-medium bg-brand-100 text-brand-700 rounded-lg hover:bg-brand-200 transition-colors border border-brand-200">Leave</button>
          <button onClick={() => navigate('/library')} className="px-5 py-2 font-medium bg-brand-100 text-brand-700 rounded-lg hover:bg-brand-200 transition-colors border border-brand-200">Library</button>
          <button onClick={() => navigate('/messages')} className="px-5 py-2 font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">Direct Messages</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-display font-medium text-ink-900 mb-4 border-b border-ink-100 pb-2">Your Children</h2>
          {students.length === 0 ? (
            <p className="text-sm text-ink-500">No students linked to your profile.</p>
          ) : (
            <ul className="space-y-4">
              {students.map((student) => (
                <li key={student._id} className="flex justify-between items-center py-2 border-b border-ink-50 last:border-b-0">
                  <div>
                    <p className="font-medium text-ink-900">{student.firstName} {student.lastName}</p>
                    <p className="text-xs text-ink-500">{student.class ? `Class: ${student.class} - ${student.section || ''}` : 'Class not assigned'}</p>
                  </div>
                  <button onClick={() => navigate(`/parent/students/${student._id}`)} className="text-sm text-brand-600 border border-brand-200 px-3 py-1 rounded hover:bg-brand-50">View details</button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-display font-medium text-ink-900 mb-4 border-b border-ink-100 pb-2">Recent Notices</h2>
          {notices.length === 0 ? (
            <p className="text-sm text-ink-500">No new notices for you.</p>
          ) : (
            <div>
              <ul className="space-y-3 mb-4">
                {notices.slice(0, 3).map((notice) => (
                  <li key={notice._id} className="border-l-2 border-brand-500 pl-3">
                    <p className="text-sm font-medium text-ink-900 truncate">{notice.title}</p>
                    <p className="text-xs text-ink-500">{new Date(notice.publishedAt).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/parent/notices')} className="w-full text-sm font-medium text-brand-600 py-2 border border-brand-200 rounded hover:bg-brand-50">View all</button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default ParentDashboardPage;
