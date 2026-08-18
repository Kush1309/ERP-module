import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStudentDashboardStats } from '../../services/dashboardApi';

// Predefined skeleton placeholder for cards
const SkeletonText = ({ className = "h-6 w-16" }) => (
    <span className={`animate-pulse bg-slate-200 rounded block mt-1 ${className}`}></span>
);

function StudentDashboardPage() {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getStudentDashboardStats();
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
    }, []);

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
            title: 'Overall Attendance',
            value: stats?.attendance?.percentage !== null && stats?.attendance?.percentage !== undefined ? `${stats.attendance.percentage}%` : 'N/A',
            subtitle: 'Session attendance',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            trend: stats?.attendance?.present !== undefined ? `Present: ${stats.attendance.present} | Absent: ${stats.attendance.absent}` : 'No records yet',
            link: '/student/attendance'
        },
        {
            title: 'Pending Homework',
            value: stats?.homework?.pending !== undefined ? stats.homework.pending.toLocaleString() : null,
            subtitle: 'Assignments to complete',
            icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            trend: stats?.homework?.latest ? `Next due: ${stats.homework.latest.subject}` : 'All caught up!',
            link: '/homework'
        },
        {
            title: 'Upcoming Exams',
            value: stats?.examinations?.upcomingCount !== undefined ? stats.examinations.upcomingCount.toLocaleString() : null,
            subtitle: 'Examinations scheduled',
            icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            trend: stats?.examinations?.next ? `Next: ${stats.examinations.next.name} • ${new Date(stats.examinations.next.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'No upcoming exams',
            link: '/student/timetable' // or exam link if exists
        },
        {
            title: 'Fee Status',
            value: stats?.fees?.pendingAmount !== undefined ? formatCurrency(stats.fees.pendingAmount) : null,
            subtitle: 'Pending amount',
            icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
            color: 'text-teal-600',
            bgColor: 'bg-teal-50',
            trend: stats?.fees?.hasPending ? 'Payment required' : 'All clear',
            link: '/fees'
        }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">

            {/* Top Header / Actions Area */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex flex-col gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Overview</h2>
                        <p className="text-sm text-slate-500 mt-1">Your academic and campus activity at a glance.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-slate-900">Welcome, {stats?.student?.firstName || 'Student'}</div>
                        <div className="text-xs text-slate-500">{stats?.student?.studentId || '...'}</div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-brand-100 flexitems-center justify-center text-brand-600 font-bold border border-brand-200 shadow-sm overflow-hidden flex items-center">
                        <span className="w-full text-center">{stats?.student?.firstName?.charAt(0) || 'S'}</span>
                    </div>
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
                        Retry
                    </button>
                </div>
            )}

            {/* Stats Cards Row 1 */}
            {!error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {statCards.map((stat, i) => (
                        <Link key={i} to={stat.link} className="rounded-xl border border-slate-200 bg-white p-5 lg:p-6 shadow-sm hover:shadow-md transition-all hover:border-brand-200 group flex flex-col justify-between">
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

            {/* Cards Row 2 */}
            {!error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">

                    {/* Timetable */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col h-[350px]">
                        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                <svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Today's Timetable
                            </h3>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="space-y-3"><SkeletonText className="w-full h-10" /><SkeletonText className="w-full h-10" /></div>
                            ) : (
                                stats?.timetable?.length > 0 ? (
                                    <div className="space-y-3">
                                        {stats.timetable.map((t, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                                                <div className="font-semibold text-slate-800">{t.startTime} <span className="font-medium text-slate-500 block text-xs">{t.subject?.name}</span></div>
                                                <div className="text-right"><span className="text-slate-600 block">{t.teacher?.firstName} {t.teacher?.lastName}</span><span className="text-xs text-slate-400">{t.room}</span></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-500 mt-6 pt-4 h-full">
                                        <p className="text-sm font-medium">No classes today</p>
                                    </div>
                                )
                            )}
                        </div>
                        <div className="p-3 border-t border-slate-100 bg-slate-50/30 text-center">
                            <Link to="/student/timetable" className="text-sm font-semibold text-brand-600 hover:text-brand-700">View Timetable</Link>
                        </div>
                    </div>

                    {/* Homework */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col h-[350px]">
                        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                Pending Homework
                            </h3>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="space-y-3"><SkeletonText className="w-full h-10" /><SkeletonText className="w-full h-10" /></div>
                            ) : (
                                stats?.homework?.latest?.length > 0 ? (
                                    <div className="space-y-3">
                                        {stats.homework.latest.map((hw, idx) => (
                                            <div key={idx} className="flex flex-col text-sm border-b border-slate-50 pb-2">
                                                <span className="font-medium text-slate-500 text-xs">{hw.subject}</span>
                                                <span className="font-semibold text-slate-800 truncate">{hw.title}</span>
                                                <span className="text-xs text-rose-500 mt-1">Due: {new Date(hw.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-500 mt-6 pt-4 h-full">
                                        <p className="text-sm font-medium">No pending homework</p>
                                    </div>
                                )
                            )}
                        </div>
                        <div className="p-3 border-t border-slate-100 bg-slate-50/30 text-center">
                            <Link to="/homework" className="text-sm font-semibold text-brand-600 hover:text-brand-700">View Homework</Link>
                        </div>
                    </div>

                    {/* Library */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col h-[350px]">
                        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                Library
                            </h3>
                        </div>
                        <div className="p-4 flex-1 flex flex-col items-center justify-center text-center">
                            {isLoading ? (
                                <div className="space-y-2 flex flex-col items-center"><SkeletonText className="w-16 h-10 mb-2" /><SkeletonText className="w-32 h-4" /></div>
                            ) : (
                                stats?.library?.activeIssues > 0 ? (
                                    <>
                                        <div className="text-4xl font-bold text-slate-800">{stats.library.activeIssues}</div>
                                        <p className="text-sm text-slate-600 mt-1">books issued</p>
                                        <div className="mt-4 text-xs font-semibold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-full inline-block">
                                            Next return: {stats.library.nextReturnDate ? new Date(stats.library.nextReturnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-slate-500">
                                        <p className="text-sm font-medium">No library books issued</p>
                                    </div>
                                )
                            )}
                        </div>
                        <div className="p-3 border-t border-slate-100 bg-slate-50/30 text-center">
                            <Link to="/library" className="text-sm font-semibold text-brand-600 hover:text-brand-700">View Library</Link>
                        </div>
                    </div>

                    {/* Notices */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col h-[350px]">
                        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                                Recent Notices
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-4 space-y-3"><SkeletonText className="w-full h-12" /><SkeletonText className="w-full h-12" /></div>
                            ) : (
                                stats?.notices?.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {stats.notices.map(notice => (
                                            <div key={notice._id} className="p-4 hover:bg-slate-50 transition-colors">
                                                <h4 className="font-semibold text-slate-800 text-xs">{notice.title}</h4>
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-1">
                                                    {new Date(notice.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-6 text-slate-500 h-full">
                                        <p className="text-sm font-medium">No recent notices</p>
                                    </div>
                                )
                            )}
                        </div>
                        <div className="p-3 border-t border-slate-100 bg-slate-50/30 text-center text-sm font-semibold text-brand-600">
                            <Link to="/student/notices" className="hover:text-brand-700">View All</Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Row 3 - Summary and Services */}
            {!error && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

                    {/* Academic Summary */}
                    <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Recent Results</h3>
                        {isLoading ? (
                            <div className="space-y-4 pt-2">
                                <SkeletonText className="h-4 w-full" />
                                <SkeletonText className="h-4 w-5/6" />
                            </div>
                        ) : (
                            stats?.results?.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">Exam</th>
                                                <th className="px-4 py-3 font-semibold">Subject</th>
                                                <th className="px-4 py-3 font-semibold text-right">Marks</th>
                                                <th className="px-4 py-3 font-semibold text-center">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.results.map((res, idx) => (
                                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-slate-800 font-medium">{res.exam?.name || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-slate-600">{res.subject || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-right text-slate-800">{res.marksObtained}/{res.totalMarks}</td>
                                                    <td className="px-4 py-3 text-center"><span className="bg-slate-100 px-2.5 py-0.5 rounded text-xs font-semibold text-slate-600">{res.grade || '-'}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <p className="text-sm font-medium">No recent results</p>
                                </div>
                            )
                        )}
                    </div>

                    {/* Campus Services */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Campus Services</h3>
                        <div className="flex-1 space-y-4 overflow-y-auto">
                            {/* Transport */}
                            <Link to="/transport" className="block p-3 rounded-lg border border-slate-100 hover:border-cyan-200 hover:shadow-sm bg-slate-50/50 group transition-all">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1 group-hover:text-cyan-600"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>Transport</span>
                                {isLoading ? <SkeletonText className="h-4 w-24" /> : (
                                    stats?.transport ? (
                                        <>
                                            <div className="text-sm font-semibold text-slate-800">Route: {stats.transport.route?.name}</div>
                                            <div className="text-xs text-slate-500 mt-1">Status: Active</div>
                                        </>
                                    ) : (
                                        <div className="text-sm text-slate-500">No transport allocation</div>
                                    )
                                )}
                            </Link>

                            {/* Leaves */}
                            <Link to="/leaves" className="block p-3 rounded-lg border border-slate-100 hover:border-purple-200 hover:shadow-sm bg-slate-50/50 group transition-all">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1 group-hover:text-purple-600"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Leave Status</span>
                                {isLoading ? <SkeletonText className="h-4 w-32" /> : (
                                    <div className="text-sm text-slate-700">
                                        Pending: <span className="font-semibold">{stats?.leave?.pending || 0}</span> • Approved: <span className="font-semibold text-emerald-600">{stats?.leave?.approved || 0}</span> • Rejected: <span className="font-semibold text-rose-600">{stats?.leave?.rejected || 0}</span>
                                    </div>
                                )}
                            </Link>

                            {/* Messages */}
                            <Link to="/messages" className="block p-3 rounded-lg border border-slate-100 hover:border-brand-200 hover:shadow-sm bg-brand-50/50 group transition-all">
                                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1 flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>Messages</span>
                                {isLoading ? <SkeletonText className="h-4 w-24" /> : (
                                    stats?.messages?.unreadCount > 0 ? (
                                        <div className="text-sm font-semibold text-slate-800">{stats.messages.unreadCount} unread messages</div>
                                    ) : (
                                        <div className="text-sm text-slate-500">No unread messages</div>
                                    )
                                )}
                            </Link>

                        </div>
                    </div>

                </div>
            )}

        </div>
    );
}

export default StudentDashboardPage;
