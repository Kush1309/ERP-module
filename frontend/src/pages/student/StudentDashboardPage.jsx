import { useState, useEffect } from 'react';
import { getStudentDashboardStats } from '../../services/dashboardApi';

import StudentHero from '../../components/student-dashboard/StudentHero';
import AttendanceCard from '../../components/student-dashboard/AttendanceCard';
import HomeworkCard from '../../components/student-dashboard/HomeworkCard';
import ExamCard from '../../components/student-dashboard/ExamCard';
import FeeCard from '../../components/student-dashboard/FeeCard';
import TimetableCard from '../../components/student-dashboard/TimetableCard';
import HomeworkListCard from '../../components/student-dashboard/HomeworkListCard';
import LibraryCard from '../../components/student-dashboard/LibraryCard';
import NoticeCard from '../../components/student-dashboard/NoticeCard';
import AttendanceChartCard from '../../components/student-dashboard/AttendanceChartCard';
import LeaveCard from '../../components/student-dashboard/LeaveCard';
import TransportCard from '../../components/student-dashboard/TransportCard';
import MessageCard from '../../components/student-dashboard/MessageCard';
import QuickActions from '../../components/student-dashboard/QuickActions';

const SkeletonText = ({ className = "h-6 w-16" }) => (
    <span className={`animate-pulse bg-slate-200/50 rounded-[18px] block mt-1 ${className}`}></span>
);

export default function StudentDashboardPage() {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getStudentDashboardStats();
            setStats(data);
        } catch (err) {
            console.error("Failed to load dashboard metrics", err);
            setError('Unable to load your dashboard information.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SkeletonText className="w-full h-[180px]" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <SkeletonText key={i} className="w-full h-[160px]" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <SkeletonText key={i} className="w-full h-[300px]" />)}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="rounded-[18px] border border-rose-100 bg-white p-10 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 w-full h-1.5 bg-rose-500"></div>
                    <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-6">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-2xl mb-2">Unable to load dashboard</h3>
                    <p className="text-slate-500 text-sm max-w-md mb-8">Something went wrong while loading your information. Please ensure you are connected and try again.</p>
                    <button
                        onClick={fetchStats}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-blue-700 transition-all"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

            {/* 1. Hero Section */}
            <section>
                <StudentHero student={stats?.student} />
            </section>

            {/* 2. Primary Metric Cards */}
            <section>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    <AttendanceCard
                        percentage={stats?.attendance?.percentage}
                        present={stats?.attendance?.present}
                        absent={stats?.attendance?.absent}
                    />
                    <HomeworkCard homework={stats?.homework} />
                    <ExamCard examinations={stats?.examinations} />
                    <FeeCard fees={stats?.fees} />
                </div>
            </section>

            {/* 3. Secondary Info Row */}
            <section>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <TimetableCard timetable={stats?.timetable} />
                    <HomeworkListCard homework={stats?.homework} />
                    <NoticeCard notices={stats?.notices} />
                    <LibraryCard library={stats?.library} />
                </div>
            </section>

            {/* 4. Infrastructure & Operational Row */}
            <section>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <AttendanceChartCard attendance={stats?.attendance} />
                    <LeaveCard leave={stats?.leave} />
                    <TransportCard transport={stats?.transport} />
                    <MessageCard messages={stats?.messages} />
                </div>
            </section>

            {/* 5. Quick Actions Row */}
            <section>
                <QuickActions />
            </section>

        </div>
    );
}
