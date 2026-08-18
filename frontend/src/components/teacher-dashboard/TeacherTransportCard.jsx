import React from 'react';
import { Link } from 'react-router-dom';

export default function TeacherTransportCard({ transport }) {
    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 h-full min-h-[220px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    Transport
                </h3>
            </div>

            <div className="flex-1 p-5 flex flex-col justify-center">
                {transport?.allocation ? (
                    <div className="space-y-4 w-full">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500 font-semibold">Route</span>
                            <span className="text-sm text-slate-800 font-bold">{transport.allocation.route?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                            <span className="text-sm text-slate-500 font-semibold">Pickup</span>
                            <span className="text-sm text-slate-800 font-bold">{transport.allocation.pickupPoint || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                            <span className="text-sm text-slate-500 font-semibold">Vehicle</span>
                            <span className="text-sm text-slate-800 font-bold">{transport.allocation.vehicleNumber || 'N/A'}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                        <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        <p className="font-bold text-sm text-slate-700">No transport info available</p>
                    </div>
                )}
            </div>

            <div className="px-5 py-4 mt-auto">
                <Link to="/transport" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 group/link">
                    View Transport <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                </Link>
            </div>
        </div>
    );
}
