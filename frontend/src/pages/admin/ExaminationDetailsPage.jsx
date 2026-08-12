import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getExamById } from '../../services/examApi';

export default function ExaminationDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const data = await getExamById(id);
                setExam(data);
            } catch (err) {
                setError('Failed to load examination details. Make sure the exam exists.');
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [id]);

    const formatStatus = (status) => {
        if (!status) return 'Unknown';
        return status.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    };

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        return new Date(isoString).toISOString().split('T')[0];
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex items-center gap-3 text-ink-600">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                    Loading exam details...
                </div>
            </div>
        );
    }

    if (error || !exam) {
        return (
            <div className="mx-auto w-full max-w-4xl pt-8">
                <Card className="flex flex-col items-center justify-center p-8 text-center text-red-600">
                    <p className="mb-4 text-lg font-medium">{error || 'Examination not found.'}</p>
                    <Button type="button" onClick={() => navigate('/admin/examinations')}>Back to Examinations</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl relative">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <Link to="/admin/examinations" className="text-sm font-medium text-brand-600 hover:text-brand-800 flex items-center gap-1 mb-2">
                        ← Back to Examinations
                    </Link>
                    <h1 className="font-display text-3xl font-semibold text-ink-900">{exam.name}</h1>
                    <p className="mt-1 text-sm text-ink-600">Overview of examination configurations and result mapping.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Entrypoint explicitly for Results Management as configured by module rules */}
                    <Button type="button" onClick={() => alert("Result management UI expansion pending next module cycle")} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                        Manage Student Results
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-1 lg:col-span-2 p-6">
                    <h3 className="mb-4 text-lg font-medium text-ink-900 border-b border-ink-100 pb-2">Examination Setup</h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div>
                            <p className="text-sm font-medium text-ink-500">Academic Session</p>
                            <p className="mt-1 font-medium text-ink-900">{exam.academicSession}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-ink-500">Status</p>
                            <span className="mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium border-brand-200 bg-brand-50 text-brand-700">
                                {formatStatus(exam.status)}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-ink-500">Class & Section</p>
                            <p className="mt-1 font-medium text-ink-900">{exam.class}{exam.section ? `-${exam.section}` : ' (All Sections)'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-ink-500">Exam Type</p>
                            <p className="mt-1 font-medium text-ink-900">{formatStatus(exam.type)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-ink-500">Start Date</p>
                            <p className="mt-1 text-ink-900">{formatDate(exam.startDate)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-ink-500">End Date</p>
                            <p className="mt-1 text-ink-900">{formatDate(exam.endDate)}</p>
                        </div>
                    </div>
                </Card>

                <Card className="col-span-1 p-6 bg-ink-50 border-0">
                    <h3 className="mb-4 text-lg font-medium text-ink-900 border-b border-ink-200 pb-2">Metadata</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-medium text-ink-500 uppercase tracking-widest">Created By</p>
                            <p className="mt-1 text-sm font-medium text-ink-900">
                                {exam.createdBy ? `${exam.createdBy.firstName} ${exam.createdBy.lastName}` : 'Administrator'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-ink-500 uppercase tracking-widest">Creation Date</p>
                            <p className="mt-1 text-sm text-ink-900">{formatDate(exam.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-ink-500 uppercase tracking-widest">Internal ID</p>
                            <p className="mt-1 text-xs text-ink-500 font-mono">{exam._id}</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
