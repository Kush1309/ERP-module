import React from 'react';
import { Link } from 'react-router-dom';

export default function TodayTimetableCard({ timetable }) {
    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 h-full min-h-[300px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Today's Timetable
                </h3>
                <Link to="/teacher/timetable" className="text-xs font-bold text-blue-600 hover:text-blue-700">View Full <span className="translate-x-1 inline-block">→</span></Link>
            </div>

            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar">
                {timetable?.length > 0 ? (
                    <div className="space-y-4">
                        {timetable.map((cls, idx) => (
                            <div key={idx} className="flex gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="text-xs font-bold text-slate-500 w-[70px] shrink-0 pt-0.5 border-l-2 border-blue-400 pl-2">
                                    <div className="text-blue-600 font-bold whitespace-nowrap">{cls.startTime}</div>
                                    <div className="text-[10px] text-slate-400 font-semibold">{cls.endTime}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-800 truncate">{cls.subject?.name || 'Class'}</h4>
                                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-2 gap-y-1">
                                        <span className="font-semibold text-slate-600">Class {cls.class}-{cls.section}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Room {cls.room}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="font-bold text-sm text-slate-700">No classes scheduled today</p>
                    </div>
                )}
            </div>

        </div>
    );
}
