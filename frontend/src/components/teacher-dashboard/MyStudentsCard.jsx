import React from 'react';

export default function MyStudentsCard({ students }) {
    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden h-[180px] flex flex-col justify-between">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-teal-50 to-transparent rounded-bl-full pointer-events-none"></div>

            <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-50 text-teal-500 rounded-xl">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-800">My Students</h3>
                    <p className="text-xs text-slate-500 mt-1">Students under your classes</p>
                </div>
            </div>

            <div className="mt-4 flex flex-col">
                <span className="text-4xl font-extrabold text-slate-800 tracking-tighter">
                    {students?.total || 0}
                </span>
                {students?.active !== undefined && (
                    <span className="mt-2 text-xs font-semibold text-emerald-600 bg-emerald-50 self-start px-2 py-0.5 rounded uppercase tracking-wider">
                        Active: {students.active}
                    </span>
                )}
            </div>

            <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
            </div>
        </div>
    );
}
