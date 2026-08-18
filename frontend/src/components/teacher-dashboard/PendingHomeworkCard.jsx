import React from 'react';
import { Link } from 'react-router-dom';

export default function PendingHomeworkCard({ homework }) {
    const nextDue = homework?.latest?.[0];

    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 transition-all duration-300 hover:-translate-y-1 h-[180px] flex flex-col justify-between">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-purple-50 to-transparent rounded-bl-full pointer-events-none"></div>

            <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-50 text-purple-500 rounded-xl">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-800">Pending Homework</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-extrabold text-slate-800">{homework?.pending || 0}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Assignments requiring attention</p>
                </div>
            </div>

            <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 w-full overflow-hidden shrink-0">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Next Due</span>
                {nextDue ? (
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 truncate mr-2">{nextDue.title}</span>
                        <span className="font-bold text-purple-600 whitespace-nowrap">{new Date(nextDue.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                ) : (
                    <span className="text-xs font-semibold text-slate-500 italic block">No active assignments</span>
                )}
            </div>

            <Link to="/homework" className="absolute top-6 right-6 text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 group/link opacity-0 group-hover:opacity-100 transition-opacity">
                View <span className="group-hover/link:translate-x-1 transition-transform">→</span>
            </Link>
        </div>
    );
}
