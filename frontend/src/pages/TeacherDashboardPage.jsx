import { useState, useEffect } from 'react';
import { getTeacherDashboardStats } from '../services/dashboardApi';

import TeacherHero from '../components/teacher-dashboard/TeacherHero';
import MyStudentsCard from '../components/teacher-dashboard/MyStudentsCard';
import TodayAttendanceCard from '../components/teacher-dashboard/TodayAttendanceCard';
import PendingHomeworkCard from '../components/teacher-dashboard/PendingHomeworkCard';
import UpcomingExamsCard from '../components/teacher-dashboard/UpcomingExamsCard';

import TodayTimetableCard from '../components/teacher-dashboard/TodayTimetableCard';
import MyClassesCard from '../components/teacher-dashboard/MyClassesCard';
import TeacherHomeworkListCard from '../components/teacher-dashboard/TeacherHomeworkListCard';
import TeacherNoticeCard from '../components/teacher-dashboard/TeacherNoticeCard';

import AttendanceManagementCard from '../components/teacher-dashboard/AttendanceManagementCard';
import TeacherLeaveCard from '../components/teacher-dashboard/TeacherLeaveCard';
import TeacherMessageCard from '../components/teacher-dashboard/TeacherMessageCard';
import TeacherLibraryCard from '../components/teacher-dashboard/TeacherLibraryCard';
import TeacherTransportCard from '../components/teacher-dashboard/TeacherTransportCard';
import TeacherQuickActions from '../components/teacher-dashboard/TeacherQuickActions';

const SkeletonText = ({ className = "h-6 w-16" }) => (
  <span className={`animate-pulse bg-slate-200/50 rounded-[18px] block mt-1 ${className}`}></span>
);

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTeacherDashboardStats();
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <SkeletonText key={i} className="w-full h-[180px]" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <SkeletonText className="w-full h-[300px]" />
          <SkeletonText className="w-full h-[300px]" />
          <SkeletonText className="w-full h-[300px]" />
          <SkeletonText className="w-full h-[300px]" />
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
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-emerald-700 transition-all"
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
        <TeacherHero teacher={stats?.teacher} />
      </section>

      {/* 2. Primary Metric Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <MyStudentsCard students={stats?.students} />
          <TodayAttendanceCard attendance={stats?.attendance} />
          <PendingHomeworkCard homework={stats?.homework} />
          <UpcomingExamsCard examinations={stats?.examinations} />
        </div>
      </section>

      {/* 3. Secondary Info Row */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 tracking-wide">
          <TodayTimetableCard timetable={stats?.timetable} />
          <MyClassesCard classes={stats?.classes} />
          <TeacherHomeworkListCard homework={stats?.homework} />
          <TeacherNoticeCard notices={stats?.notices} />
        </div>
      </section>

      {/* 4. Infrastructure & Operational Row */}
      {/* The reference image shows Attendance Management, Leave Management, Messages, Library, Transport taking up the final row. 
                Using a 5-column grid or similar layout on large screens. */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
          <AttendanceManagementCard classes={stats?.timetable} />
          <TeacherLeaveCard leave={stats?.leave} />
          <TeacherMessageCard messages={stats?.messages} />
          <TeacherLibraryCard library={stats?.library} />
          <TeacherTransportCard transport={stats?.transport} />
        </div>
      </section>

      {/* 5. Quick Actions */}
      <section>
        <TeacherQuickActions />
      </section>

    </div>
  );
}
