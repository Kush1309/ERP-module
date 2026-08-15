import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    listFeeStructures,
    getFeeStructure,
    createFeeStructure,
    updateFeeStructure,
    deleteFeeStructure,
    listFeeRecords,
    createFeeRecord,
    payFeeRecord
} from '../services/feeApi';
import Modal from '../components/Modal';
import Button from '../components/Button';

function FeePage() {
    const { user } = useAuth();

    // RBAC permissions
    const isAdmin = user?.role === 'ADMIN';
    const isTeacher = user?.role === 'TEACHER';
    const isStudentOrParent = user?.role === 'STUDENT' || user?.role === 'PARENT';

    // Determine default tab based on role
    const initialTab = (isAdmin || isTeacher) ? 'structures' : 'records';
    const [activeTab, setActiveTab] = useState(initialTab);

    const [structures, setStructures] = useState([]);
    const [records, setRecords] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search & Filters
    const [search, setSearch] = useState('');
    const [academicYear, setAcademicYear] = useState('');
    const [studentId, setStudentId] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modals
    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [viewOnlyItem, setViewOnlyItem] = useState(null);

    const [selectedStructure, setSelectedStructure] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Forms
    const [structureForm, setStructureForm] = useState({
        title: '',
        amount: '',
        dueDate: '',
        applicableClasses: '',
        academicYear: '',
        status: 'ACTIVE'
    });
    const [recordForm, setRecordForm] = useState({
        studentId: '',
        feeStructureId: '',
        amountDue: ''
    });
    const [paymentAmount, setPaymentAmount] = useState('');

    const fetchStructures = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {};
            if (search) params.search = search;
            if (academicYear) params.academicYear = academicYear;
            if (statusFilter) params.status = statusFilter;

            const data = await listFeeStructures(params);
            setStructures(data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch fee structures');
        } finally {
            setLoading(false);
        }
    };

    const fetchRecords = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {};
            if (studentId) params.studentId = studentId;
            if (statusFilter) params.status = statusFilter;

            const data = await listFeeRecords(params);
            setRecords(data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch fee records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'structures' && (isAdmin || isTeacher)) {
            fetchStructures();
        } else if (activeTab === 'records') {
            fetchRecords();
        }
    }, [activeTab, search, academicYear, statusFilter, studentId]);

    // Structure Handlers
    const openStructureModal = (st = null) => {
        if (!isAdmin) return;
        if (st) {
            setSelectedStructure(st);
            setStructureForm({
                title: st.title,
                amount: st.amount,
                dueDate: st.dueDate ? st.dueDate.split('T')[0] : '',
                applicableClasses: Array.isArray(st.applicableClasses) ? st.applicableClasses.join(', ') : st.applicableClasses,
                academicYear: st.academicYear,
                status: st.status
            });
        } else {
            setSelectedStructure(null);
            setStructureForm({
                title: '',
                amount: '',
                dueDate: '',
                applicableClasses: '',
                academicYear: '',
                status: 'ACTIVE'
            });
        }
        setIsStructureModalOpen(true);
    };

    const submitStructure = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const dataToSubmit = {
                ...structureForm,
                amount: Number(structureForm.amount),
                applicableClasses: structureForm.applicableClasses.split(',').map(s => s.trim())
            };
            if (selectedStructure) {
                await updateFeeStructure(selectedStructure._id, dataToSubmit);
            } else {
                await createFeeStructure(dataToSubmit);
            }
            setIsStructureModalOpen(false);
            fetchStructures();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save fee structure');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStructure = async (id) => {
        if (!isAdmin) return;
        if (window.confirm('Are you sure you want to delete this fee structure?')) {
            try {
                await deleteFeeStructure(id);
                fetchStructures();
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to delete fee structure');
            }
        }
    };

    // Record Handlers
    const openRecordModal = () => {
        if (!isAdmin) return;
        setSelectedRecord(null);
        setRecordForm({ studentId: '', feeStructureId: '', amountDue: '' });
        setIsRecordModalOpen(true);
    };

    const submitRecord = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const dataToSubmit = {
                studentId: recordForm.studentId,
                feeStructureId: recordForm.feeStructureId,
            };
            if (recordForm.amountDue) dataToSubmit.amountDue = Number(recordForm.amountDue);
            await createFeeRecord(dataToSubmit);
            setIsRecordModalOpen(false);
            fetchRecords();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign fee record');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Payment Handlers
    const openPaymentModal = (record) => {
        if (!isAdmin) return;
        setSelectedRecord(record);
        setPaymentAmount('');
        setIsPaymentModalOpen(true);
    };

    const submitPayment = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await payFeeRecord(selectedRecord._id, { paymentAmount: Number(paymentAmount) });
            setIsPaymentModalOpen(false);
            fetchRecords();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to process payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
            case 'PENDING': return 'bg-gray-100 text-gray-800';
            case 'OVERDUE': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-ink-900">Fee Management</h1>
                    <p className="mt-2 text-sm text-ink-500">
                        {isAdmin ? 'Manage fee structures and process student payments.' : 'View fee requirements and records.'}
                    </p>
                </div>
                {isAdmin && (
                    <div className="mt-4 sm:mt-0 flex space-x-3">
                        {activeTab === 'structures' ? (
                            <Button
                                onClick={() => openStructureModal()}
                                className="whitespace-nowrap"
                            >
                                + Create Structure
                            </Button>
                        ) : (
                            <Button
                                onClick={() => openRecordModal()}
                                className="whitespace-nowrap"
                            >
                                + Assign Fee
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {(isAdmin || isTeacher) && (
                <div className="mb-6 border-b border-ink-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('structures')}
                            className={`${activeTab === 'structures' ? 'border-brand-500 text-brand-600' : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Fee Structures
                        </button>
                        <button
                            onClick={() => setActiveTab('records')}
                            className={`${activeTab === 'records' ? 'border-brand-500 text-brand-600' : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Student Records
                        </button>
                    </nav>
                </div>
            )}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                {activeTab === 'structures' ? (
                    <>
                        <input type="text" placeholder="Search structures..." value={search} onChange={(e) => setSearch(e.target.value)} className="block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                        <input type="text" placeholder="Academic Year (e.g. 2026-2027)" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                            <option value="">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </>
                ) : (
                    <>
                        {isAdmin && <input type="text" placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />}
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="block w-full rounded-md border border-ink-300 px-3 py-2 text-base text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                            <option value="">All Payment Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="PARTIAL">Partial</option>
                            <option value="PAID">Paid</option>
                            <option value="OVERDUE">Overdue</option>
                        </select>
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
            ) : activeTab === 'structures' ? (
                structures.length === 0 ? (
                    <div className="text-center p-12 bg-white rounded-xl border border-ink-200">
                        <h3 className="text-sm font-medium text-ink-900">No fee structures found</h3>
                        <p className="mt-1 text-sm text-ink-500">Add structures like Monthly Tuition, Library Fee.</p>
                        {error && <button onClick={fetchStructures} className="mt-4 text-brand-600 text-sm hover:underline">Retry</button>}
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {structures.map((st) => (
                            <div key={st._id} className="bg-white rounded-xl border border-ink-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-5" onClick={() => !isAdmin && setViewOnlyItem(st)}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {st.status}
                                        </span>
                                        <span className="text-xs font-bold text-ink-700">${st.amount}</span>
                                    </div>
                                    <h3 className="text-lg font-medium text-ink-900 mb-1 cursor-pointer select-none" onClick={() => setViewOnlyItem(st)}>{st.title}</h3>
                                    <p className="text-sm text-ink-500 mb-2">Year: {st.academicYear}</p>
                                    <div className="flex items-center space-x-2 text-sm text-ink-500">
                                        {st.dueDate && <span className={new Date(st.dueDate) < new Date() && st.status === 'ACTIVE' ? 'text-red-600' : ''}>Due: {new Date(st.dueDate).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                {isAdmin && (
                                    <div className="px-5 py-3 border-t border-ink-100 bg-ink-50 flex justify-end space-x-3">
                                        <button onClick={() => setViewOnlyItem(st)} className="text-sm text-brand-600 hover:text-brand-900">View</button>
                                        <button onClick={() => openStructureModal(st)} className="text-sm text-brand-600 hover:text-brand-900">Edit</button>
                                        <button onClick={() => handleDeleteStructure(st._id)} className="text-sm text-red-600 hover:text-red-900">Delete</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            ) : (
                records.length === 0 ? (
                    <div className="text-center p-12 bg-white rounded-xl border border-ink-200">
                        <h3 className="text-sm font-medium text-ink-900">No student fee records found</h3>
                        <p className="mt-1 text-sm text-ink-500">Adjust the filters or wait for fees to be assigned.</p>
                        {error && <button onClick={fetchRecords} className="mt-4 text-brand-600 text-sm hover:underline">Retry</button>}
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
                        <table className="min-w-full divide-y divide-ink-200">
                            <thead className="bg-ink-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Fee Structure</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Due Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Amount Due</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Paid</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Status</th>
                                    {isAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-ink-500 uppercase tracking-wider">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-ink-200">
                                {records.map(record => (
                                    <tr key={record._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-ink-900">{record.studentId?.firstName} {record.studentId?.lastName}</div>
                                            <div className="text-sm text-ink-500">{record.studentId?.admissionNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-ink-900">{record.feeStructureId?.title}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">
                                            {record.feeStructureId?.dueDate ? new Date(record.feeStructureId.dueDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-ink-700">
                                            ${record.amountDue}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-700">
                                            ${record.amountPaid}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {record.amountPaid < record.amountDue && (
                                                    <button onClick={() => openPaymentModal(record)} className="text-brand-600 hover:text-brand-900">
                                                        Process Payment
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* Structure Modal */}
            <Modal isOpen={isStructureModalOpen} onClose={() => setIsStructureModalOpen(false)} title={selectedStructure ? "Edit Fee Structure" : "Create Fee Structure"}>
                <form onSubmit={submitStructure} className="space-y-4 pt-4">
                    <div>
                        <label className="block text-sm font-medium text-ink-700">Title <span className="text-red-500">*</span></label>
                        <input type="text" value={structureForm.title} onChange={e => setStructureForm({ ...structureForm, title: e.target.value })} required className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-ink-700">Amount <span className="text-red-500">*</span></label>
                            <input type="number" min="0" step="0.01" value={structureForm.amount} onChange={e => setStructureForm({ ...structureForm, amount: e.target.value })} required className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700">Due Date</label>
                            <input type="date" value={structureForm.dueDate} onChange={e => setStructureForm({ ...structureForm, dueDate: e.target.value })} className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700">Applicable Classes (comma separated) <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="e.g. 10th, 9th" value={structureForm.applicableClasses} onChange={e => setStructureForm({ ...structureForm, applicableClasses: e.target.value })} required className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-ink-700">Academic Year <span className="text-red-500">*</span></label>
                            <input type="text" placeholder="2026-2027" value={structureForm.academicYear} onChange={e => setStructureForm({ ...structureForm, academicYear: e.target.value })} required className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700">Status</label>
                            <select value={structureForm.status} onChange={e => setStructureForm({ ...structureForm, status: e.target.value })} className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm">
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsStructureModalOpen(false)} disabled={isSubmitting} className="rounded-md border border-ink-300 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm hover:bg-ink-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-50">
                            {isSubmitting ? 'Saving...' : 'Save Structure'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Record Modal */}
            <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} title="Assign Fee to Student">
                <form onSubmit={submitRecord} className="space-y-4 pt-4">
                    <div>
                        <label className="block text-sm font-medium text-ink-700">Student ID <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="MongoDB Object ID of Student" value={recordForm.studentId} onChange={e => setRecordForm({ ...recordForm, studentId: e.target.value })} required className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700">Fee Structure ID <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="MongoDB Object ID of Fee Structure" value={recordForm.feeStructureId} onChange={e => setRecordForm({ ...recordForm, feeStructureId: e.target.value })} required className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-700">Custom Amount Due (Optional)</label>
                        <input type="number" min="0" step="0.01" placeholder="Leave empty to use Structure Amount" value={recordForm.amountDue} onChange={e => setRecordForm({ ...recordForm, amountDue: e.target.value })} className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm" />
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsRecordModalOpen(false)} disabled={isSubmitting} className="rounded-md border border-ink-300 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm hover:bg-ink-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-50">
                            {isSubmitting ? 'Assigning...' : 'Assign Fee'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Process Payment">
                {selectedRecord && (
                    <form onSubmit={submitPayment} className="space-y-4 pt-4">
                        <div className="bg-brand-50 p-4 rounded border border-brand-200 text-brand-800 text-sm mb-4 flex flex-col space-y-1">
                            <span><strong>Student:</strong> {selectedRecord.studentId?.firstName} {selectedRecord.studentId?.lastName}</span>
                            <span><strong>Total Due:</strong> ${selectedRecord.amountDue}</span>
                            <span><strong>Already Paid:</strong> ${selectedRecord.amountPaid}</span>
                            <span><strong>Remaining:</strong> ${(selectedRecord.amountDue - selectedRecord.amountPaid).toFixed(2)}</span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700">Payment Amount <span className="text-red-500">*</span></label>
                            <input type="number" min="0.01" max={selectedRecord.amountDue - selectedRecord.amountPaid} step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required className="mt-1 block w-full rounded-md border-ink-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm" />
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} disabled={isSubmitting} className="rounded-md border border-ink-300 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm hover:bg-ink-50">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-50">
                                {isSubmitting ? 'Processing...' : 'Process Payment'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* View Modal */}
            <Modal isOpen={!!viewOnlyItem} onClose={() => setViewOnlyItem(null)} title="Fee Structure Details">
                {viewOnlyItem && (
                    <div className="space-y-4 pt-4">
                        <div className="bg-gray-50 p-4 rounded text-sm text-gray-800 space-y-2">
                            <p><strong>Title:</strong> {viewOnlyItem.title}</p>
                            <p><strong>Amount:</strong> ${viewOnlyItem.amount}</p>
                            <p><strong>Academic Year:</strong> {viewOnlyItem.academicYear}</p>
                            <p><strong>Applicable Classes:</strong> {Array.isArray(viewOnlyItem.applicableClasses) ? viewOnlyItem.applicableClasses.join(', ') : viewOnlyItem.applicableClasses}</p>
                            <p><strong>Due Date:</strong> {viewOnlyItem.dueDate ? new Date(viewOnlyItem.dueDate).toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Status:</strong> {viewOnlyItem.status}</p>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setViewOnlyItem(null)} className="rounded-md border border-ink-300 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm hover:bg-ink-50">Close</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default FeePage;
