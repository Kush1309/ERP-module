import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudentDashboardStats } from '../../services/dashboardApi';

// Same skeleton as the Admin dashboard
const Skeleton = ({ className = 'h-6 w-16' }) => (
    <span className={`animate-pulse bg-slate-200 rounded block ${className}`}></span>
);

const ICONS = {
    attendance: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    homework: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    exam: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    fees: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    megaphone: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
};

const Icon = ({ d, className = 'h-5 w-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);

// Exam, homework and event dates are calendar dates stored at 00:00 UTC
const formatDay = (value) =>
    value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '';

const formatPublished = (value) =>
    value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount || 0);

// Whole days between today (local calendar) and a UTC calendar date
const daysUntil = (value) => {
    if (!value) return null;
    const target = new Date(value);
    const targetDay = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((targetDay - today) / 86400000);
};

const relativeDay = (value) => {
    const days = daysUntil(value);
    if (days === null) return '';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days > 1 && days <= 7) return `In ${days} days`;
    return formatDay(value);
};

const toMinutes = (hhmm) => {
    const [h, m] = String(hhmm || '').split(':').map(Number);
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

const PILL = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-slate-50 text-slate-600 border-slate-200',
};

const Pill = ({ tone = 'gray', children }) => (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PILL[tone]}`}>{children}</span>
);

const DEADLINE_STATUS = {
    NOT_SUBMITTED: { label: 'Not submitted', tone: 'amber' },
    RETURNED: { label: 'Returned for changes', tone: 'red' },
    UPCOMING: { label: 'Upcoming', tone: 'blue' },
    ONGOING: { label: 'In progress', tone: 'green' },
    SCHEDULED: { label: 'Scheduled', tone: 'gray' },
};

const DEADLINE_KIND = { HOMEWORK: 'Homework', EXAM: 'Exam', EVENT: 'Event' };

// ---------------------------------------------------------------------------

function WelcomeHeader({ student }) {
    const name = [student?.firstName, student?.lastName].filter(Boolean).join(' ') || 'Student';
    const initials = [student?.firstName, student?.lastName].filter(Boolean).map((p) => p.charAt(0).toUpperCase()).join('') || 'S';
    const details = [
        student?.class && `Class ${student.class}${student?.section ? ` – ${student.section}` : ''}`,
        student?.rollNumber && `Roll no. ${student.rollNumber}`,
        student?.academicYear && `Academic year ${student.academicYear}`,
    ].filter(Boolean);

    return (
        <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 text-lg font-bold" aria-hidden="true">
                {initials}
            </div>
            <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight break-words">Welcome back, {name}</h2>
                {details.length > 0 && (
                    <p className="text-sm text-slate-500 mt-1">{details.join(' · ')}</p>
                )}
            </div>
        </div>
    );
}

function SummaryCard({ to, title, value, detail, note, noteTone = 'text-slate-500', icon, color, bgColor }) {
    return (
        <Link to={to} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all hover:border-brand-200 group flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                    <p className="mt-2 text-3xl font-bold text-slate-900 leading-none truncate">{value}</p>
                </div>
                <div className={`rounded-lg p-3 ${bgColor} group-hover:scale-105 transition-transform`}>
                    <Icon d={icon} className={`h-6 w-6 ${color}`} />
                </div>
            </div>
            <div className="mt-4 flex flex-col gap-1 text-sm">
                <span className="text-slate-600 truncate">{detail}</span>
                {note && <span className={`text-xs font-semibold ${noteTone}`}>{note}</span>}
            </div>
        </Link>
    );
}

function Panel({ title, icon, action, children, className = '' }) {
    return (
        <section className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col ${className}`}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <Icon d={icon} className="h-5 w-5 text-slate-400" />
                    {title}
                </h3>
                {action}
            </div>
            <div className="flex-1">{children}</div>
        </section>
    );
}

const PanelLink = ({ to, children }) => (
    <Link to={to} className="text-sm font-medium text-brand-600 hover:text-brand-700 whitespace-nowrap">{children}</Link>
);

const PanelEmpty = ({ title, description }) => (
    <div className="px-5 py-10 text-center">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
);

