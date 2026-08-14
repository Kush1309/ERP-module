import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getLeaves,
    createLeave,
    updateLeave,
    deleteLeave,
    updateLeaveStatus
} from '../services/leaveApi';
import Modal from '../components/Modal';

function LeavePage() {
    const { user } = useAuth();

    const isAdmin = user?.role === 'ADMIN';
    const isParent = user?.role === 'PARENT';
    const canCreate = user?.role === 'STUDENT' || user?.role === 'TEACHER';

    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [statusFilter, setStatusFilter] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        type: 'SICK',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const [viewOnlyLeave, setViewOnlyLeave] = useState(null);

    const [adminActionLeave, setAdminActionLeave] = useState(null);
    const [adminComment, setAdminComment] = useState('');

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {};
            if (statusFilter) params.status = statusFilter;

            const data = await getLeaves(params);
            setLeaves(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch leaves');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, [statusFilter]);

    const handleOpenModal = (lv = null) => {
        if (!canCreate) return;
        if (lv) {
            setSelectedLeave(lv);
            setFormData({
                type: lv.type,
                startDate: lv.startDate ? lv.startDate.split('T')[0] : '',
                endDate: lv.endDate ? lv.endDate.split('T')[0] : '',
                reason: lv.reason || '',
            });
        } else {
            setSelectedLeave(null);
            setFormData({
                type: 'SICK',
                startDate: '',
                endDate: '',
                reason: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedLeave(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canCreate) return;
        setIsSubmitting(true);
        setError(null);
        try {
            if (selectedLeave) {
                await updateLeave(selectedLeave._id, formData);
            } else {
                await createLeave(formData);
            }
            handleCloseModal();
            fetchLeaves();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save leave request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!canCreate) return;
        if (window.confirm('Are you sure you want to cancel this leave request?')) {
            try {
                await deleteLeave(id);
                fetchLeaves();
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to cancel leave request');
            }
        }
    };

    const handleAdminAction = async (status) => {
        if (!isAdmin || !adminActionLeave) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await updateLeaveStatus(adminActionLeave._id, status, adminComment);
            setAdminActionLeave(null);
            setAdminComment('');
            fetchLeaves();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update leave status');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-ink-900">Leave Management</h1>
                    <p className="mt-2 text-sm text-ink-500">
                        {isAdmin
                            ? 'Manage and approve leave requests.'
                            : isParent
                                ? 'View leave requests for your linked students.'
                                : 'Submit and track your leave requests.'}
                    </p>
                </div>
                {canCreate && (
                    <div className="mt-4 sm:mt-0">
                        <button
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
                        >
                            Apply for Leave
                        </button>
                    </div>
                )}
            </div>

            <div className="mb-6 flex gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block rounded-lg border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
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
            ) : leaves.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-ink-200">
                    <h3 className="text-sm font-medium text-ink-900">No leave requests found</h3>
                    <p className="mt-1 text-sm text-ink-500">
                        {statusFilter ? 'Try adjusting your filters.' : 'There are no leave requests.'}
                    </p>
                    {error && <button onClick={fetchLeaves} className="mt-4 text-brand-600 text-sm hover:underline">Retry</button>}
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {leaves.map((lv) => (
                        <div key={lv._id} className="bg-white rounded-xl border border-ink-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5" onClick={() => setViewOnlyLeave(lv)}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lv.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                            lv.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {lv.status}
                                    </span>
                                    <span className="text-xs font-medium text-ink-500">{lv.type}</span>
                                </div>
                                <h3 className="text-sm font-medium text-ink-900 mb-1">
                                    {lv.requesterId ? `${lv.requesterId.firstName} ${lv.requesterId.lastName}` : 'Unknown Requester'}
                                    <span className="text-xs text-ink-500 ml-2">({lv.requesterModel})</span>
                                </h3>
                                <p className="text-sm text-ink-500 mb-4 line-clamp-2">{lv.reason}</p>

                                <div className="flex items-center justify-between text-xs text-ink-500">
                                    <span>From: {new Date(lv.startDate).toLocaleDateString()}</span>
                                    <span>To: {new Date(lv.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="px-5 py-3 border-t border-ink-100 bg-ink-50 flex justify-end space-x-3">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setViewOnlyLeave(lv); }}
                                    className="text-sm text-brand-600 hover:text-brand-900"
                                >
                                    View
                                </button>

                                {canCreate && lv.status === 'PENDING' && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenModal(lv); }}
                                            className="text-sm text-brand-600 hover:text-brand-900"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(lv._id); }}
                                            className="text-sm text-red-600 hover:text-red-900"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}

                                {isAdmin && lv.status === 'PENDING' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setAdminActionLeave(lv);
                                            setAdminComment('');
                                        }}
                                        className="text-sm text-brand-600 hover:text-brand-900 font-medium"
                                    >
                                        Review
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedLeave ? "Edit Leave Request" : "Apply for Leave"}>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div>
                        <label className="block text-sm font-medium text-ink-700">Leave Type <span className="text-red-500">*</span></label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                        >
                            <option value="SICK">Sick</option>
                            <option value="CASUAL">Casual</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-ink-700">Start Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700">End Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                                min={formData.startDate}
                                className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700">Reason <span className="text-red-500">*</span></label>
                        <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            required
                            rows={3}
                            className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                        />
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            disabled={isSubmitting}
                            className="rounded-md border border-ink-300 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm hover:bg-ink-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex justify-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Details Modal */}
            <Modal isOpen={!!viewOnlyLeave} onClose={() => setViewOnlyLeave(null)} title="Leave Details">
                {viewOnlyLeave && (
                    <div className="space-y-4 pt-4">
                        <div>
                            <h3 className="text-lg font-medium text-ink-900">
                                {viewOnlyLeave.requesterId ? `${viewOnlyLeave.requesterId.firstName} ${viewOnlyLeave.requesterId.lastName}` : 'Unknown'}
                                <span className="text-sm font-normal text-ink-500 ml-2">({viewOnlyLeave.requesterModel})</span>
                            </h3>
                            <div className="mt-1 flex items-center space-x-4 text-sm text-ink-500">
                                <span className={`font-medium ${viewOnlyLeave.status === 'APPROVED' ? 'text-green-600' :
                                        viewOnlyLeave.status === 'REJECTED' ? 'text-red-600' :
                                            'text-yellow-600'
                                    }`}>
                                    Status: {viewOnlyLeave.status}
                                </span>
                                <span>Type: {viewOnlyLeave.type}</span>
                            </div>
                        </div>
                        <div className="border-t border-ink-200 pt-4 text-sm font-medium flex justify-between">
                            <span>From: {new Date(viewOnlyLeave.startDate).toLocaleDateString()}</span>
                            <span>To: {new Date(viewOnlyLeave.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="border-t border-ink-200 pt-4">
                            <span className="block text-sm font-medium text-ink-700 mb-1">Reason:</span>
                            <p className="text-sm text-ink-800 whitespace-pre-wrap bg-ink-50 rounded-md p-3 border border-ink-100">{viewOnlyLeave.reason}</p>
                        </div>
                        {viewOnlyLeave.adminComment && (
                            <div className="border-t border-ink-200 pt-4">
                                <span className="block text-sm font-medium text-ink-700 mb-1">Admin Comment:</span>
                                <p className="text-sm text-ink-800 whitespace-pre-wrap bg-amber-50 rounded-md p-3 border border-amber-100">{viewOnlyLeave.adminComment}</p>
                            </div>
                        )}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setViewOnlyLeave(null)}
                                className="rounded-md border border-ink-300 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm hover:bg-ink-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Admin Action Modal */}
            <Modal isOpen={!!adminActionLeave} onClose={() => setAdminActionLeave(null)} title="Review Leave Request">
                {adminActionLeave && (
                    <div className="space-y-4 pt-4">
                        <div className="text-sm text-ink-700 mb-4 bg-ink-50 p-3 rounded-md border border-ink-200">
                            <strong>Requester:</strong> {adminActionLeave.requesterId ? `${adminActionLeave.requesterId.firstName} ${adminActionLeave.requesterId.lastName}` : 'Unknown'}<br />
                            <strong>Type:</strong> {adminActionLeave.type}<br />
                            <strong>Dates:</strong> {new Date(adminActionLeave.startDate).toLocaleDateString()} — {new Date(adminActionLeave.endDate).toLocaleDateString()}<br />
                            <div className="mt-2">
                                <strong>Reason:</strong>
                                <p className="mt-1 whitespace-pre-wrap">{adminActionLeave.reason}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-700">Admin Comment (Optional)</label>
                            <textarea
                                value={adminComment}
                                onChange={(e) => setAdminComment(e.target.value)}
                                rows={2}
                                placeholder="Explain your decision (optional)..."
                                className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                            />
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setAdminActionLeave(null)}
                                disabled={isSubmitting}
                                className="rounded-md border border-ink-300 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm hover:bg-ink-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAdminAction('REJECTED')}
                                disabled={isSubmitting}
                                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Processing...' : 'Reject'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAdminAction('APPROVED')}
                                disabled={isSubmitting}
                                className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Processing...' : 'Approve'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default LeavePage;
