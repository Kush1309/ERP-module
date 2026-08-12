import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getStudents, exportAdminStudents, bulkUpdateStudentStatus, importStudents } from '../../services/studentApi';

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
  const [successMessage, setSuccessMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Bulk operation states
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

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
      setSelectedStudents([]);
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
    setSelectedStudents([]);
    setSuccessMessage('');
  };

  const handleBulkAction = async () => {
    setBulkUpdating(true);
    setError('');
    setSuccessMessage('');
    const status = confirmActionType === 'activate' ? 'ACTIVE' : 'INACTIVE';
    try {
      const response = await bulkUpdateStudentStatus(selectedStudents, status);
      const { requestedCount, updatedCount, alreadyInStateCount, failedCount } = response.data;

      setSelectedStudents([]);
      setShowConfirmModal(false);
      handleRetry();

      let msg = `${updatedCount} student(s) updated successfully.`;
      if (alreadyInStateCount > 0) msg += ` ${alreadyInStateCount} already in requested state.`;
      if (failedCount > 0) msg += ` ${failedCount} could not be updated.`;
      setSuccessMessage(msg);

    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to perform bulk operation.');
      setShowConfirmModal(false);
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);

    try {
      const response = await importStudents(importFile);
      setImportResult({ success: true, message: response.message, data: response.data });
      setImportFile(null);
      handleRetry();
    } catch (err) {
      if (err.response?.data) {
        setImportResult({ success: false, ...err.response.data });
      } else {
        setImportResult({ success: false, message: 'Failed to import students. Please ensure the CSV is valid.' });
      }
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
            onClick={() => setShowImportModal(true)}
            disabled={isExporting || loading || importing}
            className="whitespace-nowrap"
          >
            Import CSV
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onExportClick}
            disabled={isExporting || loading}
            className="whitespace-nowrap"
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

      {successMessage && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
        </Card>
      )}

      {selectedStudents.length > 0 && (
        <Card className="mb-6 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-brand-200 bg-brand-50">
          <div className="text-sm font-medium text-brand-900">
            {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              onClick={() => {
                setConfirmActionType('activate');
                setShowConfirmModal(true);
              }}
              disabled={bulkUpdating || loading}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              Bulk Activate
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setConfirmActionType('deactivate');
                setShowConfirmModal(true);
              }}
              disabled={bulkUpdating || loading}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              Bulk Deactivate
            </Button>
          </div>
        </Card>
      )}

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
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        title="Select all"
                        className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        checked={students.length > 0 && students.every(s => selectedStudents.includes(s._id || s.studentId))}
                        ref={(input) => {
                          if (input) {
                            const allSelected = students.length > 0 && students.every(s => selectedStudents.includes(s._id || s.studentId));
                            const someSelected = students.some(s => selectedStudents.includes(s._id || s.studentId));
                            input.indeterminate = !allSelected && someSelected;
                          }
                        }}
                        onChange={(e) => {
                          const displayedIds = students.map(s => s._id || s.studentId).filter(Boolean);
                          if (e.target.checked) {
                            setSelectedStudents(prev => [...new Set([...prev, ...displayedIds])]);
                          } else {
                            setSelectedStudents(prev => prev.filter(id => !displayedIds.includes(id)));
                          }
                        }}
                      />
                    </th>
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
                      <td className="px-4 py-3 text-sm">
                        <input
                          type="checkbox"
                          title="Select student"
                          className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          checked={selectedStudents.includes(student._id || student.studentId)}
                          onChange={(e) => {
                            const id = student._id || student.studentId;
                            if (!id) return;
                            if (e.target.checked) {
                              setSelectedStudents(prev => [...prev, id]);
                            } else {
                              setSelectedStudents(prev => prev.filter(sid => sid !== id));
                            }
                          }}
                        />
                      </td>
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

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50">
          <Card className="w-full max-w-sm p-6 shadow-xl relative z-10 pointer-events-auto">
            <h3 className="mb-4 text-lg font-semibold text-ink-900">Confirm Bulk Action</h3>
            <p className="mb-6 text-sm text-ink-600">
              Are you sure you want to {confirmActionType} {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''}?
            </p>
            <div className="flex justify-end gap-3 pointer-events-auto">
              <Button type="button" variant="secondary" onClick={() => setShowConfirmModal(false)} disabled={bulkUpdating}>
                Cancel
              </Button>
              <Button type="button" onClick={handleBulkAction} disabled={bulkUpdating}>
                {bulkUpdating ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl relative z-10 pointer-events-auto">
            <h3 className="mb-4 text-lg font-semibold text-ink-900">Import Students</h3>
            <p className="mb-4 text-sm text-ink-600">
              Please upload a CSV file. Required headers: <br />
              <span className="font-mono text-xs">FirstName, LastName, DateOfBirth, Gender, Class, Section, RollNumber, AdmissionNumber, AdmissionDate, Phone, Address, City, State, PostalCode</span>
            </p>

            <div className="mb-4">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="block w-full text-sm text-ink-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
            </div>

            {importResult && (
              <div className={`mb-4 p-4 rounded-md ${importResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
                <p className={`text-sm font-medium ${importResult.success ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {importResult.message}
                </p>
                {importResult.data && (
                  <p className="text-xs mt-1 text-ink-700">
                    Rows processed: {importResult.data.totalRows} | Imported: {importResult.data.imported} | Failed: {importResult.data.failed}
                  </p>
                )}
                {importResult.data?.errors && importResult.data.errors.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto border border-rose-200 rounded p-2 bg-white">
                    <ul className="text-xs text-rose-700 space-y-1 list-disc list-inside">
                      {importResult.data.errors.map((err, i) => (
                        <li key={i}>
                          Row {err.row} ({err.field}): {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-ink-100 pt-4 mt-2 pointer-events-auto">
              <Button type="button" variant="secondary" onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }} disabled={importing}>
                Close
              </Button>
              <Button type="button" onClick={handleImport} disabled={importing || !importFile}>
                {importing ? 'Importing...' : 'Upload & Import'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default StudentManagementPage;