function SummaryCards({ stats }) {
    const { attendance = {}, homework = {}, examinations = {}, fees = {} } = stats;

    const attendanceValue = attendance.percentage === null || attendance.percentage === undefined ? '—' : `${attendance.percentage}%`;
    const attendanceDetail = attendance.percentage === null || attendance.percentage === undefined
        ? 'No attendance recorded yet'
        : `${attendance.present} present · ${attendance.absent} absent`;
    const todayNote = attendance.today ? `Today: ${attendance.today === 'PRESENT' ? 'Present' : 'Absent'}` : attendance.period;

    const nextHomework = homework.next;
    const homeworkDetail = nextHomework
        ? `Next: ${nextHomework.title}${nextHomework.dueDate ? ` · ${relativeDay(nextHomework.dueDate)}` : ''}`
        : 'Nothing due right now';

    const nextExam = examinations.next;
    const examValue = nextExam ? (nextExam.ongoing ? 'Now' : relativeDay(nextExam.startDate)) : 'None';
    const examDetail = nextExam ? nextExam.name : 'No exams scheduled';
    const examNote = examinations.upcomingCount > 1
        ? `${examinations.upcomingCount} exams scheduled`
        : nextExam ? `Starts ${formatDay(nextExam.startDate)}` : null;

    const feeValue = fees.hasDues ? formatCurrency(fees.outstandingAmount) : 'No dues';
    const feeDetail = fees.hasDues
        ? (fees.nextDueDate ? `Next due ${formatDay(fees.nextDueDate)}` : 'Outstanding balance')
        : 'All fees are paid';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard
                to="/student/attendance"
                title="Attendance"
                value={attendanceValue}
                detail={attendanceDetail}
                note={todayNote}
                noteTone={attendance.today === 'ABSENT' ? 'text-red-600' : 'text-slate-500'}
                icon={ICONS.attendance}
                color="text-orange-600"
                bgColor="bg-orange-50"
            />
            <SummaryCard
                to="/homework"
                title="Pending Assignments"
                value={homework.pending ?? 0}
                detail={homeworkDetail}
                note={homework.overdue > 0 ? `${homework.overdue} past due date` : null}
                noteTone="text-red-600"
                icon={ICONS.homework}
                color="text-indigo-600"
                bgColor="bg-indigo-50"
            />
            <SummaryCard
                to="/student/exams"
                title="Upcoming Exams"
                value={examValue}
                detail={examDetail}
                note={examNote}
                icon={ICONS.exam}
                color="text-blue-600"
                bgColor="bg-blue-50"
            />
            <SummaryCard
                to="/fees"
                title="Fee Status"
                value={feeValue}
                detail={feeDetail}
                note={fees.overdueCount > 0 ? `${fees.overdueCount} overdue` : null}
                noteTone="text-red-600"
                icon={ICONS.fees}
                color={fees.hasDues ? 'text-teal-600' : 'text-emerald-600'}
                bgColor={fees.hasDues ? 'bg-teal-50' : 'bg-emerald-50'}
            />
        </div>
    );
}

