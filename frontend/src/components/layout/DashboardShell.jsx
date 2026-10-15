import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../ThemeToggle';
import NotificationBell from './NotificationBell';

/**
 * Shared application shell (sidebar + header) for every signed-in role.
 * The markup and classes are taken verbatim from the original Admin panel,
 * which is the design reference for the whole ERP; roles only differ in
 * their navigation items and labels.
 */

// Picks the single nav item whose href best matches the current path so that
// two entries pointing at related routes never highlight at the same time.
const findActiveItemName = (navigation, currentPath, homeHref) => {
    let best = null;
    navigation.forEach((item) => {
        if (!item.href || item.href === '#') return;
        const exact = currentPath === item.href;
        const nested = item.href !== homeHref && currentPath.startsWith(`${item.href}/`);
        if ((exact || nested) && (!best || item.href.length > best.href.length)) {
            best = item;
        }
    });
    return best ? best.name : null;
};

export default function DashboardShell({
    navigation,
    homeHref,
    roleLabel,
    headerTitle = 'School Management Dashboard',
    displayName,
    children,
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();
    const currentPath = location.pathname;
    const activeItemName = findActiveItemName(navigation, currentPath, homeHref);
    const welcomeName = displayName || user?.loginId || roleLabel;

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-night-900/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-night-900 text-[#ffffff] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex h-16 shrink-0 items-center gap-3 px-6 bg-night-950">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white shadow-sm">
                        SE
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold leading-tight">School ERP</span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-night-400">Campus Operations</span>
                    </div>
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
                    <nav className="flex flex-1 flex-col space-y-1">
                        {navigation.map((item) => {
                            const isActive = item.name === activeItemName;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                        ? 'bg-brand-600 text-white'
                                        : 'text-night-300 hover:bg-night-800 hover:text-[#ffffff]'
                                        }`}
                                    aria-current={isActive ? 'page' : undefined}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <svg
                                        className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-night-400 group-hover:text-[#ffffff]'}`}
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
            </aside>

            {/* Main layout */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Top Header */}
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-ink-200 bg-white px-4 sm:px-6 lg:px-8 shadow-sm relative z-10 transition-colors duration-200">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            className="lg:hidden text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-semibold text-ink-900 hidden sm:block">{headerTitle}</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <ThemeToggle />
                        <div className="flex items-center gap-3 pr-4 border-r border-ink-200">
                            <div className="flex flex-col items-end hidden sm:flex">
                                <span className="text-sm font-medium text-ink-800">Welcome, {welcomeName}</span>
                                <span className="text-xs text-ink-500">{roleLabel}</span>
                            </div>
                            <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold border border-brand-200">
                                {(welcomeName || 'U').charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="text-sm font-medium text-ink-600 hover:text-brand-600 dark:text-ink-300 dark:hover:text-brand-400 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
