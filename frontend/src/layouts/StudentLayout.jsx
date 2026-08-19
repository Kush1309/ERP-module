import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';

const navigation = [
    { name: 'Dashboard', href: '/student/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'My Profile', href: '#', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { name: 'Attendance', href: '/student/attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { name: 'Examination', href: '#', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Results', href: '/student/results', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Timetable', href: '/student/timetable', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Homework', href: '/homework', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'Leave Management', href: '/leaves', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Library', href: '/library', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'Fees', href: '/fees', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Transport', href: '/transport', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { name: 'Notices', href: '/student/notices', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
    { name: 'Messages', href: '/messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
];

export default function StudentLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();
    const currentPath = location.pathname;

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0B1730] text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex h-16 shrink-0 items-center gap-3 px-6 bg-[#0B1730]/90 border-b border-white/5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 font-bold text-white shadow-sm">
                        SE
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold leading-tight tracking-tight">School ERP</span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Campus Operations</span>
                    </div>
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
                    <nav className="flex flex-1 flex-col space-y-1">
                        {navigation.map((item) => {
                            const isActive = item.href !== '#' && (currentPath === item.href || (item.href !== '/student/dashboard' && currentPath.startsWith(item.href)));
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href !== '#' ? item.href : currentPath}
                                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <svg
                                        className={`h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                    </svg>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                {/* Logout at bottom of sidebar */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={logout}
                        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <svg className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main layout */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Header */}
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 shadow-sm relative z-10 transition-colors duration-200">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            type="button"
                            className="lg:hidden text-slate-500 hover:text-slate-700"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-slate-800 hidden sm:block tracking-tight">Student Dashboard</h1>

                        {/* Optional Search */}
                        <div className="hidden md:block ml-8 max-w-sm w-full">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    placeholder="Search anything..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors hidden sm:block">
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-3 pr-4 sm:border-l border-slate-200 sm:pl-4">
                            <div className="flex flex-col items-end hidden sm:flex">
                                <span className="text-sm font-bold text-slate-800">{user?.name || user?.loginId || 'Student'}</span>
                                <span className="text-xs font-medium text-slate-500 uppercase">{user?.employeeId || user?.loginId}</span>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex flex-shrink-0 items-center justify-center text-blue-700 font-bold border border-blue-200 shadow-sm">
                                {(user?.name || user?.loginId || 'S').charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#F7F9FC]">
                    {children}
                </main>
            </div>
        </div>
    );
}
