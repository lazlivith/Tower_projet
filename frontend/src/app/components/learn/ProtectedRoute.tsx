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

  if (requireAccess && !user.isActive) {
    return <Navigate to="/learn/restricted" />;
  }

  return <>{children}</>;
}
