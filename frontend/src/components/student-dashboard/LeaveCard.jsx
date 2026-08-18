import React from 'react';
import { Link } from 'react-router-dom';

export default function LeaveCard({ leave }) {
    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 h-full min-h-[300px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Leave Status
                </h3>
                <Link to="/leaves" className="text-xs font-bold text-blue-600 hover:text-blue-700">View Leave</Link>
            </div>

            <div className="flex-1 p-5 flex flex-col justify-center">
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-slate-600 font-semibold">
                            <span className="w-6 h-6 rounded bg-amber-50 text-amber-500 flex items-center justify-center text-xs">↻</span>
                            Pending
                        </span>
                        <span className="font-bold text-amber-500 text-lg">{leave?.pending || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-slate-600 font-semibold">
                            <span className="w-6 h-6 rounded bg-emerald-50 text-emerald-500 flex items-center justify-center text-xs">✓</span>
                            Approved
                        </span>
                        <span className="font-bold text-emerald-500 text-lg">{leave?.approved || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-slate-600 font-semibold">
                            <span className="w-6 h-6 rounded bg-red-50 text-red-500 flex items-center justify-center text-xs">✕</span>
                            Rejected
                        </span>
                        <span className="font-bold text-red-500 text-lg">{leave?.rejected || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
