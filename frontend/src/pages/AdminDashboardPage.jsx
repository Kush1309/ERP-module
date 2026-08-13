import { Link } from 'react-router-dom';
import RoleDashboard from './RoleDashboard';

function AdminDashboardPage() {
  return (
    <RoleDashboard
      title="Admin dashboard"
      description="Manage the school system, teachers, and attendance operations."
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-ink-900 mb-3">Student Management</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/admin/students" className="block p-4 rounded-xl border border-ink-200 bg-white hover:border-brand-300 hover:shadow-sm transition-all text-left">
              <h3 className="font-medium text-ink-900">Student Management</h3>
              <p className="mt-1 text-sm text-ink-500">Manage students, view student details, and manage student records.</p>
            </Link>
            <Link to="/admin/students/new" className="block p-4 rounded-xl border border-ink-200 bg-white hover:border-brand-300 hover:shadow-sm transition-all text-left">
              <h3 className="font-medium text-ink-900">Add Student</h3>
              <p className="mt-1 text-sm text-ink-500">Create a new student profile in the system.</p>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink-900 mb-3">Teacher Management</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/admin/teachers" className="block p-4 rounded-xl border border-ink-200 bg-white hover:border-brand-300 hover:shadow-sm transition-all text-left">
              <h3 className="font-medium text-ink-900">Teacher Management</h3>
              <p className="mt-1 text-sm text-ink-500">Manage, search, edit, and activate/deactivate teachers.</p>
            </Link>
            <Link to="/admin/teachers/new" className="block p-4 rounded-xl border border-ink-200 bg-white hover:border-brand-300 hover:shadow-sm transition-all text-left">
              <h3 className="font-medium text-ink-900">Add Teacher</h3>
              <p className="mt-1 text-sm text-ink-500">Create a new teacher account.</p>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink-900 mb-3">Attendance Management</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/admin/attendance" className="block p-4 rounded-xl border border-ink-200 bg-white hover:border-brand-300 hover:shadow-sm transition-all text-left">
              <h3 className="font-medium text-ink-900">Attendance Management</h3>
              <p className="mt-1 text-sm text-ink-500">View, update, export and delete attendance records.</p>
            </Link>
            <Link to="/admin/attendance/report" className="block p-4 rounded-xl border border-ink-200 bg-white hover:border-brand-300 hover:shadow-sm transition-all text-left">
              <h3 className="font-medium text-ink-900">Attendance Report</h3>
              <p className="mt-1 text-sm text-ink-500">View reports with student-wise summaries and filters.</p>
            </Link>
            <Link to="/admin/attendance/analytics" className="block p-4 rounded-xl border border-ink-200 bg-white hover:border-brand-300 hover:shadow-sm transition-all text-left">
              <h3 className="font-medium text-ink-900">Attendance Analytics</h3>
              <p className="mt-1 text-sm text-ink-500">View class/section statistics and daily trends.</p>
            </Link>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink-900 mb-3">Timetable Management</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/admin/timetable" className="block p-4 rounded-xl border border-ink-200 bg-white hover:border-brand-300 hover:shadow-sm transition-all text-left">
              <h3 className="font-medium text-ink-900">Timetable Management</h3>
              <p className="mt-1 text-sm text-ink-500">View, create, update, and manage class schedules.</p>
            </Link>
          </div>
        </div>
      </div>
    </RoleDashboard>
  );
}

export default AdminDashboardPage;
