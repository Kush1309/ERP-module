import { useCallback, useEffect, useState, useRef } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getAdminAttendanceAnalytics } from '../../services/attendanceApi';

export default function AttendanceAnalyticsPage() {
    const [analytics, setAnalytics] = useState({
        summary: { totalRecords: 0, present: 0, absent: 0, percentage: 0 },
        classSummary: [],
        sectionSummary: [],
        dailyTrend: []
    });

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        class: '',
        section: ''
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const filterRef = useRef({ ...filters });

    const loadAnalytics = useCallback(async (currentFilters = {}) => {
        setLoading(true);
        setError('');
        try {
            const queryParams = {};
            if (currentFilters.startDate) queryParams.startDate = currentFilters.startDate;
            if (currentFilters.endDate) queryParams.endDate = currentFilters.endDate;
            if (currentFilters.class) queryParams.class = currentFilters.class;
            if (currentFilters.section) queryParams.section = currentFilters.section;

            const result = await getAdminAttendanceAnalytics(queryParams);
            setAnalytics(result.data || {
                summary: { totalRecords: 0, present: 0, absent: 0, percentage: 0 },
                classSummary: [],
                sectionSummary: [],
                dailyTrend: []
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load attendance analytics.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (JSON.stringify(filterRef.current) !== JSON.stringify(filters)) {
            filterRef.current = filters;
        }
        loadAnalytics(filters);
    }, [filters, loadAnalytics]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ startDate: '', endDate: '', class: '', section: '' });
    };

    const handleRetry = () => loadAnalytics(filters);

    const hasActiveFilters = filters.startDate || filters.endDate || filters.class || filters.section;
    const { summary, classSummary, sectionSummary, dailyTrend } = analytics;

    // Helper for CSS Progress Bars
    const ProgressBar = ({ percent, colorClass }) => (
        <div className="w-full bg-ink-200 rounded-full h-2.5 overflow-hidden">
            <div className={`h-2.5 rounded-full ${colorClass}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}></div>
        </div>
    );

    return (
        <div className="mx-auto w-full max-w-6xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Admin module</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Attendance Analytics</h1>
                    <p className="mt-2 text-sm text-ink-600">View attendance trends and distribution.</p>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Class</label>
                        <input
                            type="text"
                            name="class"
                            placeholder="e.g. 10"
                            value={filters.class}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Section</label>
                        <input
                            type="text"
                            name="section"
                            placeholder="e.g. A"
                            value={filters.section}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                </div>
                {hasActiveFilters && (
                    <div className="mt-4 flex justify-end">
                        <Button type="button" variant="secondary" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </div>
                )}
            </Card>

            {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                    <div className="flex items-center gap-3 text-sm text-ink-600">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                        Loading analytics data...
                    </div>
                </div>
            ) : error ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center bg-white rounded-xl shadow-sm border border-ink-200">
                    <div className="space-y-2">
                        <p className="text-lg font-semibold text-ink-900">{error}</p>
                    </div>
                    <Button type="button" onClick={handleRetry}>Retry</Button>
                </div>
            ) : summary.totalRecords === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center bg-white rounded-xl shadow-sm border border-ink-200">
                    <p className="text-lg font-semibold text-ink-900">
                        No attendance records found for the selected criteria.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <Card className="p-4 sm:p-5 flex flex-col justify-center border-l-4 border-l-ink-800">
                            <p className="text-xs font-medium uppercase tracking-wider text-ink-500">Total Records</p>
                            <p className="mt-1 font-display text-3xl font-semibold text-ink-900">{summary.totalRecords}</p>
                        </Card>
                        <Card className="p-4 sm:p-5 flex flex-col justify-center border-l-4 border-l-emerald-500">
                            <p className="text-xs font-medium uppercase tracking-wider text-ink-500">Present</p>
                            <p className="mt-1 font-display text-3xl font-semibold text-emerald-600">{summary.present}</p>
                        </Card>
                        <Card className="p-4 sm:p-5 flex flex-col justify-center border-l-4 border-l-red-500">
                            <p className="text-xs font-medium uppercase tracking-wider text-ink-500">Absent</p>
                            <p className="mt-1 font-display text-3xl font-semibold text-red-600">{summary.absent}</p>
                        </Card>
                        <Card className="p-4 sm:p-5 flex flex-col justify-center border-l-4 border-l-brand-500">
                            <p className="text-xs font-medium uppercase tracking-wider text-ink-500">Percentage</p>
                            <p className="mt-1 font-display text-3xl font-semibold text-brand-600">{summary.percentage}%</p>
                        </Card>
                    </div>

                    {/* Present vs Absent Visualization */}
                    <Card className="p-5 sm:p-6">
                        <h3 className="text-lg font-semibold text-ink-900 mb-4 inline-flex items-center gap-2">
                            Present vs Absent Distribution
                        </h3>
                        <div className="flex items-center gap-4 w-full">
                            <div className="text-sm font-medium text-emerald-600 whitespace-nowrap min-w-16">
                                Present {summary.percentage}%
                            </div>
                            <div className="flex-1 h-6 rounded-full overflow-hidden flex bg-ink-100 shadow-inner">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${summary.percentage}%` }}
                                ></div>
                                <div
                                    className="h-full bg-red-400 transition-all duration-500"
                                    style={{ width: `${100 - summary.percentage}%` }}
                                ></div>
                            </div>
                            <div className="text-sm font-medium text-red-600 whitespace-nowrap min-w-16 text-right">
                                {(100 - summary.percentage).toFixed(2)}% Absent
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Class-wise Analytics */}
                        <Card className="p-5 sm:p-6">
                            <h3 className="text-lg font-semibold text-ink-900 mb-4">Class-wise Analysis</h3>
                            {classSummary.length === 0 ? (
                                <p className="text-sm text-ink-500">No class data available.</p>
                            ) : (
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {classSummary.map((item, idx) => (
                                        <div key={idx} className="flex flex-col gap-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-ink-900">Class {item.class}</span>
                                                <span className="text-ink-600 font-medium">{item.percentage}% ({item.totalRecords} records)</span>
                                            </div>
                                            <ProgressBar percent={item.percentage} colorClass="bg-brand-500" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Section-wise Analytics */}
                        <Card className="p-5 sm:p-6">
                            <h3 className="text-lg font-semibold text-ink-900 mb-4">Section-wise Analysis</h3>
                            {sectionSummary.length === 0 ? (
                                <p className="text-sm text-ink-500">No section data available.</p>
                            ) : (
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {sectionSummary.map((item, idx) => (
                                        <div key={idx} className="flex flex-col gap-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-ink-900">Section {item.section}</span>
                                                <span className="text-ink-600 font-medium">{item.percentage}% ({item.totalRecords} records)</span>
                                            </div>
                                            <ProgressBar percent={item.percentage} colorClass="bg-indigo-500" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Daily Trend Analysis Table */}
                    <Card className="overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-ink-100 bg-white">
                            <h3 className="text-lg font-semibold text-ink-900">Daily Attendance Trend</h3>
                            <p className="mt-1 text-sm text-ink-500">Day-by-day record of organization attendance</p>
                        </div>
                        {dailyTrend.length === 0 ? (
                            <div className="p-6 text-center text-ink-500">No daily trends available.</div>
                        ) : (
                            <div className="overflow-x-auto max-h-[400px]">
                                <table className="min-w-full divide-y divide-ink-200">
                                    <thead className="bg-ink-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Total</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Present</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Absent</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ink-200 bg-white">
                                        {dailyTrend.map((day, idx) => (
                                            <tr key={idx} className="hover:bg-ink-50/60">
                                                <td className="px-6 py-4 text-sm font-medium text-ink-900 whitespace-nowrap">{day.date}</td>
                                                <td className="px-6 py-4 text-sm text-ink-700 whitespace-nowrap">{day.totalRecords}</td>
                                                <td className="px-6 py-4 text-sm text-emerald-600 font-medium whitespace-nowrap">{day.present}</td>
                                                <td className="px-6 py-4 text-sm text-red-600 font-medium whitespace-nowrap">{day.absent}</td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium focus:outline-none 
                                                        ${day.percentage >= 75 ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                            : day.percentage >= 60 ? 'border-amber-200 bg-amber-50 text-amber-700'
                                                                : 'border-red-200 bg-red-50 text-red-700'}`}>
                                                        {day.percentage}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
