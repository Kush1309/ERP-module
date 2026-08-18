import React from 'react';
import { Link } from 'react-router-dom';

export default function ExamCard({ examinations }) {
    const upcomingCount = examinations?.upcomingCount || 0;

    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] flex flex-col justify-between h-full min-h-[160px]">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-500 tracking-wide">Exams</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-800">{upcomingCount}</span>
                        <span className="text-sm font-semibold text-slate-600">Upcoming</span>
                    </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-500 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-slate-50 pt-4">
                <Link to="/student/results" className="text-xs font-bold text-orange-600 hover:text-orange-700">
                    View Details
                </Link>
            </div>
        </div>
    );
}
