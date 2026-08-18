import React from 'react';
import { Link } from 'react-router-dom';

export default function HomeworkCard({ homework }) {
    const pendingCount = homework?.pending || 0;

    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(168,85,247,0.08)] flex flex-col justify-between h-full min-h-[160px]">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-500 tracking-wide">Homework</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-800">{pendingCount}</span>
                        <span className="text-sm font-semibold text-slate-600">Pending</span>
                    </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-slate-50 pt-4">
                <Link to="/homework" className="text-xs font-bold text-purple-600 hover:text-purple-700">
                    View Details
                </Link>
            </div>
        </div>
    );
}
