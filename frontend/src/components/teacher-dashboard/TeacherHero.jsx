import React from 'react';

export default function TeacherHero({ teacher }) {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="relative rounded-2xl bg-white overflow-hidden shadow-sm border border-slate-100 flex flex-col md:flex-row items-center p-6 sm:p-8">
            <div className="flex-1 relative z-10 w-full mb-6 md:mb-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                    {getGreeting()}, {teacher?.firstName || 'Teacher'}! <span className="text-3xl animate-bounce-slow">👋</span>
                </h1>
                <p className="mt-2 text-slate-500 font-medium">Here's your teaching and class overview for today.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-bold shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {today}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-600 text-sm font-bold shadow-sm">
                        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        Have a great day ahead!
                    </span>
                </div>
            </div>

            <div className="hidden md:block absolute right-0 bottom-0 top-0 w-[40%] bg-gradient-to-l from-emerald-50 to-transparent pointer-events-none"></div>

            <div className="relative z-10 shrink-0 transform hover:scale-105 transition-transform duration-500 w-full md:w-auto flex justify-center md:justify-end">
                {/* Visual representation similar to the reference image */}
                <svg width="240" height="120" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40 100 C 40 80, 80 80, 80 100" fill="#34D399" opacity="0.3" />
                    <rect x="120" y="40" width="80" height="60" rx="4" fill="#0EA5E9" />
                    <rect x="130" y="50" width="60" height="40" rx="2" fill="#E0F2FE" />
                    <path d="M120 100 L200 100 L220 120 L100 120 Z" fill="#0284C7" />
                </svg>
            </div>
        </div>
    );
}
