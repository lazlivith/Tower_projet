import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';

const queryClient = new QueryClient();
import PublicLayout from './components/vitrine/PublicLayout';
import DashboardLayout from './components/learn/DashboardLayout';
import ProtectedRoute from './components/learn/ProtectedRoute';

// Public Pages
import Home from './pages/vitrine/Home';
import About from './pages/vitrine/About';
import Services from './pages/vitrine/Services';
import ServiceDetail from './pages/vitrine/ServiceDetail';
import Formations from './pages/vitrine/Formations';
import Quote from './pages/vitrine/Quote';

// Auth & Payment
import Login from './pages/learn/auth/Login';
import FirstLogin from './pages/learn/auth/FirstLogin';
import RestrictedAccess from './pages/learn/auth/RestrictedAccess';
import PaymentPage from './pages/learn/payment/PaymentPage';
import PaymentResult from './pages/learn/payment/PaymentResult';

// User-menu shared pages
import ProfilePage from './pages/learn/ProfilePage';
import ComingSoon from './pages/learn/ComingSoon';
import SessionRoom from './pages/learn/SessionRoom';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import CourseDetail from './pages/student/CourseDetail';
import StudentCalendar from './pages/student/StudentCalendar';
import StudentCertificates from './pages/student/StudentCertificates';
import StudentNotifications from './pages/student/StudentNotifications';

// Instructor Pages
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorCourses from './pages/instructor/InstructorCourses';
import InstructorAssignments from './pages/instructor/InstructorAssignments';
import InstructorQuizzes from './pages/instructor/InstructorQuizzes';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CoursesManager from './pages/admin/CoursesManager';
import UsersManager from './pages/admin/UsersManager';
import PaymentsManager from './pages/admin/PaymentsManager';
import PublicationsManager from './pages/admin/PublicationsManager';
import ProjectsManager from './pages/admin/ProjectsManager';
import QuotesManager from './pages/admin/QuotesManager';

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with Public Layout */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
          <Route path="/services/:serviceId" element={<PublicLayout><ServiceDetail /></PublicLayout>} />
          <Route path="/formations" element={<PublicLayout><Formations /></PublicLayout>} />
          <Route path="/quote" element={<PublicLayout><Quote /></PublicLayout>} />

          {/* Auth Route - No Layout */}
          <Route path="/learn/login" element={<Login />} />
          <Route path="/learn/first-login" element={<FirstLogin />} />

          {/* Menu utilisateur — pages transverses (tous rôles authentifiés) */}
          <Route path="/learn/profile" element={<ProtectedRoute><DashboardLayout><ProfilePage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/learn/notes" element={<ProtectedRoute><DashboardLayout><ComingSoon title="Notes" /></DashboardLayout></ProtectedRoute>} />
          <Route path="/learn/calendar" element={<ProtectedRoute><DashboardLayout><ComingSoon title="Calendrier" /></DashboardLayout></ProtectedRoute>} />
          <Route path="/learn/files" element={<ProtectedRoute><DashboardLayout><ComingSoon title="Fichiers personnels" /></DashboardLayout></ProtectedRoute>} />
          <Route path="/learn/reports" element={<ProtectedRoute><DashboardLayout><ComingSoon title="Rapports" /></DashboardLayout></ProtectedRoute>} />
          <Route path="/learn/preferences" element={<ProtectedRoute><DashboardLayout><ComingSoon title="Préférences" /></DashboardLayout></ProtectedRoute>} />
          <Route path="/learn/session/:id" element={<ProtectedRoute><SessionRoom /></ProtectedRoute>} />

          {/* Restricted Access */}
          <Route
            path="/learn/restricted"
            element={
              <ProtectedRoute>
                <PublicLayout>
                  <RestrictedAccess />
                </PublicLayout>
              </ProtectedRoute>
            }
          />

          {/* Payment Page */}
          <Route
            path="/payment/:courseId"
            element={
              <ProtectedRoute>
                <PublicLayout>
                  <PaymentPage />
                </PublicLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/payment/:courseId"
            element={
              <ProtectedRoute>
                <PublicLayout>
                  <PaymentPage />
                </PublicLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/payment/success" element={<ProtectedRoute><PaymentResult status="success" /></ProtectedRoute>} />
          <Route path="/payment/cancel" element={<ProtectedRoute><PaymentResult status="cancel" /></ProtectedRoute>} />

          {/* Student Routes with Dashboard Layout */}
          <Route
            path="/learn/student"
            element={
              <ProtectedRoute requiredRole="STUDENT" requireAccess>
                <DashboardLayout>
                  <StudentDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/student/courses"
            element={
              <ProtectedRoute requiredRole="STUDENT" requireAccess>
                <DashboardLayout>
                  <StudentDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/student/course/:courseId"
            element={
              <ProtectedRoute requiredRole="STUDENT" requireAccess>
                <DashboardLayout>
                  <CourseDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/student/calendar"
            element={
              <ProtectedRoute requiredRole="STUDENT" requireAccess>
                <DashboardLayout>
                  <StudentCalendar />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/student/certificates"
            element={
              <ProtectedRoute requiredRole="STUDENT" requireAccess>
                <DashboardLayout>
                  <StudentCertificates />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/student/notifications"
            element={
              <ProtectedRoute requiredRole="STUDENT" requireAccess>
                <DashboardLayout>
                  <StudentNotifications />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Instructor Routes with Dashboard Layout */}
          <Route
            path="/learn/instructor"
            element={
              <ProtectedRoute requiredRole="INSTRUCTOR">
                <DashboardLayout>
                  <InstructorDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/instructor/courses"
            element={
              <ProtectedRoute requiredRole="INSTRUCTOR">
                <DashboardLayout>
                  <InstructorCourses />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/instructor/assignments"
            element={
              <ProtectedRoute requiredRole="INSTRUCTOR">
                <DashboardLayout>
                  <InstructorAssignments />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/instructor/quizzes"
            element={
              <ProtectedRoute requiredRole="INSTRUCTOR">
                <DashboardLayout>
                  <InstructorQuizzes />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/instructor/messages"
            element={
              <ProtectedRoute requiredRole="INSTRUCTOR">
                <DashboardLayout>
                  <InstructorDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/instructor/sessions"
            element={
              <ProtectedRoute requiredRole="INSTRUCTOR">
                <DashboardLayout>
                  <InstructorDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/instructor/stats"
            element={
              <ProtectedRoute requiredRole="INSTRUCTOR">
                <DashboardLayout>
                  <InstructorDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes with Dashboard Layout */}
          <Route
            path="/learn/admin"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/admin/publications"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <DashboardLayout>
                  <PublicationsManager />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/admin/projects"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <DashboardLayout>
                  <ProjectsManager />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/admin/services"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/admin/users"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <DashboardLayout>
                  <UsersManager />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/admin/courses"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <DashboardLayout>
                  <CoursesManager />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/admin/payments"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <DashboardLayout>
                  <PaymentsManager />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/admin/quotes"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <DashboardLayout>
                  <QuotesManager />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/admin/analytics"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 - Redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
