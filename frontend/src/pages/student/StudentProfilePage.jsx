import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getCurrentStudent } from '../../services/studentApi';
import HostelAllocationCard from '../../components/students/HostelAllocationCard';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
const formatLabel = (value) => (value ? value.charAt(0) + value.slice(1).toLowerCase() : '-');

function Field({ label, value }) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
            <dd className="mt-1 text-sm text-ink-900">{value || '-'}</dd>
        </div>
    );
}

export default function StudentProfilePage() {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setStudent(await getCurrentStudent());
        } catch (err) {
            setError(err?.response?.data?.message || 'Unable to load your profile.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="mx-auto w-full max-w-4xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Student workspace</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">My Profile</h1>
                    <p className="mt-2 text-sm text-ink-600">Your school record. Contact the school office to correct any details.</p>
                </div>
                <Button as={Link} to="/change-password" variant="secondary">Change password</Button>
            </div>

            {loading ? (
                <Card className="flex min-h-[200px] items-center justify-center gap-3 text-sm text-ink-600">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                    Loading profile...
                </Card>
            ) : error ? (
                <Card className="flex min-h-[200px] flex-col items-center justify-center gap-4 text-center">
                    <p className="text-sm text-red-600">{error}</p>
                    <Button type="button" onClick={load}>Retry</Button>
                </Card>
            ) : (
                <div className="space-y-6">
                    <Card>
                        <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Academic details</h2>
                        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                            <Field label="Name" value={`${student.firstName} ${student.lastName}`} />
                            <Field label="Student ID" value={student.studentId} />
                            <Field label="Login ID" value={student.user?.loginId} />
                            <Field label="Class" value={`${student.class} - ${student.section}`} />
                            <Field label="Roll number" value={student.rollNumber} />
                            <Field label="Admission number" value={student.admissionNumber} />
                            <Field label="Admission date" value={formatDate(student.admissionDate)} />
                            <Field label="Status" value={formatLabel(student.status)} />
                        </dl>
                    </Card>
                    <Card>
                        <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Personal & contact</h2>
                        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                            <Field label="Date of birth" value={formatDate(student.dateOfBirth)} />
                            <Field label="Gender" value={formatLabel(student.gender)} />
                            <Field label="Phone" value={student.phone} />
                            <Field label="Email" value={student.email} />
                            <Field label="Address" value={[student.address, student.city, student.state, student.postalCode].filter(Boolean).join(', ')} />
                        </dl>
                    </Card>
                    <HostelAllocationCard />
                </div>
            )}
        </div>
    );
}
