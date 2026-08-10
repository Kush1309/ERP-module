import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getStudentById, updateStudent } from '../../services/studentApi';

function EditStudentPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        class: '',
        section: '',
        rollNumber: '',
        admissionNumber: '',
        admissionDate: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        postalCode: ''
    });

    const [headerInfo, setHeaderInfo] = useState({
        firstName: '',
        lastName: '',
        studentId: '',
    });

    const [loading, setLoading] = useState(true);
    const [initError, setInitError] = useState('');
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');

    useEffect(() => {
        const fetchStudent = async () => {
            setLoading(true);
            setInitError('');
            try {
                const studentData = await getStudentById(id);

                // Isolate identifying fields exclusively for header display.
                setHeaderInfo({
                    firstName: studentData.firstName || '',
                    lastName: studentData.lastName || '',
                    studentId: studentData.studentId || '',
                });

                // Safely extract only whitelisted properties accurately matching dates converting ISO footprints natively.
                const safeData = {
                    firstName: studentData.firstName || '',
                    lastName: studentData.lastName || '',
                    dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toISOString().split('T')[0] : '',
                    gender: studentData.gender || '',
                    class: studentData.class || '',
                    section: studentData.section || '',
                    rollNumber: studentData.rollNumber || '',
                    admissionNumber: studentData.admissionNumber || '',
                    admissionDate: studentData.admissionDate ? new Date(studentData.admissionDate).toISOString().split('T')[0] : '',
                    phone: studentData.phone || '',
                    email: studentData.email || '',
                    address: studentData.address || '',
                    city: studentData.city || '',
                    state: studentData.state || '',
                    postalCode: studentData.postalCode || ''
                };

                setFormData(safeData);
            } catch (err) {
                const status = err.response?.status;
                if (status === 404) setInitError('Student not found.');
                else if (status === 401) setInitError('Unauthorized access.');
                else if (status === 403) setInitError('Access denied.');
                else setInitError('Unable to load student format boundaries constraints reliably.');
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [id]);

    const validate = () => {
        const newErrs = {};
        const reqFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'class', 'section', 'admissionNumber', 'admissionDate', 'phone', 'address', 'city', 'state', 'postalCode'];

        reqFields.forEach(f => {
            if (!formData[f] || !String(formData[f]).trim()) newErrs[f] = 'Required';
        });

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrs.email = 'Invalid email';
        if (formData.phone && !/^\d{0,15}$/.test(formData.phone.trim())) newErrs.phone = 'Max 15 digits expected'; // loosened validation matching backend standard constraints generally safely

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
            await updateStudent(id, formData);
            navigate(`/admin/students/${id}`, { replace: true });
        } catch (err) {
            const serverMsg = err.response?.data?.message || 'Failed to update student profile limits constraints checked improperly.';
            setApiError(serverMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto w-full max-w-4xl pb-10">
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="flex items-center gap-3 text-sm text-ink-600">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                        Loading edit session...
                    </div>
                </div>
            </div>
        );
    }

    if (initError) {
        return (
            <div className="mx-auto w-full max-w-4xl pb-10">
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
                    <p className="text-xl font-semibold text-ink-900">{initError}</p>
                    <Button type="button" variant="secondary" onClick={() => navigate(`/admin/students/${id}`)}>Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-4xl pb-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Admin module (Edit)</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">
                        {headerInfo.firstName} {headerInfo.lastName}
                    </h1>
                    <p className="mt-1 font-mono text-sm font-medium text-ink-600">{headerInfo.studentId}</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => navigate(`/admin/students/${id}`)}>
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
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Academic Info */}
                        <h3 className="col-span-full border-b border-ink-100 pb-2 text-sm font-semibold uppercase tracking-wider text-ink-900">Academic Target</h3>

                        <div>
                            <label className="text-sm font-medium text-ink-700">Class *</label>
                            <select name="class" value={formData.class} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                                <option value="">Select</option>
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {errors.class && <p className="mt-1 text-xs text-red-600">{errors.class}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-ink-700">Section *</label>
                            <select name="section" value={formData.section} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                                <option value="">Select</option>
                                {['A', 'B', 'C', 'D', 'E', 'F'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {errors.section && <p className="mt-1 text-xs text-red-600">{errors.section}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-ink-700">Admission No *</label>
                            <input type="text" name="admissionNumber" value={formData.admissionNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                            {errors.admissionNumber && <p className="mt-1 text-xs text-red-600">{errors.admissionNumber}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-ink-700">Admission Date *</label>
                            <input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                            {errors.admissionDate && <p className="mt-1 text-xs text-red-600">{errors.admissionDate}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-ink-700">Roll Number</label>
                            <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                        </div>
                        <div className="hidden lg:block"></div>

                        {/* Basic Profile */}
                        <h3 className="col-span-full mt-4 border-b border-ink-100 pb-2 text-sm font-semibold uppercase tracking-wider text-ink-900">Personal Info</h3>

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
                            <label className="text-sm font-medium text-ink-700">Gender *</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                                <option value="">Select</option>
                                {['MALE', 'FEMALE', 'OTHER'].map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-ink-700">Date of Birth *</label>
                            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                            {errors.dateOfBirth && <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth}</p>}
                        </div>

                        {/* Contact Information */}
                        <h3 className="col-span-full mt-4 border-b border-ink-100 pb-2 text-sm font-semibold uppercase tracking-wider text-ink-900">Contact & Address</h3>

                        <div>
                            <label className="text-sm font-medium text-ink-700">Phone *</label>
                            <input type="text" name="phone" placeholder="Up to 15 digits" value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-ink-700">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>
                        <div className="hidden lg:block"></div>

                        <div className="col-span-full">
                            <label className="text-sm font-medium text-ink-700">Address *</label>
                            <input type="text" name="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                            {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-ink-700">City *</label>
                            <input type="text" name="city" value={formData.city} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                            {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-ink-700">State *</label>
                            <input type="text" name="state" value={formData.state} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                            {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-ink-700">Postal Code *</label>
                            <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className="mt-1 block w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                            {errors.postalCode && <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>}
                        </div>

                    </div>

                    <div className="flex justify-end border-t border-ink-100 pt-6">
                        <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Card>

        </div>
    );
}

export default EditStudentPage;
