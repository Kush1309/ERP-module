import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getTeacherById, updateTeacher } from '../../services/teacherApi';

export default function EditTeacherPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        assignedClass: '',
        assignedSection: ''
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');
    const [fetchError, setFetchError] = useState('');

    useEffect(() => {
        const fetchTeacher = async () => {
            setIsLoading(true);
            setFetchError('');
            try {
                const data = await getTeacherById(id);
                if (data) {
                    setFormData({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        assignedClass: data.assignedClass || '',
                        assignedSection: data.assignedSection || ''
                    });
                }
            } catch (err) {
                setFetchError(err.response?.data?.message || 'Unable to load teacher data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeacher();
    }, [id]);

    const validate = () => {
        const newErrs = {};
        const reqFields = ['firstName', 'lastName', 'email', 'phone', 'assignedClass', 'assignedSection'];

        reqFields.forEach(f => {
            if (!formData[f] || !String(formData[f]).trim()) newErrs[f] = 'Required';
        });

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrs.email = 'Invalid email';
        if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) newErrs.phone = '10 digits required';

        setErrors(newErrs);
        return Object.keys(newErrs).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');

        if (!validate()) return;

        setIsSubmitting(true);

        try {
            await updateTeacher(id, formData);
            navigate(`/admin/teachers/${id}`, { replace: true });
        } catch (err) {
            const status = err.response?.status;
            let serverMsg = 'Failed to update teacher. Please check network connection.';
            if (status === 409) {
                serverMsg = 'Teacher with this email or phone already exists.';
            } else if (err.response?.data?.message) {
                serverMsg = err.response.data.message;
            }
            setApiError(serverMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

    if (isLoading) {
        return (
            <div className="mx-auto flex w-full max-w-4xl min-h-[400px] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-ink-600">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                    Loading teacher details...
                </div>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="mx-auto flex w-full max-w-4xl min-h-[400px] flex-col items-center justify-center gap-4">
                <p className="text-xl font-semibold text-ink-900">{fetchError}</p>
                <Button type="button" variant="secondary" onClick={() => navigate('/admin/teachers')}>
                    Back to Teachers
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-4xl pb-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Admin module</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Edit Teacher</h1>
                    <p className="mt-2 text-sm text-ink-600">Update teacher profile information and assignment details.</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => navigate(`/admin/teachers/${id}`)}>
                    Cancel
                </Button>
            </div>

            {apiError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-900">{apiError}</p>
                </div>
            )}

            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Basic Profile */}
                        <h3 className="col-span-full border-b border-ink-100 pb-2 text-sm font-semibold uppercase tracking-wider text-ink-900">Teacher Information</h3>

                        <div>
                            <label className="text-sm font-medium text-ink-700">First Name *</label>
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                            {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-ink-700">Last Name *</label>
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                            {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-ink-700">Email *</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-ink-700">Phone *</label>
                            <input type="text" name="phone" placeholder="10 digits" value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                        </div>

                        {/* Assignment Info */}
                        <h3 className="col-span-full mt-4 border-b border-ink-100 pb-2 text-sm font-semibold uppercase tracking-wider text-ink-900">Assignment Information</h3>

                        <div>
                            <label className="text-sm font-medium text-ink-700">Assigned Class *</label>
                            <select name="assignedClass" value={formData.assignedClass} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                                <option value="">Select Class</option>
                                {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                            </select>
                            {errors.assignedClass && <p className="mt-1 text-xs text-red-600">{errors.assignedClass}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-ink-700">Assigned Section *</label>
                            <select name="assignedSection" value={formData.assignedSection} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                                <option value="">Select Section</option>
                                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {errors.assignedSection && <p className="mt-1 text-xs text-red-600">{errors.assignedSection}</p>}
                        </div>
                    </div>

                    <div className="flex justify-between border-t border-ink-100 pt-6">
                        <Button type="button" variant="secondary" onClick={() => navigate(`/admin/teachers/${id}`)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
