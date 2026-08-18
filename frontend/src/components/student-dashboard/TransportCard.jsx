import React from 'react';
import { Link } from 'react-router-dom';

export default function TransportCard({ transport }) {
    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 h-full min-h-[300px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    Transport
                </h3>
                <Link to="#" className="text-xs font-bold text-blue-600 hover:text-blue-700">View Transport</Link>
            </div>

            <div className="flex-1 p-5 flex flex-col justify-center">
                {transport?.allocation ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500 font-semibold">Route</span>
                            <span className="text-sm text-slate-800 font-bold">{transport.allocation.route?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                            <span className="text-sm text-slate-500 font-semibold">Pickup</span>
                            <span className="text-sm text-slate-800 font-bold">{transport.allocation.pickupPoint || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                            <span className="text-sm text-slate-500 font-semibold">Drop</span>
                            <span className="text-sm text-slate-800 font-bold">{transport.allocation.dropPoint || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                            <span className="text-sm text-slate-500 font-semibold">Status</span>
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-bold tracking-wide uppercase">ACTIVE</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        </div>
                        <span className="text-sm font-bold text-slate-700">No transport allocation</span>
                        <span className="text-xs text-slate-400 mt-1 text-center">You are not allocated to any transport.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
