import React from 'react';
import { Link } from 'react-router-dom';

export default function AttendanceManagementCard({ classes }) {
    // Determine how many classes today
    // For this mock, we can just say classes?.length
    const classesToday = classes?.length || 0;
    // Just mock completed / pending based on dummy logic for UI since backend doesn't aggregate it perfectly yet, or we'd just show 0 if undefined
    const completed = 0;
    const pending = classesToday - completed;

    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 h-full min-h-[220px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Attendance Management
                </h3>
            </div>

            <div className="flex-1 p-5 flex flex-col justify-center gap-4">
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-100">
                        <span className="text-2xl font-extrabold text-slate-800">{classesToday}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1 text-center">Classes<br />Today</span>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 flex flex-col items-center justify-center border border-emerald-100">
                        <span className="text-2xl font-extrabold text-emerald-600">{completed}</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mt-1 text-center">Completed</span>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 flex flex-col items-center justify-center border border-amber-100">
                        <span className="text-2xl font-extrabold text-amber-600">{pending}</span>
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mt-1 text-center">Pending</span>
                    </div>
                </div>
            </div>

            <div className="px-5 py-4 mt-auto">
                <Link to="/teacher/attendance" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2 group/link">
                    Manage Attendance <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                </Link>
            </div>
        </div>
    );
}
