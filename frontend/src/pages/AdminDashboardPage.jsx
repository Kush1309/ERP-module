import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStudents } from '../services/studentApi';
import { getTeachers } from '../services/teacherApi';

function AdminDashboardPage() {
  const [stats, setStats] = useState({
    students: null,
    teachers: null,
    attendance: null,
    pendingFees: null,
    leaves: null,
    library: null,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentRes, teacherRes] = await Promise.allSettled([
          getStudents({ limit: 1 }),
          getTeachers({ limit: 1 }),
        ]);

        const studentData = studentRes.status === 'fulfilled' ? studentRes.value : null;
        const teacherData = teacherRes.status === 'fulfilled' ? teacherRes.value : null;

        setStats(prev => ({
          ...prev,
          students: studentData?.total !== undefined ? studentData.total : (Array.isArray(studentData) ? studentData.length : null),
          teachers: teacherData?.total !== undefined ? teacherData.total : (Array.isArray(teacherData) ? teacherData.length : null),
        }));
      } catch (err) {
        console.error("Failed to load generic stats", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Students',
      value: stats.students !== null ? stats.students : '--',
      subtitle: 'Enrolled across all classes',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+12 this month'
    },
    {
      title: 'Total Teachers',
      value: stats.teachers !== null ? stats.teachers : '--',
      subtitle: 'Active faculty members',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: 'Fully staffed'
    },
    {
      title: 'Current Attendance',
      value: '--', // Not available directly in generic fetch
      subtitle: 'School-wide today',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: 'Data unavailable'
    },
    {
      title: 'Active Leaves',
      value: '--', // Not available directly without API fetch
      subtitle: 'Pending operations',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'Check Leave Management'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Overview</h2>
          <p className="text-sm text-slate-500 mt-1">Key metrics and operational summary for the campus.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/students/new" className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors">
            Admit Student
          </Link>
          <Link to="/admin/teachers/new" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors">
            Add Teacher
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-slate-900">
                    {isLoading ? <span className="animate-pulse bg-slate-200 h-8 w-16 rounded block"></span> : stat.value}
                  </p>
                </div>
              </div>
              <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                <svg className={`h-6 w-6 ${stat.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-1 text-sm">
              <span className="text-slate-600">{stat.subtitle}</span>
              <span className={`text-xs font-medium ${stat.value === '--' ? 'text-slate-400' : 'text-slate-500'}`}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Overview Chart Placeholder */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Operational Quick Access</h3>
            <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full">Primary</span>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
            <Link to="/admin/students" className="group rounded-xl border border-slate-100 bg-slate-50 p-5 hover:border-brand-300 hover:bg-white hover:shadow-sm transition-all text-center flex flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <span className="font-semibold text-slate-800">Student Directory</span>
              <span className="text-xs text-slate-500">Manage pupil records</span>
            </Link>
            <Link to="/admin/teachers" className="group rounded-xl border border-slate-100 bg-slate-50 p-5 hover:border-emerald-300 hover:bg-white hover:shadow-sm transition-all text-center flex flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <span className="font-semibold text-slate-800">Faculty Roster</span>
              <span className="text-xs text-slate-500">View teaching staff</span>
            </Link>
            <Link to="/admin/attendance" className="group rounded-xl border border-slate-100 bg-slate-50 p-5 hover:border-orange-300 hover:bg-white hover:shadow-sm transition-all text-center flex flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              </div>
              <span className="font-semibold text-slate-800">Attendance</span>
              <span className="text-xs text-slate-500">Daily roll call</span>
            </Link>
          </div>
        </div>

        {/* Recent Notifications / Actions */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Noticeboard</h3>
            <Link to="/admin/notices" className="text-sm font-medium text-brand-600 hover:text-brand-700">View All</Link>
          </div>
          <div className="p-0 flex flex-col divide-y divide-slate-100 flex-1 justify-center items-center text-center py-10 text-slate-500 px-6">
            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            </div>
            <p className="text-sm font-medium text-slate-600">No recent notices available right now.</p>
            <p className="text-xs text-slate-400 mt-1">Broadcast new announcements to students and teachers from the noticeboard.</p>
            <Link to="/admin/notices" className="mt-4 px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Go to Noticeboard</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-slate-700 font-medium pb-2 border-b border-slate-100">
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Academics
          </div>
          <p className="text-xs text-slate-500">Manage school-wide homework assignments and examinations.</p>
          <div className="flex gap-2">
            <Link to="/homework" className="text-xs font-medium text-brand-600 hover:underline">Homework</Link>
            <span className="text-slate-300">•</span>
            <Link to="/admin/examinations" className="text-xs font-medium text-brand-600 hover:underline">Exams</Link>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-slate-700 font-medium pb-2 border-b border-slate-100">
            <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Financials
          </div>
          <p className="text-xs text-slate-500">Track pending fees and process payments across the school.</p>
          <div className="flex gap-2">
            <span className="text-xs font-medium text-slate-400">Data unavailable</span>
            <span className="text-slate-300">•</span>
            <Link to="/fees" className="text-xs font-medium text-brand-600 hover:underline">Fee Mgmt</Link>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-slate-700 font-medium pb-2 border-b border-slate-100">
            <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Library
          </div>
          <p className="text-xs text-slate-500">Manage catalogues, checkout books, and enforce return states.</p>
          <div className="flex gap-2">
            <span className="text-xs font-medium text-slate-400">Data unavailable</span>
            <span className="text-slate-300">•</span>
            <Link to="/library" className="text-xs font-medium text-brand-600 hover:underline">Library Mgmt</Link>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-slate-700 font-medium pb-2 border-b border-slate-100">
            <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            Transport (Paused)
          </div>
          <p className="text-xs text-slate-500">Module 11-4 paused. Navigation entry preserved for future functionality.</p>
          <div className="flex gap-2">
            <span className="text-xs font-medium text-slate-400 cursor-not-allowed">Transport Mgmt</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
