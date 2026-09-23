import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Layout
import { AppLayout } from './components/layout/AppLayout';
import { RoleGuard } from './components/layout/RoleGuard';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
// Faculty Coordinator Pages
import { FacultyDashboardPage } from './pages/faculty/FacultyDashboardPage';
import { FacultyClassTimetablePage } from './pages/faculty/FacultyClassTimetablePage';
import { FacultyTeachingSchedulePage } from './pages/faculty/FacultyTeachingSchedulePage';

// Admin Pages
import { CreateTimetableWizardPage } from './pages/coordinator/CreateTimetableWizardPage';
import { TimetableVersionsPage } from './pages/coordinator/TimetableVersionsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { TimetablesManagePage } from './pages/admin/TimetablesManagePage';
import { ClassesManagePage } from './pages/admin/ClassesManagePage';
import { SubjectsManagePage } from './pages/admin/SubjectsManagePage';
import { FacultyManagePage } from './pages/admin/FacultyManagePage';
import { RoomsManagePage } from './pages/admin/RoomsManagePage';
import { UsersManagePage } from './pages/admin/UsersManagePage';
import { NotFoundPage } from './pages/common/NotFoundPage';
import { ForbiddenPage } from './pages/common/ForbiddenPage';

const RootRedirect: React.FC = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Initializing SCHEDURA...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'FACULTY_COORDINATOR') return <Navigate to="/faculty" replace />;
  return <Navigate to="/student" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Root Intelligent Redirection */}
            <Route path="/" element={<RootRedirect />} />

            {/* Authenticated Application Shell */}
            <Route
              element={
                <RoleGuard>
                  <AppLayout />
                </RoleGuard>
              }
            >
              {/* Student Routes */}
              <Route
                path="/student"
                element={
                  <RoleGuard allowedRoles={['STUDENT', 'FACULTY_COORDINATOR', 'ADMIN']}>
                    <StudentDashboardPage />
                  </RoleGuard>
                }
              />

              {/* Faculty Coordinator (View-Only) Routes */}
              <Route
                path="/faculty"
                element={
                  <RoleGuard allowedRoles={['FACULTY_COORDINATOR', 'ADMIN']}>
                    <FacultyDashboardPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/faculty/class-timetable"
                element={
                  <RoleGuard allowedRoles={['FACULTY_COORDINATOR', 'ADMIN']}>
                    <FacultyClassTimetablePage />
                  </RoleGuard>
                }
              />
              <Route
                path="/faculty/teaching-schedule"
                element={
                  <RoleGuard allowedRoles={['FACULTY_COORDINATOR', 'ADMIN']}>
                    <FacultyTeachingSchedulePage />
                  </RoleGuard>
                }
              />

              {/* Legacy Coordinator Redirections */}
              <Route path="/coordinator" element={<Navigate to="/faculty" replace />} />
              <Route path="/coordinator/versions" element={<Navigate to="/admin/timetables" replace />} />

              {/* Administrator Routes */}
              <Route
                path="/admin"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <AdminDashboardPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/timetables"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <TimetablesManagePage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/create-timetable"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <CreateTimetableWizardPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/coordinator/create-timetable"
                element={<Navigate to="/admin/create-timetable" replace />}
              />
              <Route
                path="/admin/classes"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <ClassesManagePage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/subjects"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <SubjectsManagePage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/faculty"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <FacultyManagePage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/rooms"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <RoomsManagePage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <RoleGuard allowedRoles={['ADMIN']}>
                    <UsersManagePage />
                  </RoleGuard>
                }
              />
            </Route>

            {/* Error Pages */}
            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
