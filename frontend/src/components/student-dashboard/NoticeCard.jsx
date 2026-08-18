import React from 'react';
import { Link } from 'react-router-dom';

export default function NoticeCard({ notices }) {
    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 h-full min-h-[300px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                    Recent Notices
                </h3>
                <Link to="/student/notices" className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</Link>
            </div>

            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar">
                {notices?.recent?.length > 0 ? (
                    <div className="space-y-4">
                        {notices.recent.slice(0, 3).map((notice, idx) => {
                            const dateString = new Date(notice.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                            return (
                                <Link to="/student/notices" key={idx} className="block group/item">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 bg-orange-50 text-orange-500 p-1.5 rounded-lg">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover/item:text-blue-600 transition-colors">{notice.title}</h4>
                                            <p className="text-xs text-slate-500 mt-1">Posted on {dateString}</p>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                        </div>
                        <span className="text-sm font-bold text-slate-700">No recent notices</span>
                        <span className="text-xs text-slate-400 mt-1 text-center">Stay tuned for important<br />announcements.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
