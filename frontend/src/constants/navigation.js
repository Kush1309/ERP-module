// Sidebar navigation for every role. Icons are the Heroicons outline paths
// already used by the original Admin panel so all portals look identical.

const ICONS = {
    admissions: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
    academic: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
    staff: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2',
    staffAttendance: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm4-6l2 2 4-4',
    events: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    hostel: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    inventory: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    reports: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    students: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    teachers: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    attendance: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    examination: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    results: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    timetable: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    notices: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
    parents: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    messages: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
    homework: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    leave: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    library: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    fees: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    transport: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    profile: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
};

export const ADMIN_NAVIGATION = [
    { name: 'Dashboard', href: '/admin', icon: ICONS.dashboard },
    { name: 'Students', href: '/admin/students', icon: ICONS.students },
    { name: 'Teachers', href: '/admin/teachers', icon: ICONS.teachers },
    { name: 'Attendance', href: '/admin/attendance', icon: ICONS.attendance },
    { name: 'Examination', href: '/admin/examinations', icon: ICONS.examination },
    { name: 'Results', href: '/admin/examinations', icon: ICONS.results },
    { name: 'Timetable', href: '/admin/timetable', icon: ICONS.timetable },
    { name: 'Noticeboard', href: '/admin/notices', icon: ICONS.notices },
    { name: 'Parent Portal', href: '/admin/parents', icon: ICONS.parents },
    { name: 'Messaging', href: '/messages', icon: ICONS.messages },
    { name: 'Homework', href: '/homework', icon: ICONS.homework },
    { name: 'Leave Management', href: '/leaves', icon: ICONS.leave },
    { name: 'Library', href: '/library', icon: ICONS.library },
    { name: 'Fees', href: '/fees', icon: ICONS.fees },
    { name: 'Transport', href: '/transport', icon: ICONS.transport },
    // Modules added after the original panel are appended so existing items keep their positions
    { name: 'Admissions', href: '/admin/admissions', icon: ICONS.admissions },
    { name: 'Academic Setup', href: '/admin/academic', icon: ICONS.academic },
    { name: 'Staff Accounts', href: '/admin/staff', icon: ICONS.staff },
    { name: 'Staff Attendance', href: '/admin/staff-attendance', icon: ICONS.staffAttendance },
    { name: 'Events', href: '/events', icon: ICONS.events },
    { name: 'Hostel', href: '/admin/hostel', icon: ICONS.hostel },
    { name: 'Inventory', href: '/admin/inventory', icon: ICONS.inventory },
    { name: 'Reports', href: '/admin/reports', icon: ICONS.reports },
    { name: 'Settings', href: '/admin/settings', icon: ICONS.settings },
];

export const TEACHER_NAVIGATION = [
    { name: 'Dashboard', href: '/teacher', icon: ICONS.dashboard },
    { name: 'Students', href: '/teacher/students', icon: ICONS.students },
    { name: 'Attendance', href: '/teacher/attendance', icon: ICONS.attendance },
    { name: 'Examination', href: '/teacher/examinations', icon: ICONS.examination },
    { name: 'Timetable', href: '/teacher/timetable', icon: ICONS.timetable },
    { name: 'Noticeboard', href: '/teacher/notices', icon: ICONS.notices },
    { name: 'Messaging', href: '/messages', icon: ICONS.messages },
    { name: 'Homework', href: '/homework', icon: ICONS.homework },
    { name: 'Leave Management', href: '/leaves', icon: ICONS.leave },
    { name: 'Library', href: '/library', icon: ICONS.library },
    { name: 'Fees', href: '/fees', icon: ICONS.fees },
    { name: 'Transport', href: '/transport', icon: ICONS.transport },
    { name: 'Events', href: '/events', icon: ICONS.events },
    { name: 'My Attendance', href: '/my-attendance', icon: ICONS.staffAttendance },
    { name: 'Profile / Settings', href: '/change-password', icon: ICONS.settings },
];

export const STUDENT_NAVIGATION = [
    { name: 'Dashboard', href: '/student/dashboard', icon: ICONS.dashboard },
    { name: 'My Profile', href: '/student/profile', icon: ICONS.profile },
    { name: 'Attendance', href: '/student/attendance', icon: ICONS.attendance },
    { name: 'Examination', href: '/student/exams', icon: ICONS.examination },
    { name: 'Results', href: '/student/results', icon: ICONS.results },
    { name: 'Timetable', href: '/student/timetable', icon: ICONS.timetable },
    { name: 'Homework', href: '/homework', icon: ICONS.homework },
    { name: 'Leave Management', href: '/leaves', icon: ICONS.leave },
    { name: 'Library', href: '/library', icon: ICONS.library },
    { name: 'Fees', href: '/fees', icon: ICONS.fees },
    { name: 'Transport', href: '/transport', icon: ICONS.transport },
    { name: 'Noticeboard', href: '/student/notices', icon: ICONS.notices },
    { name: 'Messaging', href: '/messages', icon: ICONS.messages },
    { name: 'Events', href: '/events', icon: ICONS.events },
];

export const PARENT_NAVIGATION = [
    { name: 'Dashboard', href: '/parent', icon: ICONS.dashboard },
    { name: 'Noticeboard', href: '/parent/notices', icon: ICONS.notices },
    { name: 'Messaging', href: '/messages', icon: ICONS.messages },
    { name: 'Homework', href: '/homework', icon: ICONS.homework },
    { name: 'Leave Management', href: '/leaves', icon: ICONS.leave },
    { name: 'Library', href: '/library', icon: ICONS.library },
    { name: 'Fees', href: '/fees', icon: ICONS.fees },
    { name: 'Transport', href: '/transport', icon: ICONS.transport },
    { name: 'Events', href: '/events', icon: ICONS.events },
    { name: 'Profile / Settings', href: '/change-password', icon: ICONS.settings },
];

export const ACCOUNTANT_NAVIGATION = [
    { name: 'Fees', href: '/fees', icon: ICONS.fees },
    { name: 'Messaging', href: '/messages', icon: ICONS.messages },
    { name: 'Events', href: '/events', icon: ICONS.events },
    { name: 'My Attendance', href: '/my-attendance', icon: ICONS.staffAttendance },
    { name: 'Profile / Settings', href: '/change-password', icon: ICONS.settings },
];

export const LIBRARIAN_NAVIGATION = [
    { name: 'Library', href: '/library', icon: ICONS.library },
    { name: 'Messaging', href: '/messages', icon: ICONS.messages },
    { name: 'Events', href: '/events', icon: ICONS.events },
    { name: 'My Attendance', href: '/my-attendance', icon: ICONS.staffAttendance },
    { name: 'Profile / Settings', href: '/change-password', icon: ICONS.settings },
];
