import React from 'react';
import { Link } from 'react-router-dom';

const ACTIONS = [
    { name: 'View Timetable', href: '/student/timetable', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bgColor: 'bg-blue-50', textColor: 'text-blue-600', iconColor: 'text-blue-500' },
    { name: 'Homework', href: '/homework', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', bgColor: 'bg-purple-50', textColor: 'text-purple-600', iconColor: 'text-purple-500' },
    { name: 'Examinations', href: '/student/results', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', bgColor: 'bg-orange-50', textColor: 'text-orange-600', iconColor: 'text-orange-500' },
    { name: 'Results', href: '/student/results', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', iconColor: 'text-emerald-500' },
    { name: 'Fees', href: '/fees', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', bgColor: 'bg-teal-50', textColor: 'text-teal-600', iconColor: 'text-teal-500' },
    { name: 'Library', href: '/library', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', bgColor: 'bg-pink-50', textColor: 'text-pink-600', iconColor: 'text-pink-500' },
    { name: 'Messages', href: '/messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', bgColor: 'bg-blue-50', textColor: 'text-blue-600', iconColor: 'text-blue-500' },
    { name: 'Notices', href: '/student/notices', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', bgColor: 'bg-orange-50', textColor: 'text-orange-600', iconColor: 'text-orange-500' },
];

export default function QuickActions() {
    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-full flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Quick Actions
                </h3>
            </div>
            <div className="p-5 flex-1 flex items-center">
                <div className="flex flex-wrap gap-4">
                    {ACTIONS.map((action, idx) => (
                        <Link
                            key={idx}
                            to={action.href}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${action.bgColor} border border-white hover:border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group/btn`}
                        >
                            <svg className={`w-4 h-4 ${action.iconColor} group-hover/btn:scale-110 transition-transform`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                            </svg>
                            <span className={`text-xs font-bold ${action.textColor}`}>{action.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
