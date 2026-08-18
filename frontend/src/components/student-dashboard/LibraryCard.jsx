import React from 'react';
import { Link } from 'react-router-dom';

export default function LibraryCard({ library }) {
    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 h-full min-h-[300px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    Library
                </h3>
                <Link to="/library" className="text-xs font-bold text-blue-600 hover:text-blue-700">View Library</Link>
            </div>

            <div className="flex-1 p-5 flex flex-col justify-center">
                {library?.hasBooks ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span className="text-sm font-semibold text-slate-600">Books Issued</span>
                            <span className="text-sm font-bold text-slate-800">{library.issuedCount || 0}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span className="text-sm font-semibold text-slate-600">Books Due</span>
                            <span className="text-sm font-bold text-red-500">{library.dueCount || 0}</span>
                        </div>
                        {library.nextReturnDate && (
                            <div className="text-center mt-2">
                                <span className="text-xs text-slate-500">Next Return: <span className="font-bold text-slate-800">{new Date(library.nextReturnDate).toLocaleDateString()}</span></span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <span className="text-sm font-bold text-slate-700">No library books issued</span>
                        <span className="text-xs text-slate-400 mt-1 text-center">You have no books issued at the moment.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
