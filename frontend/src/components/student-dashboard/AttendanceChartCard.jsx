import React from 'react';
import { Link } from 'react-router-dom';

export default function AttendanceChartCard({ attendance }) {
    const isAvailable = attendance?.percentage !== null && attendance?.percentage !== undefined;
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = isAvailable ? circumference - (attendance.percentage / 100) * circumference : circumference;

    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 h-full min-h-[300px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Attendance Overview
                </h3>
            </div>

            <div className="flex-1 p-5 flex items-center justify-between">
                {isAvailable ? (
                    <>
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-sm bg-emerald-500 rounded-sm"></div>
                                <span className="font-semibold text-slate-600">Present</span>
                                <span className="font-bold text-slate-800 ml-auto">{attendance.present} <span className="text-slate-400 font-medium text-xs">({attendance.percentage}%)</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-sm bg-red-500 rounded-sm"></div>
                                <span className="font-semibold text-slate-600">Absent</span>
                                <span className="font-bold text-slate-800 ml-auto">{attendance.absent} <span className="text-slate-400 font-medium text-xs">({100 - attendance.percentage}%)</span></span>
                            </div>
                        </div>
                        <div className="relative flex-1 flex justify-end">
                            <div className="relative flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                                <svg className="w-32 h-32 transform -rotate-90">
                                    <circle cx="64" cy="64" r={radius} className="stroke-slate-100" strokeWidth="12" fill="transparent" />
                                    <circle
                                        cx="64" cy="64" r={radius}
                                        className="stroke-amber-400 transition-all duration-1000 ease-out"
                                        strokeWidth="12" fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-extrabold text-slate-800 tracking-tighter">{attendance.percentage}%</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full flex flex-col items-center justify-center text-slate-400">
                        <span className="text-sm font-bold text-slate-700">Attendance data unavailable</span>
                    </div>
                )}
            </div>
        </div>
    );
}
