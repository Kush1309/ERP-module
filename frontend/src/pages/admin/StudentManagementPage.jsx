import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getStudents, exportAdminStudents } from '../../services/studentApi';

const DEFAULT_LIMIT = 10;

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function StudentManagementPage() {
  const [students, setStudents] = useState([]);

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
  const [isExporting, setIsExporting] = useState(false);

  // Prevent double fetches on filter change
  const filterParamsRef = useRef({ search: '', ...filters });

  const loadStudents = useCallback(
    async (nextPage = 1, searchQuery = '', currentFilters = {}) => {
      setLoading(true);
      setError('');
      try {
        const queryParams = { page: nextPage, limit: DEFAULT_LIMIT };
        if (searchQuery) queryParams.search = searchQuery;
        if (currentFilters.class) queryParams.class = currentFilters.class;
        if (currentFilters.section) queryParams.section = currentFilters.section;
        if (currentFilters.status) queryParams.status = currentFilters.status;

        const result = await getStudents(queryParams);

        setStudents(result?.students ?? []);
        setPagination(
          result?.pagination ?? {
            page: nextPage, limit: DEFAULT_LIMIT, total: 0, totalPages: 1,
          }
        );
      } catch {
        setStudents([]);
        setError('Unable to load students.');
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

    loadStudents(targetPage, debouncedSearch, filters);
  }, [page, debouncedSearch, filters, loadStudents]);

  const totalPages = useMemo(() => Math.max(1, pagination.totalPages || 1), [pagination.totalPages]);
  const handleRetry = () => loadStudents(page, debouncedSearch, filters);
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

  const onExportClick = async () => {
    setIsExporting(true);
    setError('');
    try {
      const csvBlob = await exportAdminStudents({
        search: debouncedSearch,
        class: filters.class,
        section: filters.section,
        status: filters.status,
      });

      const url = window.URL.createObjectURL(new Blob([csvBlob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to export students. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const STATUSES = ['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED'];

  const hasActiveFilters = debouncedSearch || filters.class || filters.section || filters.status;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Admin module</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Student Management</h1>
          <p className="mt-2 text-sm text-ink-600">Manage student profiles and account status.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onExportClick}
            disabled={isExporting || loading}
            className="min-w-[120px] whitespace-nowrap"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Link to="/admin/students/new">
            <Button type="button" variant="secondary" className="min-w-[150px] whitespace-nowrap">
              + Add Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label htmlFor="search" className="mb-1 block text-sm font-medium text-ink-700">Search</label>
            <input
              id="search"
              type="text"
              placeholder="Search students..."
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
              {CLASSES.map((c) => (<option key={c} value={c}>{c}</option>))}
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
              {STATUSES.map((st) => (<option key={st} value={st}>{formatStatus(st)}</option>))}
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
              Loading students...
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-ink-900">Unable to load students.</p>
            </div>
            <Button type="button" onClick={handleRetry}>Retry</Button>
          </div>
        ) : students.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
            <p className="text-lg font-semibold text-ink-900">
              {hasActiveFilters ? "No students found matching your filters." : "No students found."}
            </p>
            {hasActiveFilters ? (
              <Button type="button" variant="secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Link to="/admin/students/new">
                <Button type="button" variant="secondary">
                  + Add Student
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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Student ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Student Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Section</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Roll Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200 bg-white">
                  {students.map((student) => (
                    <tr key={student._id || student.studentId} className="hover:bg-ink-50/60">
                      <td className="px-4 py-3 text-sm font-medium text-ink-900">{student.studentId}</td>
                      <td className="px-4 py-3 text-sm text-ink-900">{student.firstName} {student.lastName}</td>
                      <td className="px-4 py-3 text-sm text-ink-700">{student.class}</td>
                      <td className="px-4 py-3 text-sm text-ink-700">{student.section}</td>
                      <td className="px-4 py-3 text-sm text-ink-700">{student.rollNumber}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          {formatStatus(student.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link to={`/admin/students/${student._id}`}>
                          <button type="button" className="font-medium text-brand-700 transition hover:text-brand-800">
                            View
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
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

export default StudentManagementPage;
