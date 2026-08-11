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
import ParentDashboardPage from './pages/ParentDashboardPage';
import StudentManagementPage from './pages/admin/StudentManagementPage';
import AddStudentPage from './pages/admin/AddStudentPage';
import StudentDetailsPage from './pages/admin/StudentDetailsPage';
import EditStudentPage from './pages/admin/EditStudentPage';
import AttendanceManagementPage from './pages/admin/AttendanceManagementPage';
import TeacherManagementPage from './pages/admin/TeacherManagementPage';
import AddTeacherPage from './pages/admin/AddTeacherPage';
import TeacherDetailsPage from './pages/admin/TeacherDetailsPage';
import TeacherAttendancePage from './pages/teacher/TeacherAttendancePage';
import { ROLES } from './constants/roles';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
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
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentDashboardPage />
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

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
