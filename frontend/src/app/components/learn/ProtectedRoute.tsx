import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'MANAGER' | 'INSTRUCTOR' | 'STUDENT';
  requireAccess?: boolean;
}

export default function ProtectedRoute({ children, requiredRole, requireAccess }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFC107]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/learn/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  const onRestrictedPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/learn/restricted');

  // Compte suspendu par l'admin
  if (user.isActive === false && !onRestrictedPage) {
    return <Navigate to="/learn/restricted" />;
  }

  // Espace de cours : nécessite un accès actif (étudiant ayant payé / validé par l'admin)
  if (requireAccess && user.role === 'STUDENT' && !user.hasActiveAccess && !onRestrictedPage) {
    return <Navigate to="/learn/restricted" />;
  }

  return <>{children}</>;
}
