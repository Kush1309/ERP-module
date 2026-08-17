import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboardStats } from '../services/dashboardApi';

// Predefined skeleton placeholder for cards
const SkeletonText = ({ className = "h-6 w-16" }) => (
  <span className={`animate-pulse bg-slate-200 rounded block mt-1 ${className}`}></span>
);

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters = {};
      if (selectedClass) filters.class = selectedClass;
      if (selectedSection) filters.section = selectedSection;

      const data = await getAdminDashboardStats(filters);
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
      // Soft error display avoiding raw stack traces
      setError('Unable to load dashboard data right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedClass, selectedSection]);

  const handleRetry = () => {
    fetchStats();
  };

  // Helper formatting 
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '--';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.students?.total !== undefined ? stats.students.total.toLocaleString() : null,
      subtitle: selectedClass ? `Students enrolled in class` : 'Students enrolled across campus',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: stats?.students?.active !== undefined ? `${stats.students.active} active students` : 'Current enrollment'
    },
    {
      title: 'Total Teachers',
      value: stats?.teachers?.total !== undefined ? stats.teachers.total.toLocaleString() : null,
      subtitle: 'Active faculty members',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: stats?.teachers?.inactive > 0 ? `${stats.teachers.inactive} currently inactive` : 'Fully staffed'
    },
    {
      title: 'Today\'s Attendance',
      value: stats?.attendance?.recorded ? `${stats.attendance.percentage}%` : (stats?.attendance?.recorded === false ? '0%' : null),
      subtitle: 'School-wide roll call',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: stats?.attendance?.recorded
        ? `Present: ${stats.attendance.present} | Absent: ${stats.attendance.absent}`
        : 'No attendance recorded today'
    },
    {
      title: 'Pending Leaves',
      value: stats?.leaves?.pending !== undefined ? stats.leaves.pending.toLocaleString() : null,
      subtitle: 'Awaiting administrator approval',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: stats?.leaves?.approved !== undefined ? `${stats.leaves.approved} already approved` : 'Check Leave Management'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">

      {/* Top Header / Actions Area */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Overview</h2>
            <p className="text-sm text-slate-500 mt-1">Key metrics and operational summary for the campus.</p>
          </div>

          {/* Dynamic Data Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col">
              <label htmlFor="class-select" className="sr-only">Filter by Class</label>
              <select
                id="class-select"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection(''); // reset section on class change
                }}
                disabled={isLoading || error !== null}
                className="block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-sm focus:border-brand-500 focus:outline-none focus:ring-brand-500 disabled:opacity-50"
              >
                <option value="">All Classes</option>
                {stats?.meta?.classes?.map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>

            {stats?.meta?.sections && stats.meta.sections.length > 0 && selectedClass && (
              <div className="flex flex-col">
                <label htmlFor="section-select" className="sr-only">Filter by Section</label>
                <select
                  id="section-select"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  disabled={isLoading || error !== null}
                  className="block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-sm focus:border-brand-500 focus:outline-none focus:ring-brand-500 disabled:opacity-50"
                >
                  <option value="">All Sections</option>
                  {stats.meta.sections.map(s => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>
            )}

            {(selectedClass || selectedSection) && (
              <span className="text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-full inline-flex items-center shadow-sm">
                Filtering applied
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3 shrink-0">
          <Link to="/admin/students/new" className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors">
            Admit Student
          </Link>
          <Link to="/admin/teachers/new" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors">
            Add Teacher
          </Link>
        </div>
      </div>

      {/* Global Error State */}
      {error && !isLoading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <h3 className="font-semibold text-red-800 text-lg mb-2">Notice</h3>
          <p className="text-red-600 text-sm max-w-sm mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
          >
            Retry Aggregation
          </button>
        </div>
      )}

      {/* Stats Cards Row 1 */}
      {!error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {statCards.map((stat, i) => (
            <Link key={i} to={i === 3 ? '/leaves' : (i === 1 ? '/admin/teachers' : (i === 0 ? '/admin/students' : '/admin/attendance'))} className="rounded-xl border border-slate-200 bg-white p-5 lg:p-6 shadow-sm hover:shadow-md transition-all hover:border-brand-200 group flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-500">{stat.title}</h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    {isLoading || stat.value === null ? (
                      <SkeletonText className="h-8 w-20" />
                    ) : (
                      <p className="text-3xl font-bold text-slate-900 leading-none">{stat.value}</p>
                    )}
                  </div>
                </div>
                <div className={`rounded-lg p-3 ${stat.bgColor} group-hover:scale-105 transition-transform`}>
                  <svg className={`h-6 w-6 ${stat.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-1 text-sm">
                <span className="text-slate-600">{stat.subtitle}</span>
                {isLoading || stat.value === null ? (
                  <SkeletonText className="h-4 w-32 mt-1" />
                ) : (
                  <span className="text-xs font-semibold text-slate-500">{stat.trend}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats Cards Row 2 - Deep Functionality */}
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">

          {/* Fees */}
          <Link to="/fees" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:shadow-md hover:border-teal-200 group transition-all">
            <div className="flex items-center gap-3 text-slate-700 font-medium pb-3 border-b border-slate-100">
              <svg className="w-5 h-5 text-teal-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Fee Collection
            </div>
            <div>
              {isLoading || !stats ? (
                <SkeletonText className="h-7 w-24 mb-1" />
              ) : (
                <span className="text-2xl font-bold text-slate-800 leading-tight block">{formatCurrency(stats.fees?.totalPaid)}</span>
              )}
              <span className="text-sm font-medium text-slate-600">Paid securely</span>
            </div>
            <div>
              {isLoading || !stats ? (
                <SkeletonText className="h-4 w-28" />
              ) : (
                <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-1 rounded inline-block">{formatCurrency(stats.fees?.pendingAmount)} pending</span>
              )}
            </div>
          </Link>

          {/* Library */}
          <Link to="/library" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:shadow-md hover:border-pink-200 group transition-all">
            <div className="flex items-center gap-3 text-slate-700 font-medium pb-3 border-b border-slate-100">
              <svg className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Library
            </div>
            <div>
              {isLoading || !stats ? (
                <SkeletonText className="h-7 w-20 mb-1" />
              ) : (
                <span className="text-2xl font-bold text-slate-800 leading-tight block">{stats.library?.totalBooks?.toLocaleString()}</span>
              )}
              <span className="text-sm font-medium text-slate-600">Total books</span>
            </div>
            <div>
              {isLoading || !stats ? (
                <SkeletonText className="h-4 w-28" />
              ) : (
                <span className="text-xs font-semibold text-pink-600 bg-pink-50 px-2 py-1 rounded inline-block">{stats.library?.issued} currently issued</span>
              )}
            </div>
          </Link>

          {/* Homework */}
          <Link to="/homework" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:shadow-md hover:border-indigo-200 group transition-all">
            <div className="flex items-center gap-3 text-slate-700 font-medium pb-3 border-b border-slate-100">
              <svg className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Homework
            </div>
            <div>
              {isLoading || !stats ? (
                <SkeletonText className="h-7 w-16 mb-1" />
              ) : (
                <span className="text-2xl font-bold text-slate-800 leading-tight block">{stats.homework?.active?.toLocaleString()}</span>
              )}
              <span className="text-sm font-medium text-slate-600">Active assignments</span>
            </div>
            <div>
              {isLoading || !stats ? (
                <SkeletonText className="h-4 w-32" />
              ) : (
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block">Recently published module</span>
              )}
            </div>
          </Link>

          {/* Transport */}
          <Link to="/admin/transport" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:shadow-md hover:border-cyan-200 group transition-all relative">

            <div className="flex items-center gap-3 text-slate-700 font-medium pb-3 border-b border-slate-100">
              <svg className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              Transport
            </div>
            <div>
              {isLoading || !stats ? (
                <SkeletonText className="h-7 w-16 mb-1" />
              ) : (
                <span className="text-2xl font-bold text-slate-800 leading-tight block">{stats.transport?.routes?.toLocaleString()}</span>
              )}
              <span className="text-sm font-medium text-slate-600">Total routes</span>
            </div>
            <div>
              {isLoading || !stats ? (
                <SkeletonText className="h-4 w-28" />
              ) : (
                <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-1 rounded inline-block">{stats.transport?.activeAllocations} active allocations</span>
              )}
            </div>
          </Link>

        </div>
      )}

      {/* Noticeboard Block */}
      {!error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-2">
          {/* Recent Notifications / Actions */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[350px]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                Recent Notices
              </h3>
              <Link to="/admin/notices" className="text-sm font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1 rounded-full">View All</Link>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  <SkeletonText className="w-full h-12" />
                  <SkeletonText className="w-full h-12" />
                  <SkeletonText className="w-3/4 h-12" />
                </div>
              ) : (
                stats?.notices?.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {stats.notices.map(notice => (
                      <div key={notice._id} className="p-5 hover:bg-slate-50 transition-colors">
                        <h4 className="font-semibold text-slate-800 text-sm">{notice.title}</h4>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">
                          {new Date(notice.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{notice.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    </div>
                    <p className="text-sm font-medium text-slate-600">No recent notices available right now.</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[250px]">Broadcast new announcements to students and teachers from the noticeboard.</p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[350px]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Operational Quick Access
              </h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 flex-1 overflow-y-auto content-start">
              {[
                { name: 'Directory', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', link: '/admin/students', color: 'text-blue-600', bg: 'bg-blue-50' },
                { name: 'Faculty', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', link: '/admin/teachers', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { name: 'Roll Call', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', link: '/admin/attendance', color: 'text-orange-600', bg: 'bg-orange-50' },
                { name: 'Timetable', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', link: '/admin/timetable', color: 'text-sky-600', bg: 'bg-sky-50' },
                { name: 'Examinations', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', link: '/admin/examinations', color: 'text-amber-600', bg: 'bg-amber-50' },
                { name: 'Messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', link: '/messages', color: 'text-purple-600', bg: 'bg-purple-50' }
              ].map(item => (
                <Link key={item.name} to={item.link} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-brand-300 hover:shadow-sm transition-all group">
                  <span className={`shrink-0 flex items-center justify-center rounded-md p-2 ${item.bg} group-hover:scale-110 transition-transform`}>
                    <svg className={`h-5 w-5 ${item.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </span>
                  <span className="font-semibold text-sm text-slate-700 group-hover:text-brand-600">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;
