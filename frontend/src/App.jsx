import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import StudentAttendancePage from './pages/student/StudentAttendancePage';
import StudentResultsPage from './pages/student/StudentResultsPage';
import ParentDashboardPage from './pages/ParentDashboardPage';
import StudentManagementPage from './pages/admin/StudentManagementPage';
import AddStudentPage from './pages/admin/AddStudentPage';
import StudentDetailsPage from './pages/admin/StudentDetailsPage';
import EditStudentPage from './pages/admin/EditStudentPage';
import AttendanceManagementPage from './pages/admin/AttendanceManagementPage';
import AttendanceReportPage from './pages/admin/AttendanceReportPage';
import AttendanceAnalyticsPage from './pages/admin/AttendanceAnalyticsPage';
import AttendanceAuditPage from './pages/admin/AttendanceAuditPage';
import TeacherManagementPage from './pages/admin/TeacherManagementPage';
import AddTeacherPage from './pages/admin/AddTeacherPage';
import TeacherDetailsPage from './pages/admin/TeacherDetailsPage';
import EditTeacherPage from './pages/admin/EditTeacherPage';
import TeacherAttendancePage from './pages/teacher/TeacherAttendancePage';
import TeacherAttendanceHistoryPage from './pages/teacher/TeacherAttendanceHistoryPage';
import TeacherAttendanceReportPage from './pages/teacher/TeacherAttendanceReportPage';
import ExaminationManagementPage from './pages/admin/ExaminationManagementPage';
import ExaminationDetailsPage from './pages/admin/ExaminationDetailsPage';
import SubjectManagementPage from './pages/admin/SubjectManagementPage';
import TeacherExaminationPage from './pages/teacher/TeacherExaminationPage';
import TeacherMarksEntryPage from './pages/teacher/TeacherMarksEntryPage';
import TimetableManagementPage from './pages/admin/TimetableManagementPage';
import TeacherTimetablePage from './pages/teacher/TeacherTimetablePage';
import StudentTimetablePage from './pages/student/StudentTimetablePage';
import NoticeManagementPage from './pages/admin/NoticeManagementPage';
import TeacherNoticesPage from './pages/teacher/TeacherNoticesPage';
import StudentNoticesPage from './pages/student/StudentNoticesPage';

import ParentStudentDetailsPage from './pages/parent/ParentStudentDetailsPage';
import ParentAttendancePage from './pages/parent/ParentAttendancePage';
import ParentResultsPage from './pages/parent/ParentResultsPage';
import ParentTimetablePage from './pages/parent/ParentTimetablePage';
import ParentNoticesPage from './pages/parent/ParentNoticesPage';
import InboxPage from './pages/messages/InboxPage';
import HomeworkPage from './pages/HomeworkPage';
import LeavePage from './pages/LeavePage';
import LibraryPage from './pages/LibraryPage';
import FeePage from './pages/FeePage';
import TransportPage from './pages/TransportPage';
import { ROLES } from './constants/roles';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <StudentManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students/new"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AddStudentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <StudentDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students/:id/edit"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <EditStudentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AttendanceManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/attendance/report"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AttendanceReportPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/attendance/analytics"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AttendanceAnalyticsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/attendance/audit"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AttendanceAuditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/teachers"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <TeacherManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/teachers/new"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AddTeacherPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/teachers/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <TeacherDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/teachers/:id/edit"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <EditTeacherPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/examinations"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <ExaminationManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/examinations/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <ExaminationDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/subjects"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <SubjectManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/timetable"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <TimetableManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/notices"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <NoticeManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
              <TeacherDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
              <TeacherAttendancePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/attendance/history"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
              <TeacherAttendanceHistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/attendance/report"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
              <TeacherAttendanceReportPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/examinations"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
              <TeacherExaminationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/examinations/:id/marks"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
              <TeacherMarksEntryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/timetable"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
              <TeacherTimetablePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/notices"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
              <TeacherNoticesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentAttendancePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/results"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentResultsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/timetable"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentTimetablePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/notices"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentNoticesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PARENT]}>
              <ParentDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/parent/students/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PARENT]}>
              <ParentStudentDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/parent/attendance/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PARENT]}>
              <ParentAttendancePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/parent/results/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PARENT]}>
              <ParentResultsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/parent/timetable/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PARENT]}>
              <ParentTimetablePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/parent/notices"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PARENT]}>
              <ParentNoticesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <InboxPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/homework"
          element={
            <ProtectedRoute>
              <HomeworkPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaves"
          element={
            <ProtectedRoute>
              <LeavePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees"
          element={
            <ProtectedRoute>
              <FeePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transport"
          element={
            <ProtectedRoute>
              <TransportPage />
            </ProtectedRoute>
          }
        />
        {/* Catch all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
