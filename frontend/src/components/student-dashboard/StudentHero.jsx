import React from 'react';

export default function StudentHero({ student }) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

    return (
        <div className="relative overflow-hidden rounded-[18px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between">
            <div className="relative z-10 max-w-2xl">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
                    Good morning, {student?.firstName || 'Student'}! <span className="animate-wave inline-block origin-bottom-right">👋</span>
                </h1>
                <p className="mt-4 text-[15px] font-medium text-slate-500">
                    Here's your academic overview for today.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm font-semibold text-slate-600">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {today}
                    </span>
                    <span className="flex items-center gap-2 text-indigo-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Have a productive day!
                    </span>
                </div>
            </div>

            {/* Decorative Visual on the Right */}
            <div className="hidden md:flex relative h-40 w-64 items-center justify-center">
                {/* Abstract Book/Cap Graphics */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <div className="relative h-32 w-32 animate-[float_6s_ease-in-out_infinite]">
                        {/* A very simple CSS-based geometric "books" stack or cap */}
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path fill="#EEF2FF" d="M38.8,-63.3C49.9,-54.3,58,-40.9,64.7,-26.8C71.3,-12.7,76.5,2.1,72.6,15.2C68.7,28.3,55.8,39.6,43.2,49.2C30.6,58.8,18.4,66.7,3.1,62.5C-12.3,58.3,-24.5,42.1,-37.8,31C-51.1,19.9,-65.4,14,-69.5,4.6C-73.6,-4.8,-67.5,-17.7,-57.4,-27.1C-47.3,-36.5,-33.2,-42.4,-19.9,-50.2C-6.6,-58,6,-67.7,21.5,-69.7C37,-71.7,38.8,-63.3,38.8,-63.3Z" transform="translate(100 100)" />
                            {/* Simple glowing dot */}
                            <circle cx="140" cy="60" r="12" fill="#818CF8" className="animate-pulse" />
                            <circle cx="50" cy="120" r="8" fill="#FBBF24" className="animate-pulse" style={{ animationDelay: "1s" }} />
                            <circle cx="150" cy="140" r="6" fill="#10B981" className="animate-pulse" style={{ animationDelay: "2s" }} />

                            {/* Book representation */}
                            <rect x="70" y="90" width="80" height="20" rx="4" fill="#3B82F6" transform="rotate(-10 110 100)" />
                            <rect x="70" y="115" width="80" height="15" rx="4" fill="#EF4444" transform="rotate(-5 110 120)" />
                            <rect x="70" y="135" width="80" height="15" rx="4" fill="#10B981" />
                            {/* Graduation Cap */}
                            <path d="M110 40 L60 65 L110 90 L160 65 Z" fill="#1E293B" />
                            <path d="M85 75 L85 105 A25 10 0 0 0 135 105 L135 75" fill="none" stroke="#1E293B" strokeWidth="8" />
                            {/* Tassel */}
                            <path d="M110 65 Q 130 90 145 95" fill="none" stroke="#FBBF24" strokeWidth="4" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
