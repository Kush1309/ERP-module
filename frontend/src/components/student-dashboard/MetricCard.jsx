import React from 'react';
import TiltCard from './TiltCard';

export default function MetricCard({ title, value, subtitle, icon, color, bgColor, iconColor, trend, link }) {
    return (
        <TiltCard className="block h-full cursor-pointer relative group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-brand-200" maxRotation={6}>
            {/* Background soft gradient based on color theme */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

            <div className="relative p-6 flex flex-col h-full justify-between z-10">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 tracking-wide uppercase">{title}</h3>
                        <div className="mt-2 flex items-baseline gap-2">
                            <p className={`text-4xl font-extrabold text-slate-800 tracking-tight leading-none drop-shadow-sm`}>{value}</p>
                        </div>
                    </div>

                    <div className={`rounded-xl p-3 ${bgColor} group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-slate-100/50`}>
                        <svg className={`h-6 w-6 transform translate-z-10 ${iconColor || 'text-brand-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                        </svg>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-1 text-sm bg-slate-50/50 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl border-t border-slate-50">
                    <span className="text-slate-600 font-medium">{subtitle}</span>
                    <span className={`text-xs font-bold ${color}`}>{trend}</span>
                </div>
            </div>
        </TiltCard>
    );
}
