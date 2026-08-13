import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getCurrentStudent } from '../../services/studentApi';

function StudentDashboardPage() {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorStatus, setErrorStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const loadStudentProfile = async () => {
            setLoading(true);
            setErrorStatus(null);
            setErrorMessage('');
            try {
                const data = await getCurrentStudent();
                setStudent(data);
            } catch (err) {
                const status = err.response?.status;
                setErrorStatus(status);
                if (status === 401) {
                    setErrorMessage('Unauthorized / session expired. Please log in again.');
                } else if (status === 403) {
                    setErrorMessage('Access denied.');
                } else if (status === 404) {
                    setErrorMessage('Student profile not found.');
                } else {
                    setErrorMessage('Unable to load student dashboard. Please check your connection.');
                }
            } finally {
                setLoading(false);
            }
        };
        loadStudentProfile();
    }, []);

    if (loading) {
        return (
            <div className="mx-auto w-full max-w-6xl">
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="flex items-center gap-3 text-sm text-ink-600">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                        Loading student dashboard...
                    </div>
                </div>
            </div>
        );
    }

    if (errorStatus || !student) {
        return (
            <div className="mx-auto w-full max-w-6xl">
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
                    <p className="text-xl font-semibold text-ink-900">{errorMessage || 'Student profile not found.'}</p>
                </div>
            </div>
        );
    }

    const {
        studentId, firstName, lastName, phone, email, address, city, state, postalCode,
        class: className, section, rollNumber, admissionNumber, admissionDate, user
    } = student;

    const { isActive: accountActive } = user || {};

    const formatStatus = (status) => {
        if (status === true) return 'ACTIVE';
        if (status === false) return 'INACTIVE';
        return 'Not available';
    };

    return (
        <div className="mx-auto w-full max-w-4xl pb-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-ink-900">Student Dashboard</h1>
                    <p className="mt-2 text-ink-600">Welcome, {firstName || 'Not available'} {lastName || ''}</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/student/attendance">
                        <Button type="button" variant="secondary">My Attendance</Button>
                    </Link>
                    <Link to="/student/timetable">
                        <Button type="button" variant="secondary">My Timetable</Button>
                    </Link>
                    <Link to="/student/notices">
                        <Button type="button" variant="secondary">Noticeboard</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Profile Snapshot */}
                <Card className="p-6 md:col-span-2">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-900 border-b border-ink-100 pb-2">Profile Overview</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Student ID</span>
                            <span className="mt-1 block text-sm text-ink-900">{studentId || 'Not available'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Class</span>
                            <span className="mt-1 block text-sm text-ink-900">{className || 'Not available'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Section</span>
                            <span className="mt-1 block text-sm text-ink-900">{section || 'Not available'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Roll Number</span>
                            <span className="mt-1 block text-sm text-ink-900">{rollNumber || 'Not available'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Admission Number</span>
                            <span className="mt-1 block text-sm text-ink-900">{admissionNumber || 'Not available'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Account Status</span>
                            <div className="mt-1">
                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${accountActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                    {formatStatus(accountActive)}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Personal Info */}
                <Card className="p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-900 border-b border-ink-100 pb-2">Personal Information</h3>
                    <div className="flex flex-col gap-4">
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Email</span>
                            <span className="mt-1 block text-sm text-ink-900">{email || 'Not available'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Phone</span>
                            <span className="mt-1 block text-sm text-ink-900">{phone || 'Not available'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Address</span>
                            <span className="mt-1 block text-sm text-ink-900">
                                {[address, city, state, postalCode].filter(Boolean).join(', ') || 'Not available'}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Academic Info */}
                <Card className="p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-900 border-b border-ink-100 pb-2">Academic Information</h3>
                    <div className="flex flex-col gap-4">
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Class</span>
                            <span className="mt-1 block text-sm text-ink-900">{className || 'Not available'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Section</span>
                            <span className="mt-1 block text-sm text-ink-900">{section || 'Not available'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Roll Number</span>
                            <span className="mt-1 block text-sm text-ink-900">{rollNumber || 'Not available'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-medium uppercase tracking-wider text-ink-500">Admission Date</span>
                            <span className="mt-1 block text-sm text-ink-900">{admissionDate ? new Date(admissionDate).toLocaleDateString() : 'Not available'}</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default StudentDashboardPage;
