import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ManagerLayout } from './components/layout/ManagerLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Teachers } from './pages/Teachers';
import { Academics } from './pages/Academics';
import { Results } from './pages/Results';
import { Attendance } from './pages/Attendance';
import { Inventory } from './pages/Inventory';
import { Certificates } from './pages/Certificates';
import { Announcements } from './pages/Announcements';
import { Settings } from './pages/Settings';

// Admin pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { StudentManagement } from './pages/admin/students/index';
import { TeacherManagement } from './pages/admin/teachers/index';
import { InventoryManagement } from './pages/admin/inventory/index';

// Manager pages
import { ManagerDashboard } from './pages/manager/Dashboard';

// Student pages
import { StudentDashboard } from './pages/student/dashboard/index';

// Teacher pages
import { AttendanceManagement } from './pages/teacher/attendance/index';
import { GradeManagement } from './pages/teacher/grades/index';

// Parent pages
import { ParentDashboard } from './pages/parent/dashboard/index';

// Components
import { BiometricAttendance } from './components/attendance/BiometricAttendance';
import { CertificateGenerator } from './components/certificates/CertificateGenerator';
import { ReportCardGenerator } from './components/certificates/ReportCardGenerator';
import { AnnouncementManager } from './components/communication/AnnouncementManager';
import { NotificationCenter } from './components/communication/NotificationCenter';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';

function AppContent() {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // If user exists but profile is not loaded yet, show loading
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const userRole = profile.role;

  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="teachers" element={<TeacherManagement />} />
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="biometric" element={<BiometricAttendance />} />
          <Route path="certificates" element={<CertificateGenerator />} />
          <Route path="report-cards" element={<ReportCardGenerator />} />
          <Route path="announcements" element={<AnnouncementManager />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
        </Route>

        {/* Manager Routes */}
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<ManagerDashboard />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="grades" element={<GradeManagement />} />
          <Route path="students" element={<Students />} />
          <Route path="results" element={<Results />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="notifications" element={<NotificationCenter />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<DashboardLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="results" element={<Results />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="notifications" element={<NotificationCenter />} />
        </Route>

        {/* Parent Routes */}
        <Route path="/parent" element={<DashboardLayout />}>
          <Route index element={<ParentDashboard />} />
          <Route path="results" element={<Results />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="notifications" element={<NotificationCenter />} />
        </Route>

        {/* Default Routes */}
        <Route path="/" element={<Navigate to={`/${userRole}`} replace />} />
        <Route path="/dashboard" element={<Navigate to={`/${userRole}`} replace />} />
        
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to={`/${userRole}`} replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