function TodayTimetable({ timetable }) {
    const classes = timetable?.classes || [];
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const dayLabel = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });

    return (
        <Panel title="Today's Timetable" icon={ICONS.clock} action={<PanelLink to="/student/timetable">Full timetable</PanelLink>} className="lg:col-span-3">
            <p className="px-5 pt-3 text-xs font-medium uppercase tracking-wide text-slate-400">{dayLabel}</p>
            {classes.length === 0 ? (
                <PanelEmpty title="No classes scheduled today" description="Your timetable has no periods for today." />
            ) : (
                <ul className="divide-y divide-slate-100">
                    {classes.map((c) => {
                        const start = toMinutes(c.startTime);
                        const end = toMinutes(c.endTime);
                        const isNow = start !== null && end !== null && nowMinutes >= start && nowMinutes < end;
                        const isOver = end !== null && nowMinutes >= end;
                        return (
                            <li key={c._id} className={`flex items-center gap-4 px-5 py-3 ${isNow ? 'bg-brand-50' : ''}`}>
                                <div className={`w-28 shrink-0 text-sm font-medium tabular-nums ${isOver ? 'text-slate-400' : 'text-slate-700'}`}>
                                    {c.startTime} – {c.endTime}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-semibold truncate ${isOver ? 'text-slate-400' : 'text-slate-800'}`}>{c.subject || 'Subject not set'}</p>
                                    {(c.teacher || c.room) && (
                                        <p className="text-xs text-slate-500 truncate">
                                            {[c.teacher, c.room && `Room ${c.room}`].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                </div>
                                {isNow && <Pill tone="green">Now</Pill>}
                            </li>
                        );
                    })}
                </ul>
            )}
        </Panel>
    );
}

function UpcomingDeadlines({ deadlines }) {
    const items = deadlines || [];
    return (
        <Panel title="Upcoming Deadlines" icon={ICONS.calendar} className="lg:col-span-2">
            {items.length === 0 ? (
                <PanelEmpty title="Nothing coming up" description="No pending homework, exams or events ahead." />
            ) : (
                <ul className="divide-y divide-slate-100">
                    {items.map((item) => {
                        const status = DEADLINE_STATUS[item.status] || DEADLINE_STATUS.SCHEDULED;
                        const days = daysUntil(item.date);
                        return (
                            <li key={`${item.kind}-${item._id}`}>
                                <Link to={item.link} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                                    <div className="w-14 shrink-0 text-center">
                                        <p className={`text-xs font-semibold ${days !== null && days <= 1 ? 'text-red-600' : 'text-slate-500'}`}>
                                            {item.status === 'ONGOING' ? 'Now' : relativeDay(item.date)}
                                        </p>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {[
                                                DEADLINE_KIND[item.kind],
                                                item.subtitle,
                                                item.endDate && formatDay(item.endDate) !== formatDay(item.date)
                                                    ? `${formatDay(item.date)} – ${formatDay(item.endDate)}`
                                                    : formatDay(item.date),
                                            ].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                    <Pill tone={status.tone}>{status.label}</Pill>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Panel>
    );
}

function RecentAnnouncements({ notices }) {
    const items = notices?.recent || [];
    return (
        <Panel title="Recent Announcements" icon={ICONS.megaphone} action={<PanelLink to="/student/notices">View all</PanelLink>}>
            {items.length === 0 ? (
                <PanelEmpty title="No announcements" description="New notices for your class will appear here." />
            ) : (
                <ul className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {items.map((n) => (
                        <li key={n._id} className="px-5 py-4 min-w-0">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{formatPublished(n.date)}</span>
                                {(n.priority === 'URGENT' || n.priority === 'HIGH') && (
                                    <Pill tone={n.priority === 'URGENT' ? 'red' : 'amber'}>{n.priority === 'URGENT' ? 'Urgent' : 'Important'}</Pill>
                                )}
                            </div>
                            <h4 className="mt-1 text-sm font-semibold text-slate-800 line-clamp-1">{n.title}</h4>
                            {n.preview && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{n.preview}</p>}
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
            <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[140px] w-full rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <Skeleton className="h-[260px] w-full rounded-xl lg:col-span-3" />
                <Skeleton className="h-[260px] w-full rounded-xl lg:col-span-2" />
            </div>
            <Skeleton className="h-[140px] w-full rounded-xl" />
        </div>
    );
}

export default function StudentDashboardPage() {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            setStats(await getStudentDashboardStats());
        } catch (err) {
            setError(err?.response?.data?.message || 'Unable to load your dashboard right now.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
            {isLoading ? (
                <DashboardSkeleton />
            ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-center shadow-sm">
                    <h3 className="font-semibold text-red-800 text-lg mb-2">Couldn't load your dashboard</h3>
                    <p className="text-red-600 text-sm max-w-sm mb-4">{error}</p>
                    <button
                        type="button"
                        onClick={fetchStats}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <>
                    <WelcomeHeader student={stats?.student} />
                    <SummaryCards stats={stats || {}} />
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
                        <TodayTimetable timetable={stats?.timetable} />
                        <UpcomingDeadlines deadlines={stats?.deadlines} />
                    </div>
                    <RecentAnnouncements notices={stats?.notices} />
                </>
            )}
        </div>
    );
}
