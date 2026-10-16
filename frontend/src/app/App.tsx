import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/shared/ErrorBoundary';
import PageLoader from './components/shared/PageLoader';

const queryClient = new QueryClient();
import PublicLayout from './components/vitrine/PublicLayout';
import ProtectedRoute from './components/learn/ProtectedRoute';

// Pages chargées immédiatement : coquille de l'app + première page vue par
// tout visiteur anonyme (accueil, connexion). Tout le reste est différé
// (React.lazy) pour que le bundle initial n'embarque pas le code des 3
// espaces back-office — jamais visités par un simple visiteur de la vitrine.
import Home from './pages/vitrine/Home';
import Login from './pages/learn/auth/Login';
import FirstLogin from './pages/learn/auth/FirstLogin';

// Public Pages (vitrine secondaire)
const About = lazy(() => import('./pages/vitrine/About'));
const Services = lazy(() => import('./pages/vitrine/Services'));
const ServiceDetail = lazy(() => import('./pages/vitrine/ServiceDetail'));
const Formations = lazy(() => import('./pages/vitrine/Formations'));
const FormationDetail = lazy(() => import('./pages/vitrine/FormationDetail'));
const Quote = lazy(() => import('./pages/vitrine/Quote'));
const VerifyDocument = lazy(() => import('./pages/vitrine/VerifyDocument'));
const Blog = lazy(() => import('./pages/vitrine/Blog'));
const BlogPost = lazy(() => import('./pages/vitrine/BlogPost'));
const Projects = lazy(() => import('./pages/vitrine/Projects'));
const ProjectDetail = lazy(() => import('./pages/vitrine/ProjectDetail'));

// Auth & Payment
const RestrictedAccess = lazy(() => import('./pages/learn/auth/RestrictedAccess'));
const PaymentPage = lazy(() => import('./pages/learn/payment/PaymentPage'));
const PaymentResult = lazy(() => import('./pages/learn/payment/PaymentResult'));

// User-menu shared pages
const RoleShell = lazy(() => import('./components/shell/RoleShell'));
const ProfilePage = lazy(() => import('./pages/learn/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/learn/NotificationsPage'));
const PersonalFiles = lazy(() => import('./pages/learn/PersonalFiles'));
const ReportsPage = lazy(() => import('./pages/learn/ReportsPage'));
const FaqPage = lazy(() => import('./pages/learn/FaqPage'));
const SessionRoom = lazy(() => import('./pages/learn/SessionRoom'));

// Student Pages
const StudentLayout = lazy(() => import('./components/student/StudentLayout'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const CourseDetail = lazy(() => import('./pages/student/CourseDetail'));
const StudentCalendar = lazy(() => import('./pages/student/StudentCalendar'));
const StudentClassBoard = lazy(() => import('./pages/student/StudentClassBoard'));
const StudentQuizzes = lazy(() => import('./pages/student/StudentQuizzes'));
const StudentCertificates = lazy(() => import('./pages/student/StudentCertificates'));

// Instructor Pages
const InstructorLayout = lazy(() => import('./components/instructor/InstructorLayout'));
const InstructorOverview = lazy(() => import('./pages/instructor/InstructorOverview'));
const InstructorClasses = lazy(() => import('./pages/instructor/InstructorClasses'));
const InstructorCourseContent = lazy(() => import('./pages/instructor/InstructorCourseContent'));
const InstructorCalendar = lazy(() => import('./pages/instructor/InstructorCalendar'));
const InstructorClassBoard = lazy(() => import('./pages/instructor/InstructorClassBoard'));
const InstructorAssignments = lazy(() => import('./pages/instructor/InstructorAssignments'));
const InstructorQuizzes = lazy(() => import('./pages/instructor/InstructorQuizzes'));

// Admin Pages
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminDocuments = lazy(() => import('./pages/admin/AdminDocuments'));
const CoursesManager = lazy(() => import('./pages/admin/CoursesManager'));
const InstructorsManager = lazy(() => import('./pages/admin/InstructorsManager'));
const AcademyManager = lazy(() => import('./pages/admin/AcademyManager'));
const UsersManager = lazy(() => import('./pages/admin/UsersManager'));
const PaymentsManager = lazy(() => import('./pages/admin/PaymentsManager'));
const PublicationsManager = lazy(() => import('./pages/admin/PublicationsManager'));
const ProjectsManager = lazy(() => import('./pages/admin/ProjectsManager'));
const ServicesManager = lazy(() => import('./pages/admin/ServicesManager'));
const QuotesManager = lazy(() => import('./pages/admin/QuotesManager'));

export default function App() {
  return (
    <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
          <Route path="/verify" element={<PublicLayout><VerifyDocument /></PublicLayout>} />
          <Route path="/verify/:number" element={<PublicLayout><VerifyDocument /></PublicLayout>} />

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
            ['/learn/admin/services', <ServicesManager />],
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

          {/* 404 - Redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
    </ErrorBoundary>
  );
}
