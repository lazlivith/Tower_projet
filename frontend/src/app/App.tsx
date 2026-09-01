import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/shared/ErrorBoundary';

const queryClient = new QueryClient();
import PublicLayout from './components/vitrine/PublicLayout';
import StudentLayout from './components/student/StudentLayout';
import ProtectedRoute from './components/learn/ProtectedRoute';

// Public Pages
import Home from './pages/vitrine/Home';
import About from './pages/vitrine/About';
import Services from './pages/vitrine/Services';
import ServiceDetail from './pages/vitrine/ServiceDetail';
import Formations from './pages/vitrine/Formations';
import Quote from './pages/vitrine/Quote';
import Blog from './pages/vitrine/Blog';
import BlogPost from './pages/vitrine/BlogPost';
import Projects from './pages/vitrine/Projects';
import ProjectDetail from './pages/vitrine/ProjectDetail';
import FormationDetail from './pages/vitrine/FormationDetail';

// Auth & Payment
import Login from './pages/learn/auth/Login';
import FirstLogin from './pages/learn/auth/FirstLogin';
import RestrictedAccess from './pages/learn/auth/RestrictedAccess';
import PaymentPage from './pages/learn/payment/PaymentPage';
import PaymentResult from './pages/learn/payment/PaymentResult';

// User-menu shared pages
import RoleShell from './components/shell/RoleShell';
import ProfilePage from './pages/learn/ProfilePage';
import NotificationsPage from './pages/learn/NotificationsPage';
import PersonalFiles from './pages/learn/PersonalFiles';
import ReportsPage from './pages/learn/ReportsPage';
import FaqPage from './pages/learn/FaqPage';
import SessionRoom from './pages/learn/SessionRoom';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import CourseDetail from './pages/student/CourseDetail';
import StudentCalendar from './pages/student/StudentCalendar';
import StudentClassBoard from './pages/student/StudentClassBoard';
import StudentQuizzes from './pages/student/StudentQuizzes';
import StudentCertificates from './pages/student/StudentCertificates';

// Instructor Pages
import InstructorLayout from './components/instructor/InstructorLayout';
import InstructorOverview from './pages/instructor/InstructorOverview';
import InstructorClasses from './pages/instructor/InstructorClasses';
import InstructorCourseContent from './pages/instructor/InstructorCourseContent';
import InstructorCalendar from './pages/instructor/InstructorCalendar';
import InstructorClassBoard from './pages/instructor/InstructorClassBoard';
import InstructorAssignments from './pages/instructor/InstructorAssignments';
import InstructorQuizzes from './pages/instructor/InstructorQuizzes';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminDocuments from './pages/admin/AdminDocuments';
import CoursesManager from './pages/admin/CoursesManager';
import InstructorsManager from './pages/admin/InstructorsManager';
import AcademyManager from './pages/admin/AcademyManager';
import UsersManager from './pages/admin/UsersManager';
import PaymentsManager from './pages/admin/PaymentsManager';
import PublicationsManager from './pages/admin/PublicationsManager';
import ProjectsManager from './pages/admin/ProjectsManager';
import QuotesManager from './pages/admin/QuotesManager';

