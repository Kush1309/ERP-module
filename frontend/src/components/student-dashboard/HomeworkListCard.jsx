import React from 'react';
import { Link } from 'react-router-dom';

export default function HomeworkListCard({ homework }) {
    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 h-full min-h-[300px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Pending Homework
                </h3>
                <Link to="/homework" className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</Link>
            </div>

            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar">
                {homework?.latest?.length > 0 ? (
                    <div className="space-y-4">
                        {homework.latest.slice(0, 3).map((hw, idx) => {
                            const dueDate = new Date(hw.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                            return (
                                <div key={idx} className="flex flex-col gap-1 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{hw.subject}</h4>
                                    <p className="text-xs text-slate-500 truncate">{hw.title}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs font-bold text-red-500">Due: {dueDate}</span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 uppercase tracking-wide">Pending</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <span className="text-sm font-medium">No pending assignments</span>
                    </div>
                )}
            </div>
        </div>
    );
}
