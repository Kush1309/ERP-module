import React from 'react';
import { Link } from 'react-router-dom';

const ACTIONS = [
    { name: 'Mark Attendance', href: '/teacher/attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', textColor: 'text-emerald-600', iconColor: 'text-emerald-500', borderColor: 'border-emerald-100' },
    { name: 'Create Homework', href: '/homework', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', textColor: 'text-purple-600', iconColor: 'text-purple-500', borderColor: 'border-purple-100' },
    { name: 'Create Notice', href: '/teacher/notices', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', textColor: 'text-orange-600', iconColor: 'text-orange-500', borderColor: 'border-orange-100' },
    { name: 'Upload Material', href: '#', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', textColor: 'text-blue-600', iconColor: 'text-blue-500', borderColor: 'border-blue-100' },
    { name: 'Add Exam', href: '/teacher/examinations', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', textColor: 'text-rose-600', iconColor: 'text-rose-500', borderColor: 'border-rose-100' },
    { name: 'View Results', href: '/teacher/results', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', textColor: 'text-teal-600', iconColor: 'text-teal-500', borderColor: 'border-teal-100' },
];

export default function TeacherQuickActions() {
    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-full flex flex-col md:flex-row items-center overflow-hidden">
            <div className="px-6 py-5 md:border-r border-slate-50 flex items-center justify-center shrink-0 w-full md:w-auto bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Quick Actions
                </h3>
            </div>
            <div className="p-5 flex-1 flex items-center w-full overflow-x-auto hide-scrollbar">
                <div className="flex flex-nowrap md:flex-wrap gap-4 min-w-max md:min-w-0 pb-2 md:pb-0">
                    {ACTIONS.map((action, idx) => (
                        <Link
                            key={idx}
                            to={action.href}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border ${action.borderColor} hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group/btn shrink-0`}
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
