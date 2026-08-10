import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import { getStudentById, activateStudent, deactivateStudent } from '../../services/studentApi';

function StudentDetailsPage() {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorStatus, setErrorStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // modal states
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '' });

    const handleStatusAction = async () => {
        const { type } = modalConfig;
        if (!type) return;

        setActionLoading(true);
        try {
            if (type === 'activate') {
                await activateStudent(id);
                alert('Student activated successfully.');
            } else {
                await deactivateStudent(id);
                alert('Student deactivated successfully.');
            }

            // refetch seamlessly bypassing hard reloading
            const updatedData = await getStudentById(id);
            setStudent(updatedData);
        } catch (err) {
            const status = err.response?.status;
            if (status === 401) {
                alert('Unauthorized access.');
            } else if (status === 403) {
                alert('Access denied.');
            } else if (status === 404) {
                alert('Student not found.');
            } else if (status === 409) {
                alert('Invalid state or conflict.');
            } else {
                alert('Generic server error. Failed to update student status.');
            }
        } finally {
            setActionLoading(false);
            setModalConfig({ isOpen: false, type: '' });
        }
    };

    useEffect(() => {
        const fetchStudent = async () => {
            setLoading(true);
            setErrorStatus(null);
            setErrorMessage('');
            try {
                const studentData = await getStudentById(id);
                setStudent(studentData);
            } catch (err) {
                const status = err.response?.status;
                setErrorStatus(status);
                if (status === 404) {
                    setErrorMessage('Student not found.');
                } else if (status === 401) {
                    setErrorMessage('Unauthorized access.');
                } else if (status === 403) {
                    setErrorMessage('Access denied.');
                } else {
                    setErrorMessage('Unable to load student details please check your connection.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [id]);

    if (loading) {
        return (
            <div className="mx-auto w-full max-w-6xl">
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="flex items-center gap-3 text-sm text-ink-600">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                        Loading student details...
                    </div>
                </div>
            </div>
        );
    }

    if (errorStatus || !student) {
        return (
            <div className="mx-auto w-full max-w-6xl">
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
                    <p className="text-xl font-semibold text-ink-900">{errorMessage || 'Student not found.'}</p>
                    <Link to="/admin/students">
                        <Button type="button" variant="secondary">Back to Students</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const formatStatus = (status) => {
        if (status === true) return 'Active';
        if (status === false) return 'Inactive';
        if (!status) return 'Unknown';
        return status.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    };

    const {
        studentId, firstName, lastName, dateOfBirth, gender, phone, email, address, city, state, postalCode,
        class: studentClass, section, rollNumber, admissionNumber, admissionDate, status,
        user
    } = student;

    const { loginId, isActive: accountActive } = user || {};

    return (
        <div className="mx-auto w-full max-w-4xl pb-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Admin module</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">{firstName} {lastName}</h1>
                    <p className="mt-1 font-mono text-sm font-medium text-ink-600">{studentId}</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/admin/students">
                        <Button type="button" variant="secondary">
                            Back to Students
                        </Button>
                    </Link>
                    <Link to={`/admin/students/${id}/edit`}>
                        <Button type="button">
                            Edit Student
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Personal Info */}
                <Card className="p-6 md:col-span-2">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-900 border-b border-ink-100 pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">First Name</span>
                            <span className="mt-1 block text-sm text-ink-900">{firstName || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Last Name</span>
                            <span className="mt-1 block text-sm text-ink-900">{lastName || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Date of Birth</span>
                            <span className="mt-1 block text-sm text-ink-900">{dateOfBirth ? new Date(dateOfBirth).toLocaleDateString() : '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Gender</span>
                            <span className="mt-1 block text-sm text-ink-900">{gender || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Phone</span>
                            <span className="mt-1 block text-sm text-ink-900">{phone || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Email</span>
                            <span className="mt-1 block text-sm text-ink-900">{email || '-'}</span>
                        </div>
                        <div className="sm:col-span-2">
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Address</span>
                            <span className="mt-1 block text-sm text-ink-900">
                                {[address, city, state, postalCode].filter(Boolean).join(', ') || '-'}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Academic Info */}
                <Card className="p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-900 border-b border-ink-100 pb-2">Academic Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Class</span>
                            <span className="mt-1 block text-sm text-ink-900">{studentClass || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Section</span>
                            <span className="mt-1 block text-sm text-ink-900">{section || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Roll Number</span>
                            <span className="mt-1 block text-sm text-ink-900">{rollNumber || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Admission No</span>
                            <span className="mt-1 block text-sm text-ink-900">{admissionNumber || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Admission Date</span>
                            <span className="mt-1 block text-sm text-ink-900">{admissionDate ? new Date(admissionDate).toLocaleDateString() : '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Status</span>
                            <div className="mt-1">
                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-ink-50 text-ink-700 border-ink-200'
                                    }`}>
                                    {formatStatus(status)}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Account Info */}
                <Card className="p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-900 border-b border-ink-100 pb-2">Account Information</h3>
                    <div className="flex flex-col gap-4">
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Login ID</span>
                            <span className="mt-1 block font-mono text-sm font-medium text-ink-900">{loginId || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Account Status</span>
                                <div className="mt-1">
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${accountActive
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                        {accountActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="secondary"
                                className={accountActive ? 'text-red-700 hover:bg-red-50 border-red-200' : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'}
                                onClick={() => setModalConfig({ isOpen: true, type: accountActive ? 'deactivate' : 'activate' })}
                            >
                                {accountActive ? 'Deactivate Student' : 'Activate Student'}
                            </Button>
                        </div>
                    </div>
                </Card>

            </div>

            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => !actionLoading && setModalConfig({ isOpen: false, type: '' })}
                title={modalConfig.type === 'activate' ? 'Activate Student?' : 'Deactivate Student?'}
            >
                <div className="mt-2 text-sm text-ink-600">
                    {modalConfig.type === 'activate'
                        ? 'This will allow the student to log in again.'
                        : 'This will disable the student\'s account and prevent login.'}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setModalConfig({ isOpen: false, type: '' })}
                        disabled={actionLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleStatusAction}
                    >
                        {actionLoading ? 'Loading...' : (modalConfig.type === 'activate' ? 'Activate' : 'Deactivate')}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

export default StudentDetailsPage;
