import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface Lesson {
  id: string;
  title: string;
  videoUrl?: string;
  documentUrl?: string;
  sequenceOrder: number;
  isCompleted: boolean;
}

interface LiveSession {
  id: string;
  title: string;
  jitsiUrl: string;
  scheduledAt: string;
  duration: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  lessons: Lesson[];
  upcomingLiveSessions: LiveSession[];
}

interface Classroom {
  id: string;
  name: string;
  instructor?: {
    id: string;
    nom: string;
    email: string;
  };
}

export interface DashboardData {
  enrollmentId: string;
  paymentPlan: string;
  nextPaymentDue?: string;
  progressRate: number;
  course: Course;
  classroom?: Classroom;
}

const fetchDashboard = async (): Promise<DashboardData[]> => {
  const { data } = await api.get('/student/dashboard');
  return data;
};

export const useDashboard = () => {
  return useQuery({
    queryKey: ['studentDashboard'],
    queryFn: fetchDashboard,
    staleTime: 5 * 60 * 1000, // Les données sont considérées "fraîches" pendant 5 minutes
    retry: 2,
  });
};
