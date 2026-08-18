import React from 'react';
import { Link } from 'react-router-dom';

export default function MyClassesCard({ classes }) {
    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 h-full min-h-[300px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    My Classes
                </h3>
                <Link to="/teacher/attendance" className="text-xs font-bold text-blue-600 hover:text-blue-700">View All <span className="translate-x-1 inline-block">→</span></Link>
            </div>

            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar">
                {classes?.length > 0 ? (
                    <div className="space-y-4">
                        {classes.map((cls, idx) => (
                            <div key={idx} className="flex flex-col gap-1 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                <h4 className="text-sm font-bold text-slate-800">Class {cls.className}-{cls.section}</h4>
                                <div className="flex items-center justify-between mt-1 text-xs">
                                    <span className="text-slate-500">{cls.subject}</span>
                                    <span className="font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">{cls.studentCount || 0} Students</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <p className="font-bold text-sm text-slate-700">No assigned classes</p>
                    </div>
                )}
            </div>
        </div>
    );
}
