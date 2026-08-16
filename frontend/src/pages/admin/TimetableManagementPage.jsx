import { useState, useEffect } from 'react';
import { getTimetables, createTimetable, updateTimetable, deleteTimetable } from '../../services/timetableApi';
import { getSubjects } from '../../services/subjectApi';
import { getTeachers } from '../../services/teacherApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

export default function TimetableManagementPage() {
    const [timetables, setTimetables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [subjectsList, setSubjectsList] = useState([]);
    const [teachersList, setTeachersList] = useState([]);

    // Pagination & filters
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ class: '', section: '', dayOfWeek: '' });

    // Form Modal
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('Create');
    const [currentId, setCurrentId] = useState(null);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        academicSession: '2026-2027',
        class: '',
        section: '',
        dayOfWeek: 'MONDAY',
        startTime: '',
        endTime: '',
        subject: '',
        teacher: '',
        room: '',
        status: 'ACTIVE'
    });

    const fetchTimetables = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getTimetables({ page, limit: 10, ...filters });
            setTimetables(res.timetables || []);
            setTotalPages(res.pagination?.totalPages || 1);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load timetables');
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [subjRes, teachRes] = await Promise.all([
                getSubjects({ limit: 100 }),
                getTeachers({ limit: 100 })
            ]);
            setSubjectsList(subjRes.subjects || subjRes.data || []);
            setTeachersList(teachRes.teachers || teachRes.data || []);
        } catch (err) {
            console.error('Failed to load options', err);
        }
    };

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        fetchTimetables();
    }, [page, filters]);

    const openCreate = () => {
        setModalMode('Create');
        setCurrentId(null);
        setFormData({ academicSession: '2026-2027', class: '', section: '', dayOfWeek: 'MONDAY', startTime: '', endTime: '', subject: '', teacher: '', room: '', status: 'ACTIVE' });
        setFormError('');
        setFormSuccess('');
        setShowModal(true);
    };

    const openEdit = (t) => {
        setModalMode('Edit');
        setCurrentId(t._id);
        setFormData({
            academicSession: t.academicSession,
            class: t.class,
            section: t.section,
            dayOfWeek: t.dayOfWeek,
            startTime: t.startTime,
            endTime: t.endTime,
            subject: t.subject?._id || '',
            teacher: t.teacher?._id || '',
            room: t.room,
            status: t.status
        });
        setFormError('');
        setFormSuccess('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');
        setIsSubmitting(true);
        try {
            if (modalMode === 'Create') {
                await createTimetable(formData);
                setFormSuccess('Timetable created successfully.');
            } else {
                await updateTimetable(currentId, formData);
                setFormSuccess('Timetable updated successfully.');
            }
            fetchTimetables();
            setTimeout(() => setShowModal(false), 1500);
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to save timetable. Details: ' + JSON.stringify(err.response?.data?.error || {}));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this timetable entry?')) return;
        try {
            await deleteTimetable(id);
            fetchTimetables();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete');
        }
    };

    return (
        <div className="mx-auto w-full max-w-6xl pb-10">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-semibold text-ink-900">Timetable Management</h1>
                </div>
                <Button onClick={openCreate}>Create Timetable</Button>
            </div>

            <Card className="p-4 mb-6 flex gap-4">
                <input type="text" placeholder="Class" className="border rounded px-3 py-2" value={filters.class} onChange={e => setFilters({ ...filters, class: e.target.value, page: 1 })} />
                <input type="text" placeholder="Section" className="border rounded px-3 py-2" value={filters.section} onChange={e => setFilters({ ...filters, section: e.target.value, page: 1 })} />
                <select className="border rounded px-3 py-2" value={filters.dayOfWeek} onChange={e => setFilters({ ...filters, dayOfWeek: e.target.value, page: 1 })}>
                    <option value="">All Days</option>
                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </Card>

            {error && <div className="p-4 bg-red-50 text-red-700 mb-4 rounded">{error} <Button onClick={fetchTimetables}>Retry</Button></div>}

            {loading ? (
                <div className="p-10 text-center text-ink-500">Loading timetables...</div>
            ) : timetables.length === 0 ? (
                <div className="p-10 text-center text-ink-500 bg-white rounded border border-ink-200">No entries found.</div>
            ) : (
                <div className="bg-white rounded border border-ink-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-ink-700">
                        <thead className="bg-ink-50">
                            <tr>
                                <th className="p-3 font-medium">Session / Room</th>
                                <th className="p-3 font-medium">Class / Sec</th>
                                <th className="p-3 font-medium">Day / Time</th>
                                <th className="p-3 font-medium">Subject / Teacher</th>
                                <th className="p-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100">
                            {timetables.map(t => (
                                <tr key={t._id}>
                                    <td className="p-3">{t.academicSession} <br /><span className="text-xs text-ink-500">Room: {t.room}</span></td>
                                    <td className="p-3 font-medium">{t.class} - {t.section}</td>
                                    <td className="p-3">{t.dayOfWeek} <br /><span className="text-xs text-brand-600">{t.startTime} - {t.endTime}</span></td>
                                    <td className="p-3">{t.subject?.name || t.subject?.subjectName} <br /><span className="text-xs text-ink-500">{t.teacher?.firstName} {t.teacher?.lastName}</span></td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => openEdit(t)} className="text-brand-600 hover:underline mr-4">Edit</button>
                                        <button onClick={() => handleDelete(t._id)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                    <Button disabled={page === 1} onClick={() => setPage(page - 1)} variant="secondary">Prev</Button>
                    <span className="py-2 text-sm">Page {page} of {totalPages}</span>
                    <Button disabled={page === totalPages} onClick={() => setPage(page + 1)} variant="secondary">Next</Button>
                </div>
            )}

            <Modal isOpen={showModal} onClose={() => !isSubmitting && setShowModal(false)} title={`${modalMode} Timetable`}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {formError && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{formError}</div>}
                    {formSuccess && <div className="text-sm text-emerald-600 bg-emerald-50 p-2 rounded">{formSuccess}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-ink-700">Academic Session *</label>
                            <input required type="text" className="w-full border rounded px-3 py-2" value={formData.academicSession} onChange={e => setFormData({ ...formData, academicSession: e.target.value })} placeholder="YYYY-YYYY" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-ink-700">Day of Week *</label>
                            <select required className="w-full border rounded px-3 py-2" value={formData.dayOfWeek} onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}>
                                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-ink-700">Class *</label>
                            <input required type="text" className="w-full border rounded px-3 py-2" value={formData.class} onChange={e => setFormData({ ...formData, class: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-ink-700">Section (Optional)</label>
                            <input type="text" className="w-full border rounded px-3 py-2" value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-ink-700">Start Time (HH:MM) *</label>
                            <input required type="text" pattern="^([01]\d|2[0-3]):([0-5]\d)$" title="Strictly HH:MM" className="w-full border rounded px-3 py-2" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} placeholder="09:00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-ink-700">End Time (HH:MM) *</label>
                            <input required type="text" pattern="^([01]\d|2[0-3]):([0-5]\d)$" title="Strictly HH:MM" className="w-full border rounded px-3 py-2" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} placeholder="10:00" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-ink-700">Subject *</label>
                            <select required className="w-full border rounded px-3 py-2" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}>
                                <option value="">Select Subject...</option>
                                {subjectsList.map(s => <option key={s._id} value={s._id}>{s.name || s.subjectName} ({s.code || s.subjectCode})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-ink-700">Teacher *</label>
                            <select required className="w-full border rounded px-3 py-2" value={formData.teacher} onChange={e => setFormData({ ...formData, teacher: e.target.value })}>
                                <option value="">Select Teacher...</option>
                                {teachersList.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName} - {t.email}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-ink-700">Room *</label>
                            <input required type="text" className="w-full border rounded px-3 py-2" value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-ink-700">Status</label>
                            <select className="w-full border rounded px-3 py-2" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="SUSPENDED">SUSPENDED</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
