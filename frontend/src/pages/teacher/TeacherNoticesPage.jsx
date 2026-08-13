import React, { useState, useEffect, useCallback } from 'react';
import { getTeacherNotices } from '../../services/teacherNoticeApi';
const toast = { success: (m) => alert(m), error: (m) => alert(m) };

export default function TeacherNoticesPage() {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState({ page: 1, limit: 12, search: '', category: '', priority: '' });
    const [pagination, setPagination] = useState({ totalPages: 1, page: 1 });

    const fetchNotices = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getTeacherNotices(query);
            setNotices(data.notices);
            setPagination(data.pagination);
        } catch (err) {
            toast.error('Failed to load notices');
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Staff Noticeboard</h1>
                <p className="mt-2 text-gray-600">Important academic and administrative announcements.</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input type="text" placeholder="Search notices by title or content..." value={query.search} onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow" />
                <select value={query.category} onChange={(e) => setQuery({ ...query, category: e.target.value, page: 1 })} className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow">
                    <option value="">All Categories</option>
                    <option value="GENERAL">General</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="EXAMINATION">Examination</option>
                    <option value="ATTENDANCE">Attendance</option>
                    <option value="EVENT">Event</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="EMERGENCY">Emergency</option>
                </select>
                <select value={query.priority} onChange={(e) => setQuery({ ...query, priority: e.target.value, page: 1 })} className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow">
                    <option value="">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>
            ) : notices.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    <p className="text-lg font-medium">No notices found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notices.map(notice => (
                        <div key={notice._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all p-6 flex flex-col items-start relative overflow-hidden group">
                            {notice.priority === 'URGENT' && <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>}
                            {notice.priority === 'HIGH' && <div className="absolute top-0 right-0 w-1 h-full bg-orange-400"></div>}

                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{notice.category}</span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{notice.title}</h3>
                            <p className="text-gray-600 mb-6 flex-grow whitespace-pre-wrap line-clamp-4 leading-relaxed">{notice.content}</p>

                            <div className="w-full flex items-center justify-between text-xs font-medium text-gray-500 pt-4 border-t border-gray-100 mt-auto">
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    {notice.createdBy?.firstName} {notice.createdBy?.lastName}
                                </div>
                                <div className="flex items-center text-blue-600">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    {new Date(notice.publishedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && pagination.totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center gap-4">
                    <button
                        disabled={query.page <= 1}
                        onClick={() => setQuery({ ...query, page: query.page - 1 })}
                        className="px-5 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 font-semibold text-gray-700 shadow-sm"
                    >
                        ← Previous
                    </button>
                    <span className="text-gray-700 font-bold bg-white px-5 py-2 rounded-lg border border-gray-200 shadow-sm">
                        {query.page} / {pagination.totalPages}
                    </span>
                    <button
                        disabled={query.page >= pagination.totalPages}
                        onClick={() => setQuery({ ...query, page: query.page + 1 })}
                        className="px-5 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 font-semibold text-gray-700 shadow-sm"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
