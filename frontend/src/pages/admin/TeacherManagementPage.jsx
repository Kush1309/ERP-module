import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getTeachers } from '../../services/teacherApi';

const DEFAULT_LIMIT = 10;

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

function TeacherManagementPage() {
    const [teachers, setTeachers] = useState([]);

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    const [filters, setFilters] = useState({
        class: '',
        section: '',
        status: '',
    });

    // Pagination
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 1,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Prevent double fetches on filter change
    const filterParamsRef = useRef({ search: '', ...filters });

    const loadTeachers = useCallback(
        async (nextPage = 1, searchQuery = '', currentFilters = {}) => {
            setLoading(true);
            setError('');
            try {
                const queryParams = { page: nextPage, limit: DEFAULT_LIMIT };
                if (searchQuery) queryParams.search = searchQuery;
                if (currentFilters.class) queryParams.class = currentFilters.class;
                if (currentFilters.section) queryParams.section = currentFilters.section;
                if (currentFilters.status) queryParams.status = currentFilters.status;

                const result = await getTeachers(queryParams);

                setTeachers(result?.teachers ?? []);
                setPagination(
                    result?.pagination ?? {
                        page: nextPage, limit: DEFAULT_LIMIT, total: 0, totalPages: 1,
                    }
                );
            } catch {
                setTeachers([]);
                setError('Unable to load teachers.');
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        const newFilterParams = { search: debouncedSearch, ...filters };
        let targetPage = page;

        // Reset pagination to 1 if filters altered
        if (JSON.stringify(filterParamsRef.current) !== JSON.stringify(newFilterParams)) {
            targetPage = 1;
            if (page !== 1) setPage(1);
            filterParamsRef.current = newFilterParams;
        }

        loadTeachers(targetPage, debouncedSearch, filters);
    }, [page, debouncedSearch, filters, loadTeachers]);

    const totalPages = useMemo(() => Math.max(1, pagination.totalPages || 1), [pagination.totalPages]);
    const handleRetry = () => loadTeachers(page, debouncedSearch, filters);
    const handlePrevious = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilters({ class: '', section: '', status: '' });
        setPage(1);
    };

    const formatStatus = (isActive) => {
        if (isActive === true) return 'Active';
        if (isActive === false) return 'Inactive';
        return 'Unknown';
    };

    const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];
    const STATUSES = ['ACTIVE', 'INACTIVE'];

    const hasActiveFilters = debouncedSearch || filters.class || filters.section || filters.status;

    return (
        <div className="mx-auto w-full max-w-6xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Admin module</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Teacher Management</h1>
                    <p className="mt-2 text-sm text-ink-600">Manage teacher profiles and assignments.</p>
                </div>
                <Link to="/admin/teachers/new">
                    <Button type="button" variant="secondary" className="min-w-[150px] whitespace-nowrap">
                        + Add Teacher
                    </Button>
                </Link>
            </div>

            {/* Filters Section */}
            <Card className="mb-6 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1">
                        <label htmlFor="search" className="mb-1 block text-sm font-medium text-ink-700">Search</label>
                        <input
                            id="search"
                            type="text"
                            placeholder="Search teachers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div className="w-full md:w-40">
                        <label htmlFor="class" className="mb-1 block text-sm font-medium text-ink-700">Class</label>
                        <select
                            id="class"
                            name="class"
                            value={filters.class}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                            <option value="">All Classes</option>
                            {CLASSES.map((c) => (<option key={c} value={c}>Class {c}</option>))}
                        </select>
                    </div>
                    <div className="w-full md:w-40">
                        <label htmlFor="section" className="mb-1 block text-sm font-medium text-ink-700">Section</label>
                        <select
                            id="section"
                            name="section"
                            value={filters.section}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                            <option value="">All Sections</option>
                            {SECTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
                        </select>
                    </div>
                    <div className="w-full md:w-48">
                        <label htmlFor="status" className="mb-1 block text-sm font-medium text-ink-700">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                            <option value="">All Status</option>
                            {STATUSES.map((st) => (<option key={st} value={st}>{st === 'ACTIVE' ? 'Active' : 'Inactive'}</option>))}
                        </select>
                    </div>
                    {hasActiveFilters && (
                        <div className="w-full md:w-auto">
                            <Button type="button" variant="secondary" onClick={clearFilters} className="w-full md:w-auto whitespace-nowrap">
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            <Card className="overflow-hidden">
                {loading ? (
                    <div className="flex min-h-[220px] items-center justify-center">
                        <div className="flex items-center gap-3 text-sm text-ink-600">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                            Loading teachers...
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
                        <div className="space-y-2">
                            <p className="text-lg font-semibold text-ink-900">Unable to load teachers.</p>
                        </div>
                        <Button type="button" onClick={handleRetry}>Retry</Button>
                    </div>
                ) : teachers.length === 0 ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
                        <p className="text-lg font-semibold text-ink-900">
                            {hasActiveFilters ? "No teachers found matching your filters." : "No teachers found."}
                        </p>
                        {hasActiveFilters ? (
                            <Button type="button" variant="secondary" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        ) : (
                            <Link to="/admin/teachers/new">
                                <Button type="button" variant="secondary">
                                    + Add Teacher
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-ink-200">
                                <thead className="bg-ink-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Teacher ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Phone</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Class</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Section</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-200 bg-white">
                                    {teachers.map((teacher) => {
                                        const isActive = teacher?.user?.isActive;
                                        return (
                                            <tr key={teacher._id} className="hover:bg-ink-50/60">
                                                <td className="px-4 py-3 text-sm font-medium text-ink-900">{teacher?.user?.loginId || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-ink-900">{teacher.firstName} {teacher.lastName}</td>
                                                <td className="px-4 py-3 text-sm text-ink-700">{teacher.email}</td>
                                                <td className="px-4 py-3 text-sm text-ink-700">{teacher.phone}</td>
                                                <td className="px-4 py-3 text-sm text-ink-700">{teacher.assignedClass}</td>
                                                <td className="px-4 py-3 text-sm text-ink-700">{teacher.assignedSection}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${isActive
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-red-50 text-red-700 border-red-200'
                                                        }`}>
                                                        {formatStatus(isActive)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <Link to={`/admin/teachers/${teacher._id}`}>
                                                            <button type="button" className="font-medium text-brand-700 transition hover:text-brand-800">
                                                                View
                                                            </button>
                                                        </Link>
                                                        <Link to={`/admin/teachers/${teacher._id}/edit`}>
                                                            <button type="button" className="font-medium text-brand-700 transition hover:text-brand-800">
                                                                Edit
                                                            </button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-ink-200 bg-ink-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-ink-600">
                                Page {pagination.page || 1} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="secondary" onClick={handlePrevious} disabled={page <= 1 || loading} className="!px-3 !py-2">Previous</Button>
                                <Button type="button" onClick={handleNext} disabled={page >= totalPages || loading} className="!px-3 !py-2">Next</Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}

export default TeacherManagementPage;
