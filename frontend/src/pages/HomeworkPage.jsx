import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getHomeworks,
    createHomework,
    updateHomework,
    deleteHomework
} from '../services/homeworkApi';
import Modal from '../components/Modal';
import Button from '../components/Button';

function HomeworkPage() {
    const { user } = useAuth();
    const isEditingAllowed = user?.role === 'ADMIN' || user?.role === 'TEACHER';

    const [homeworks, setHomeworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        class: '',
        section: '',
        subject: '',
        dueDate: '',
        status: 'DRAFT',
    });

    const [viewOnlyHomework, setViewOnlyHomework] = useState(null);

    const fetchHomeworks = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {};
            if (search) params.search = search;
            if (classFilter) params.class = classFilter;
            if (sectionFilter) params.section = sectionFilter;

            const data = await getHomeworks(params);
            setHomeworks(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch homework');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHomeworks();
    }, [search, classFilter, sectionFilter]);

    const handleOpenModal = (hw = null) => {
        if (!isEditingAllowed) return;
        if (hw) {
            setSelectedHomework(hw);
            setFormData({
                title: hw.title,
                description: hw.description || '',
                class: hw.class,
                section: hw.section,
                subject: hw.subject,
                dueDate: hw.dueDate ? hw.dueDate.split('T')[0] : '',
                status: hw.status,
            });
        } else {
            setSelectedHomework(null);
            setFormData({
                title: '',
                description: '',
                class: '',
                section: '',
                subject: '',
                dueDate: '',
                status: 'DRAFT',
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedHomework(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isEditingAllowed) return;
        setIsSubmitting(true);
        setError(null);
        try {
            if (selectedHomework) {
                await updateHomework(selectedHomework._id, formData);
            } else {
                await createHomework(formData);
            }
            handleCloseModal();
            fetchHomeworks();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save homework');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!isEditingAllowed) return;
        if (window.confirm('Are you sure you want to delete this homework?')) {
            try {
                await deleteHomework(id);
                fetchHomeworks();
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to delete homework');
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-ink-900">Homework & Assignments</h1>
                    <p className="mt-2 text-sm text-ink-500">
                        {isEditingAllowed
                            ? 'Manage assignments, materials, and due dates.'
                            : 'View assignments and upcoming deadlines.'}
                    </p>
                </div>
                {isEditingAllowed && (
                    <div className="mt-4 sm:mt-0">
                        <Button
                            onClick={() => handleOpenModal()}
                            className="whitespace-nowrap"
                        >
                            + Create Homework
                        </Button>
                    </div>
                )}
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <input
                    type="text"
                    placeholder="Search homework..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {isEditingAllowed && (
                    <>
                        <input
                            type="text"
                            placeholder="Filter by Class"
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                        <input
                            type="text"
                            placeholder="Filter by Section"
                            value={sectionFilter}
                            onChange={(e) => setSectionFilter(e.target.value)}
                            className="block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </>
                )}
            </div>

            {error && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-600">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
            ) : homeworks.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-ink-200">
                    <h3 className="text-sm font-medium text-ink-900">No homework found</h3>
                    <p className="mt-1 text-sm text-ink-500">
                        {search ? 'Try adjusting your search criteria.' : 'Assignments will appear here when they are created.'}
                    </p>
                    {error && <button onClick={fetchHomeworks} className="mt-4 text-brand-600 text-sm hover:underline">Retry</button>}
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {homeworks.map((hw) => (
                        <div key={hw._id} className="bg-white rounded-xl border border-ink-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5" onClick={() => !isEditingAllowed && setViewOnlyHomework(hw)}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${hw.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {hw.status}
                                    </span>
                                    <span className="text-xs text-ink-500">{hw.subject}</span>
                                </div>
                                <h3 className="text-lg font-medium text-ink-900 mb-1 cursor-pointer" onClick={() => setViewOnlyHomework(hw)}>{hw.title}</h3>
                                <p className="text-sm text-ink-500 mb-4 line-clamp-2">{hw.description}</p>

                                <div className="flex items-center justify-between text-sm text-ink-500">
                                    <span>Class: {hw.class}-{hw.section}</span>
                                    {hw.dueDate && (
                                        <span className={new Date(hw.dueDate) < new Date() ? 'text-red-600' : ''}>
                                            Due: {new Date(hw.dueDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {isEditingAllowed && (
                                <div className="px-5 py-3 border-t border-ink-100 bg-ink-50 flex justify-end space-x-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setViewOnlyHomework(hw); }}
                                        className="text-sm text-brand-600 hover:text-brand-900"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleOpenModal(hw); }}
                                        className="text-sm text-brand-600 hover:text-brand-900"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(hw._id); }}
                                        className="text-sm text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedHomework ? "Edit Homework" : "Create Homework"}>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div>
                        <label className="block text-sm font-medium text-ink-700">Title <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-ink-700">Class <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="class"
                                value={formData.class}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700">Section <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="section"
                                value={formData.section}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-ink-700">Subject <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700">Due Date</label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                        </select>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCloseModal}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Homework'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Details Modal */}
            <Modal isOpen={!!viewOnlyHomework} onClose={() => setViewOnlyHomework(null)} title="Homework Details">
                {viewOnlyHomework && (
                    <div className="space-y-4 pt-4">
                        <div>
                            <h3 className="text-xl font-medium text-ink-900">{viewOnlyHomework.title}</h3>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-ink-500">
                                <span>Subject: {viewOnlyHomework.subject}</span>
                                <span>Class: {viewOnlyHomework.class}-{viewOnlyHomework.section}</span>
                            </div>
                        </div>
                        <div className="border-t border-ink-200 pt-4">
                            <p className="text-sm text-ink-800 whitespace-pre-wrap">{viewOnlyHomework.description || 'No description provided.'}</p>
                        </div>
                        {viewOnlyHomework.dueDate && (
                            <div className="border-t border-ink-200 pt-4 flex justify-between items-center text-sm">
                                <span className="font-medium text-ink-900">Due Date:</span>
                                <span className={new Date(viewOnlyHomework.dueDate) < new Date() ? 'text-red-600' : 'text-ink-600'}>
                                    {new Date(viewOnlyHomework.dueDate).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        {viewOnlyHomework.teacherId && (
                            <div className="pt-2 flex justify-between items-center text-sm">
                                <span className="font-medium text-ink-900">Assigned By:</span>
                                <span className="text-ink-600">
                                    {viewOnlyHomework.teacherId.firstName} {viewOnlyHomework.teacherId.lastName}
                                </span>
                            </div>
                        )}
                        <div className="mt-6 flex justify-end">
                            <Button
                                onClick={() => setViewOnlyHomework(null)}
                                variant="secondary"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default HomeworkPage;
