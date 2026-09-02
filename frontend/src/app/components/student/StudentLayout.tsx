import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';
import UserMenu from '../learn/layout/UserMenu';

const KEY = 'tower_student_sidebar_collapsed';

const TITLES: { match: (p: string) => boolean; label: string }[] = [
  { match: (p) => p === '/learn/student', label: 'Tableau de bord' },
  { match: (p) => p.startsWith('/learn/student/course'), label: 'Cours' },
  { match: (p) => p.startsWith('/learn/student/courses'), label: 'Mes cours' },
  { match: (p) => p.startsWith('/learn/student/board'), label: 'Espace de classe' },
  { match: (p) => p.startsWith('/learn/student/quizzes'), label: 'Mes quiz' },
  { match: (p) => p.startsWith('/learn/student/calendar'), label: 'Sessions' },
  { match: (p) => p.startsWith('/learn/student/certificates'), label: 'Certificats' },
  { match: (p) => p.startsWith('/learn/profile'), label: 'Profil' },
  { match: (p) => p.startsWith('/learn/notifications'), label: 'Notifications' },
  { match: (p) => p.startsWith('/learn/files'), label: 'Fichiers personnels' },
  { match: (p) => p.startsWith('/learn/reports'), label: 'Rapports' },
  { match: (p) => p.startsWith('/learn/faq'), label: 'FAQ' },
];

export default function StudentLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const crumb = TITLES.find((t) => t.match(pathname))?.label ?? 'Espace apprenant';

  return (
    <div className="tw-ui student-ui flex h-screen overflow-hidden">
      <StudentSidebar collapsed={collapsed} onToggle={toggle} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[color:var(--a-line)] bg-[color:var(--a-bg)]/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[color:var(--a-ink-dim)]">Apprenant</span>
            <span className="text-[color:var(--a-ink-dim)]">/</span>
            <span className="font-semibold text-[color:var(--a-ink)]">{crumb}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-[12px] text-[color:var(--a-ink-dim)] lg:block">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <UserMenu variant="dark" />
          </div>
        </header>

        <main key={pathname} className="a-scroll a-grid-bg a-page-in flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
