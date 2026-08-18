import React from 'react';
import { Link } from 'react-router-dom';

export default function TimetableCard({ timetable }) {
    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 h-full min-h-[300px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Today's Timetable
                </h3>
            </div>

            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar">
                {timetable?.classes?.length > 0 ? (
                    <div className="space-y-3">
                        {timetable.classes.map((cls, idx) => (
                            <div key={idx} className="flex gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div className="text-xs font-bold text-slate-500 min-w-[60px] pt-1">
                                    {cls.time}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">{cls.subject}</h4>
                                    <div className="text-xs text-slate-500 mt-1 flex gap-2">
                                        <span>{cls.teacher}</span>
                                        <span>•</span>
                                        <span>{cls.room}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="font-bold text-sm text-slate-700">No classes today</p>
                        <p className="text-xs text-slate-400 mt-1">Enjoy your free time!</p>
                        <Link to="/student/timetable" className="mt-4 px-4 py-2 bg-blue-50 rounded-lg text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors">
                            View Timetable
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
