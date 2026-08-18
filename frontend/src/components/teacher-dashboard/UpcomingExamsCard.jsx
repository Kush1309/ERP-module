import React from 'react';
import { Link } from 'react-router-dom';

export default function UpcomingExamsCard({ examinations }) {
    const nextExam = examinations?.next;

    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 transition-all duration-300 hover:-translate-y-1 h-[180px] flex flex-col justify-between">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-orange-50 to-transparent rounded-bl-full pointer-events-none"></div>

            <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-800">Upcoming Exams</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-extrabold text-slate-800">{examinations?.upcomingCount || 0}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Upcoming examinations</p>
                </div>
            </div>

            <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 w-full overflow-hidden shrink-0">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Next Exam</span>
                {nextExam ? (
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 truncate mr-2">{nextExam.name}</span>
                        <span className="font-bold text-orange-600 whitespace-nowrap">{new Date(nextExam.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                ) : (
                    <span className="text-xs font-semibold text-slate-500 italic block">No exams scheduled</span>
                )}
            </div>

            <Link to="/teacher/examinations" className="absolute top-6 right-6 text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 group/link opacity-0 group-hover:opacity-100 transition-opacity">
                View <span className="group-hover/link:translate-x-1 transition-transform">→</span>
            </Link>
        </div>
    );
}
