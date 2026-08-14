import { Link } from 'react-router-dom';
import RoleDashboard from './RoleDashboard';
import Button from '../components/Button';

function TeacherDashboardPage() {
  return (
    <RoleDashboard
      title="Teacher dashboard"
      description="Authentication and role checks are active."
    >
      <div>
        <h2 className="mb-2 font-display text-xl font-semibold text-ink-900">Teacher Operations</h2>
        <p className="mb-4 text-sm text-ink-600">Manage your classroom attendance.</p>
        <div className="flex gap-4">
          <Link to="/teacher/attendance">
            <Button type="button">Mark Attendance</Button>
          </Link>
          <Link to="/teacher/attendance/history">
            <Button type="button" variant="secondary">Attendance History</Button>
          </Link>
          <Link to="/teacher/attendance/report">
            <Button type="button" variant="secondary">Attendance Report</Button>
          </Link>
          <Link to="/teacher/timetable">
            <Button type="button" variant="secondary">My Timetable</Button>
          </Link>
          <Link to="/teacher/notices">
            <Button type="button" variant="secondary">School Noticeboard</Button>
          </Link>
          <Link to="/messages">
            <Button type="button" variant="secondary">Messages</Button>
          </Link>
        </div>
      </div>
    </RoleDashboard>
  );
}

export default TeacherDashboardPage;
