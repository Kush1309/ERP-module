import React from 'react';
import { Link } from 'react-router-dom';

export default function FeeCard({ fees }) {
    const pendingAmount = fees?.pendingAmount || 0;

    return (
        <div className="relative group rounded-[18px] border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] flex flex-col justify-between h-full min-h-[160px]">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-500 tracking-wide">Fees</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-800">
                            {pendingAmount > 0 ? `₹${pendingAmount.toLocaleString()}` : '₹0'}
                        </span>
                        <span className="text-sm font-semibold text-slate-600">Pending</span>
                    </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-slate-50 pt-4">
                <Link to="/fees" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                    View Details
                </Link>
            </div>
        </div>
    );
}
