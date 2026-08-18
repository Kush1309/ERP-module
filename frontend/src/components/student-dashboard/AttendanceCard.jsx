import React from 'react';
import { Link } from 'react-router-dom';

export default function AttendanceCard({ percentage, present, absent }) {
    const isAvailable = percentage !== null && percentage !== undefined;
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = isAvailable ? circumference - (percentage / 100) * circumference : circumference;

    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)] flex flex-col justify-between h-full min-h-[160px]">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-500 tracking-wide">Attendance</h3>
                    {isAvailable ? (
                        <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-2xl font-extrabold text-slate-800">{percentage}%</span>
                        </div>
                    ) : (
                        <div className="mt-1 text-lg font-bold text-slate-400">N/A</div>
                    )}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500 group-hover:scale-110 transition-transform">
                    {isAvailable ? (
                        <svg className="w-5 h-5 transform -rotate-90">
                            <circle cx="10" cy="10" r="10" className="stroke-blue-100" strokeWidth="3" fill="transparent" />
                            <circle
                                cx="10" cy="10" r="10"
                                className="stroke-blue-500 transition-all duration-1000 ease-out"
                                strokeWidth="3" fill="transparent"
                                strokeDasharray={2 * Math.PI * 10}
                                strokeDashoffset={(2 * Math.PI * 10) - (percentage / 100) * (2 * Math.PI * 10)}
                                strokeLinecap="round"
                            />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                <Link to="/student/attendance" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                    View Details
                </Link>
                {isAvailable && (
                    <div className="text-xs font-semibold text-slate-500 flex gap-3">
                        <span className="text-emerald-600">P: {present}</span>
                        <span className="text-red-500">A: {absent}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
