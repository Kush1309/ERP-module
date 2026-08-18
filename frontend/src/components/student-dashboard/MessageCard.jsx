import React from 'react';
import { Link } from 'react-router-dom';

export default function MessageCard({ messages }) {
    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 h-full min-h-[300px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    Messages
                </h3>
                <Link to="/messages" className="text-xs font-bold text-blue-600 hover:text-blue-700">View Messages</Link>
            </div>

            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar flex flex-col">
                {messages?.recent?.length > 0 ? (
                    <div className="space-y-4">
                        {messages.recent.slice(0, 3).map((msg, idx) => (
                            <div key={idx} className="flex gap-3 items-start border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                    {msg.sender?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h4 className="text-sm font-bold text-slate-800 truncate">{msg.sender}</h4>
                                        <span className="text-[10px] text-slate-400 font-semibold">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{msg.content}</p>
                                </div>
                                {msg.unread && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </div>
                        <span className="text-sm font-bold text-slate-700">No unread messages</span>
                        <span className="text-xs text-slate-400 mt-1 text-center">You're all caught up!</span>
                    </div>
                )}
            </div>
        </div>
    );
}