export default function App() {
  return (
    <ErrorBoundary>
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
          <Route path="/formations/:id" element={<PublicLayout><FormationDetail /></PublicLayout>} />
          <Route path="/blog" element={<PublicLayout><Blog /></PublicLayout>} />
          <Route path="/blog/:id" element={<PublicLayout><BlogPost /></PublicLayout>} />
          <Route path="/projets" element={<PublicLayout><Projects /></PublicLayout>} />
          <Route path="/projets/:id" element={<PublicLayout><ProjectDetail /></PublicLayout>} />
          <Route path="/quote" element={<PublicLayout><Quote /></PublicLayout>} />

          {/* Auth Route - No Layout */}
          <Route path="/learn/login" element={<Login />} />
          <Route path="/learn/first-login" element={<FirstLogin />} />

          {/* Menu utilisateur — pages transverses (tous rôles authentifiés), rendues dans la coquille du rôle */}
          {([
            ['/learn/profile', <ProfilePage />],
            ['/learn/notifications', <NotificationsPage />],
            ['/learn/files', <PersonalFiles />],
            ['/learn/reports', <ReportsPage />],
            ['/learn/faq', <FaqPage />],
          ] as [string, JSX.Element][]).map(([path, el]) => (
            <Route key={path} path={path} element={<ProtectedRoute><RoleShell>{el}</RoleShell></ProtectedRoute>} />
          ))}
          <Route path="/learn/preferences" element={<Navigate to="/learn/profile" replace />} />
          <Route path="/learn/notes" element={<Navigate to="/learn/reports" replace />} />
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

          {/* Student Routes — espace apprenant « ingénierie sombre » */}
          {([
            ['/learn/student', <StudentDashboard />],
            ['/learn/student/courses', <StudentDashboard />],
            ['/learn/student/course/:courseId', <CourseDetail />],
            ['/learn/student/calendar', <StudentCalendar />],
            ['/learn/student/certificates', <StudentCertificates />],
            ['/learn/student/board', <StudentClassBoard />],
            ['/learn/student/quizzes', <StudentQuizzes />],
          ] as [string, JSX.Element][]).map(([path, el]) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute requiredRole="STUDENT" requireAccess>
                  <StudentLayout>{el}</StudentLayout>
                </ProtectedRoute>
              }
            />
          ))}
          <Route path="/learn/student/notifications" element={<Navigate to="/learn/notifications" replace />} />

          {/* Instructor Routes — espace formateur « ingénierie sombre » */}
          {([
            ['/learn/instructor', <InstructorOverview />],
            ['/learn/instructor/classes', <InstructorClasses />],
            ['/learn/instructor/content', <InstructorCourseContent />],
            ['/learn/instructor/calendar', <InstructorCalendar />],
            ['/learn/instructor/board', <InstructorClassBoard />],
            ['/learn/instructor/assignments', <InstructorAssignments />],
            ['/learn/instructor/quizzes', <InstructorQuizzes />],
          ] as [string, JSX.Element][]).map(([path, el]) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute requiredRole="INSTRUCTOR">
                  <InstructorLayout>{el}</InstructorLayout>
                </ProtectedRoute>
              }
            />
          ))}
          <Route path="/learn/instructor/courses" element={<Navigate to="/learn/instructor/content" replace />} />
          <Route path="/learn/instructor/messages" element={<Navigate to="/learn/instructor/board" replace />} />
          <Route path="/learn/instructor/sessions" element={<Navigate to="/learn/instructor/calendar" replace />} />
          <Route path="/learn/instructor/stats" element={<Navigate to="/learn/instructor" replace />} />

          {/* Admin Routes — back-office « ingénierie sombre » */}
          {([
            ['/learn/admin', <AdminOverview />],
            ['/learn/admin/analytics', <AdminOverview />],
            ['/learn/admin/courses', <CoursesManager />],
            ['/learn/admin/instructors', <InstructorsManager />],
            ['/learn/admin/academy', <AcademyManager />],
            ['/learn/admin/users', <UsersManager />],
            ['/learn/admin/payments', <PaymentsManager />],
            ['/learn/admin/documents', <AdminDocuments />],
            ['/learn/admin/publications', <PublicationsManager />],
            ['/learn/admin/projects', <ProjectsManager />],
            ['/learn/admin/quotes', <QuotesManager />],
          ] as [string, JSX.Element][]).map(([path, el]) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <AdminLayout>{el}</AdminLayout>
                </ProtectedRoute>
              }
            />
          ))}
          <Route path="/learn/admin/services" element={<Navigate to="/learn/admin/courses" replace />} />

          {/* 404 - Redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
    </ErrorBoundary>
  );
}
