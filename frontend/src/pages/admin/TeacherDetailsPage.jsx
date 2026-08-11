import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import { getTeacherById, activateTeacher, deactivateTeacher } from '../../services/teacherApi';

function TeacherDetailsPage() {
    const { id } = useParams();
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorStatus, setErrorStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(''); // 'activate' or 'deactivate'
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    const fetchTeacher = async () => {
        setLoading(true);
        setErrorStatus(null);
        setErrorMessage('');
        try {
            const teacherData = await getTeacherById(id);
            setTeacher(teacherData);
        } catch (err) {
            const status = err.response?.status;
            setErrorStatus(status);
            if (status === 404) {
                setErrorMessage('Teacher not found.');
            } else if (status === 401) {
                setErrorMessage('Unauthorized access.');
            } else if (status === 403) {
                setErrorMessage('Access denied.');
            } else {
                setErrorMessage('Unable to load teacher details please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeacher();
    }, [id]);

    const handleActionClick = (action) => {
        setModalAction(action);
        setActionError('');
        setIsModalOpen(true);
    };

    const handleConfirmAction = async () => {
        setIsActionLoading(true);
        setActionError('');
        try {
            if (modalAction === 'activate') {
                await activateTeacher(id);
            } else {
                await deactivateTeacher(id);
            }
            setIsModalOpen(false);
            // Refresh explicitly without browser reload
            await fetchTeacher();
        } catch (err) {
            setActionError(err.response?.data?.message || `Failed to ${modalAction} teacher.`);
        } finally {
            setIsActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto w-full max-w-6xl">
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="flex items-center gap-3 text-sm text-ink-600">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                        Loading teacher details...
                    </div>
                </div>
            </div>
        );
    }

    if (errorStatus || !teacher) {
        return (
            <div className="mx-auto w-full max-w-6xl">
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
                    <p className="text-xl font-semibold text-ink-900">{errorMessage || 'Teacher not found.'}</p>
                    <Link to="/admin/teachers">
                        <Button type="button" variant="secondary">Back to Teachers</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const {
        firstName, lastName, email, phone, assignedClass, assignedSection, user
    } = teacher;

    const { loginId, isActive: accountActive } = user || {};

    return (
        <div className="mx-auto w-full max-w-4xl pb-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Admin module</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">{firstName} {lastName}</h1>
                    <p className="mt-1 font-mono text-sm font-medium text-ink-600">{loginId || '-'}</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/admin/teachers">
                        <Button type="button" variant="secondary">
                            Back to Teachers
                        </Button>
                    </Link>
                    <Link to={`/admin/teachers/${id}/edit`}>
                        <Button type="button">
                            Edit Teacher
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
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Email</span>
                            <span className="mt-1 block text-sm text-ink-900">{email || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Phone</span>
                            <span className="mt-1 block text-sm text-ink-900">{phone || '-'}</span>
                        </div>
                    </div>
                </Card>

                {/* Assignment Info */}
                <Card className="p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-900 border-b border-ink-100 pb-2">Assignment Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Assigned Class</span>
                            <span className="mt-1 block text-sm text-ink-900">{assignedClass || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Assigned Section</span>
                            <span className="mt-1 block text-sm text-ink-900">{assignedSection || '-'}</span>
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
                            <div>
                                {accountActive ? (
                                    <Button type="button" variant="secondary" onClick={() => handleActionClick('deactivate')}>
                                        Deactivate Teacher
                                    </Button>
                                ) : (
                                    <Button type="button" onClick={() => handleActionClick('activate')}>
                                        Activate Teacher
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => !isActionLoading && setIsModalOpen(false)}
                title={modalAction === 'activate' ? 'Activate Teacher?' : 'Deactivate Teacher?'}
            >
                <div className="space-y-4">
                    <p className="text-sm text-ink-600">
                        {modalAction === 'activate'
                            ? "This will enable the teacher's account and allow login."
                            : "This will disable the teacher's account and prevent login."}
                    </p>

                    {actionError && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                            {actionError}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsModalOpen(false)}
                            disabled={isActionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmAction}
                            disabled={isActionLoading}
                        >
                            {isActionLoading
                                ? (modalAction === 'activate' ? 'Activating...' : 'Deactivating...')
                                : (modalAction === 'activate' ? 'Activate' : 'Deactivate')
                            }
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default TeacherDetailsPage;
