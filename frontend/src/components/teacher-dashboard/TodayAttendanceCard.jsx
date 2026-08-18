import React from 'react';
import { Link } from 'react-router-dom';

export default function TodayAttendanceCard({ attendance }) {
    const isAvailable = attendance?.percentage !== null && attendance?.percentage !== undefined;
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = isAvailable ? circumference - (attendance.percentage / 100) * circumference : circumference;

    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 transition-all duration-300 hover:-translate-y-1 h-[180px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 transform group-hover:scale-105 transition-transform duration-500">
                        <svg className="w-16 h-16 transform -rotate-90">
                            <circle cx="32" cy="32" r={radius} className="stroke-slate-100" strokeWidth="6" fill="transparent" />
                            <circle
                                cx="32" cy="32" r={radius}
                                className="stroke-blue-500 transition-all duration-1000 ease-out"
                                strokeWidth="6" fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-slate-800">{isAvailable ? `${attendance.percentage}%` : 'N/A'}</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Today's Attendance</h3>
                        <p className="text-xs text-slate-500 mt-1">Overall Attendance</p>
                    </div>
                </div>
                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                </div>
            </div>

            <div className="flex items-center gap-6 mt-4">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-emerald-600 mb-1">Present</span>
                    <span className="text-xl font-bold text-slate-800 leading-none">{attendance?.present || 0}</span>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-rose-500 mb-1">Absent</span>
                    <span className="text-xl font-bold text-slate-800 leading-none">{attendance?.absent || 0}</span>
                </div>
            </div>

            <Link to="/teacher/attendance" className="absolute bottom-4 right-4 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group/link">
                View Attendance <span className="group-hover/link:translate-x-1 transition-transform">→</span>
            </Link>
        </div>
    );
}
