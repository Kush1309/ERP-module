import React, { useState, useEffect, useCallback } from 'react';
import { getNotices, createNotice, updateNotice, deleteNotice, publishNotice, archiveNotice } from '../../services/noticeApi';
const toast = { success: (m) => alert(m), error: (m) => alert(m) };

export default function NoticeManagementPage() {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState({ page: 1, limit: 10, search: '', status: '', category: '', priority: '', audience: '' });
    const [pagination, setPagination] = useState({ totalPages: 1, page: 1 });
    const [selectedNotice, setSelectedNotice] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', content: '', category: 'GENERAL', priority: 'NORMAL', audience: 'ALL', targetClass: '', targetSection: '', expiresAt: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchNotices = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getNotices(query);
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

    const handleOpenModal = (notice = null) => {
        if (notice) {
            setSelectedNotice(notice);
            setFormData({
                title: notice.title,
                content: notice.content,
                category: notice.category,
                priority: notice.priority,
                audience: notice.audience,
                targetClass: notice.targetClass || '',
                targetSection: notice.targetSection || '',
                expiresAt: notice.expiresAt ? new Date(notice.expiresAt).toISOString().slice(0, 10) : ''
            });
        } else {
            setSelectedNotice(null);
            setFormData({ title: '', content: '', category: 'GENERAL', priority: 'NORMAL', audience: 'ALL', targetClass: '', targetSection: '', expiresAt: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        // Client-side stripping of unnecessary fields bound to schemas limits
        const safeData = { ...formData };
        if (safeData.audience === 'ALL' || safeData.audience === 'TEACHERS' || safeData.audience === 'STUDENTS') {
            delete safeData.targetClass;
            delete safeData.targetSection;
        }
        if (safeData.audience === 'SPECIFIC_CLASS') {
            delete safeData.targetSection;
        }

        try {
            if (selectedNotice) {
                await updateNotice(selectedNotice._id, safeData);
                toast.success('Notice updated successfully');
            } else {
                await createNotice(safeData);
                toast.success('Notice created successfully');
            }
            setIsModalOpen(false);
            fetchNotices();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save notice');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this notice?')) {
            try {
                await deleteNotice(id);
                toast.success('Notice deleted');
                fetchNotices();
            } catch (err) {
                toast.error('Failed to delete notice');
            }
        }
    };

    const handlePublish = async (id) => {
        if (window.confirm('Are you sure you want to publish this notice?')) {
            try {
                await publishNotice(id);
                toast.success('Notice published');
                fetchNotices();
            } catch (err) {
                toast.error('Failed to publish notice');
            }
        }
    };

    const handleArchive = async (id) => {
        if (window.confirm('Are you sure you want to archive this notice?')) {
            try {
                await archiveNotice(id);
                toast.success('Notice archived');
                fetchNotices();
            } catch (err) {
                toast.error('Failed to archive notice');
            }
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Notice Management</h1>
                <button onClick={() => handleOpenModal()} className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center py-2 px-6 rounded shadow transition-all">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Create Notice
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <input type="text" placeholder="Search notices..." value={query.search} onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                <select value={query.status} onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })} className="w-full px-4 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                </select>
                <select value={query.category} onChange={(e) => setQuery({ ...query, category: e.target.value, page: 1 })} className="w-full px-4 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">All Categories</option>
                    <option value="GENERAL">General</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="EXAMINATION">Examination</option>
                    <option value="ATTENDANCE">Attendance</option>
                    <option value="EVENT">Event</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="EMERGENCY">Emergency</option>
                </select>
                <select value={query.audience} onChange={(e) => setQuery({ ...query, audience: e.target.value, page: 1 })} className="w-full px-4 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">All Audiences</option>
                    <option value="ALL">All Users</option>
                    <option value="TEACHERS">Teachers Only</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="SPECIFIC_CLASS">Specific Class</option>
                    <option value="SPECIFIC_SECTION">Specific Section</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>
            ) : notices.length === 0 ? (
                <div className="text-center py-16 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    <p className="text-lg">No notices found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {notices.map(notice => (
                        <div key={notice._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-xl font-bold text-gray-900 line-clamp-2 pr-2">{notice.title}</h3>
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wide flex-shrink-0 ${notice.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                                    notice.status === 'ARCHIVED' ? 'bg-gray-100 text-gray-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {notice.status}
                                </span>
                            </div>
                            <p className="text-gray-600 mb-6 flex-grow whitespace-pre-wrap line-clamp-4">{notice.content}</p>

                            <div className="flex flex-wrap gap-2 mb-5">
                                <span className="bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold">{notice.category}</span>
                                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${notice.priority === 'URGENT' ? 'bg-red-50 border-red-200 text-red-700' :
                                    notice.priority === 'HIGH' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                        'bg-gray-50 border-gray-200 text-gray-700'
                                    }`}>{notice.priority} PRIORITY</span>
                                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                                    {notice.audience === 'SPECIFIC_SECTION' ? `CLASS ${notice.targetClass} ${notice.targetSection}` :
                                        notice.audience === 'SPECIFIC_CLASS' ? `CLASS ${notice.targetClass}` : notice.audience}
                                </span>
                            </div>

                            <div className="text-sm font-medium text-gray-500 mb-5 pb-5 border-b border-gray-100">
                                👤 {notice.createdBy?.firstName} {notice.createdBy?.lastName}
                                <br />
                                📅 {notice.publishedAt ? `Published: ${new Date(notice.publishedAt).toLocaleDateString()}` : `Created: ${new Date(notice.createdAt).toLocaleDateString()}`}
                                {notice.expiresAt && <><br />⏳ Expires: {new Date(notice.expiresAt).toLocaleDateString()}</>}
                            </div>

                            <div className="flex flex-wrap gap-2 mt-auto">
                                <button onClick={() => handleOpenModal(notice)} className="flex-1 bg-gray-50 hover:bg-gray-100 text-blue-600 font-semibold py-2 rounded-md transition-colors text-sm">Edit</button>
                                {notice.status === 'DRAFT' && <button onClick={() => handlePublish(notice._id)} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-2 rounded-md transition-colors text-sm">Publish</button>}
                                {notice.status === 'PUBLISHED' && <button onClick={() => handleArchive(notice._id)} className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold py-2 rounded-md transition-colors text-sm">Archive</button>}
                                <button onClick={() => handleDelete(notice._id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 rounded-md transition-colors text-sm">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && pagination.totalPages > 1 && (
                <div className="mt-10 flex justify-center items-center gap-4">
                    <button
                        disabled={query.page <= 1}
                        onClick={() => setQuery({ ...query, page: query.page - 1 })}
                        className="px-5 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 font-medium text-gray-700 shadow-sm"
                    >
                        ← Previous
                    </button>
                    <span className="text-gray-600 font-semibold bg-white px-4 py-2 rounded-md border border-gray-200">
                        Page {query.page} of {pagination.totalPages}
                    </span>
                    <button
                        disabled={query.page >= pagination.totalPages}
                        onClick={() => setQuery({ ...query, page: query.page + 1 })}
                        className="px-5 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 font-medium text-gray-700 shadow-sm"
                    >
                        Next →
                    </button>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                        <div className="p-6 md:p-8">
                            <h2 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-4">{selectedNotice ? '📝 Edit Notice' : '✨ Create Notice'}</h2>
                            <form onSubmit={handleSave} className="space-y-6">

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Title *</label>
                                    <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Enter notice title" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Content *</label>
                                    <textarea required rows="5" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Enter full notice content here..." />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-lg border border-gray-100">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
                                        <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                            <option value="GENERAL">General</option>
                                            <option value="ACADEMIC">Academic</option>
                                            <option value="EXAMINATION">Examination</option>
                                            <option value="ATTENDANCE">Attendance</option>
                                            <option value="EVENT">Event</option>
                                            <option value="HOLIDAY">Holiday</option>
                                            <option value="EMERGENCY">Emergency</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Priority *</label>
                                        <select required value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                            <option value="LOW">Low</option>
                                            <option value="NORMAL">Normal</option>
                                            <option value="HIGH">High</option>
                                            <option value="URGENT">Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-lg border border-gray-100">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Audience Target *</label>
                                        <select required value={formData.audience} onChange={e => setFormData({ ...formData, audience: e.target.value })} className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                            <option value="ALL">All Users (Students & Teachers)</option>
                                            <option value="TEACHERS">Teachers Only</option>
                                            <option value="STUDENTS">Students Only</option>
                                            <option value="SPECIFIC_CLASS">Specific Class</option>
                                            <option value="SPECIFIC_SECTION">Specific Section</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Expiration Date (Optional)</label>
                                        <input type="date" value={formData.expiresAt} min={new Date().toISOString().slice(0, 10)} onChange={e => setFormData({ ...formData, expiresAt: e.target.value })} className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                    </div>
                                </div>

                                {(formData.audience === 'SPECIFIC_CLASS' || formData.audience === 'SPECIFIC_SECTION') && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-blue-50 border border-blue-100 rounded-lg">
                                        <div>
                                            <label className="block text-sm font-bold text-blue-900 mb-2">Target Class *</label>
                                            <input required type="text" value={formData.targetClass} onChange={e => setFormData({ ...formData, targetClass: e.target.value })} placeholder="e.g. 10" className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        {formData.audience === 'SPECIFIC_SECTION' && (
                                            <div>
                                                <label className="block text-sm font-bold text-blue-900 mb-2">Target Section *</label>
                                                <input required type="text" value={formData.targetSection} onChange={e => setFormData({ ...formData, targetSection: e.target.value })} placeholder="e.g. A" className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end gap-4 pt-6 mt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold transition-colors">Cancel</button>
                                    <button disabled={isSubmitting} type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-colors disabled:opacity-75 flex items-center">
                                        {isSubmitting && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                        {selectedNotice ? 'Update Notice' : 'Save as Draft'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
