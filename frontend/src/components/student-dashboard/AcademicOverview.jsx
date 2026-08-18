import React from 'react';
import TiltCard from './TiltCard';

export default function AcademicOverview({ results }) {
    // Mocking the chart view with a slick CSS area graph
    return (
        <TiltCard className="col-span-1 lg:col-span-2 block h-[350px] relative group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all" maxRotation={1}>
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Academic Performance
                </h3>
            </div>
            <div className="p-6 flex flex-col h-[290px]">
                {results?.length > 0 ? (
                    <div className="flex-1 flex flex-col group-hover:-translate-y-1 transition-transform overflow-y-auto hide-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 font-bold uppercase tracking-wider bg-white sticky top-0 border-b border-slate-100 backdrop-blur-md">
                                <tr>
                                    <th className="py-3 px-2">Exam</th>
                                    <th className="py-3 px-2">Subject</th>
                                    <th className="py-3 px-2 text-right">Marks</th>
                                    <th className="py-3 px-2 text-center">Grade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {results.map((res, idx) => {
                                    const percentage = (res.marksObtained / res.totalMarks) * 100;
                                    const isGood = percentage >= 75;
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-2 text-slate-700 font-medium">{res.exam?.name || 'N/A'}</td>
                                            <td className="py-3 px-2 text-slate-500">{res.subject || 'N/A'}</td>
                                            <td className="py-3 px-2 text-right font-bold text-slate-800">
                                                {res.marksObtained}<span className="text-slate-400 font-normal text-xs">/{res.totalMarks}</span>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest shadow-sm ${isGood ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                    {res.grade || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform text-indigo-300">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <span className="text-sm font-bold text-slate-500">No results published yet</span>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">Your academic performance will be visualized here once examination results are declared.</p>
                    </div>
                )}
            </div>
        </TiltCard>
    );
}
