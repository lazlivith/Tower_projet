import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import StudentLayout from '../student/StudentLayout';
import AdminLayout from '../admin/AdminLayout';
import InstructorLayout from '../instructor/InstructorLayout';

/** Rend le contenu dans la coquille correspondant au rôle de l'utilisateur connecté. */
export default function RoleShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role === 'MANAGER') return <AdminLayout>{children}</AdminLayout>;
  if (user?.role === 'INSTRUCTOR') return <InstructorLayout>{children}</InstructorLayout>;
  return <StudentLayout>{children}</StudentLayout>;
}
