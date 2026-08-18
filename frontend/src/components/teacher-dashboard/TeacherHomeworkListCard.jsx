import React from 'react';
import { Link } from 'react-router-dom';

export default function TeacherHomeworkListCard({ homework }) {
    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 h-full min-h-[300px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Homework
                </h3>
                <Link to="/homework" className="text-xs font-bold text-blue-600 hover:text-blue-700">View All <span className="translate-x-1 inline-block">→</span></Link>
            </div>

            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar">
                {homework?.latest?.length > 0 ? (
                    <div className="space-y-4">
                        {homework.latest.map((hw, idx) => (
                            <div key={idx} className="flex flex-col gap-1 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{hw.title}</h4>
                                <p className="text-[11px] text-slate-500 font-medium">Class {hw.class}-{hw.section} <span className="mx-1">•</span> <span className="text-rose-500 font-semibold">Due: {new Date(hw.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span></p>
                                <div className="mt-1 flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 uppercase tracking-wide">Pending</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <p className="font-bold text-sm text-slate-700">No active homework</p>
                    </div>
                )}
            </div>
        </div>
    );
}
