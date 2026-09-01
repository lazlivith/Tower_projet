import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import InstructorSidebar from './InstructorSidebar';
import UserMenu from '../learn/layout/UserMenu';

const KEY = 'tower_instructor_sidebar_collapsed';

const TITLES: { match: (p: string) => boolean; label: string }[] = [
  { match: (p) => p === '/learn/instructor', label: 'Tableau de bord' },
  { match: (p) => p.startsWith('/learn/instructor/classes'), label: 'Mes classes' },
  { match: (p) => p.startsWith('/learn/instructor/content'), label: 'Contenu des cours' },
  { match: (p) => p.startsWith('/learn/instructor/calendar'), label: 'Calendrier' },
  { match: (p) => p.startsWith('/learn/instructor/board'), label: 'Espace de classe' },
  { match: (p) => p.startsWith('/learn/instructor/assignments'), label: 'Devoirs' },
  { match: (p) => p.startsWith('/learn/instructor/quizzes'), label: 'Quiz' },
];

export default function InstructorLayout({ children }: { children: ReactNode }) {
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

  const crumb = TITLES.find((t) => t.match(pathname))?.label ?? 'Espace formateur';

  return (
    <div className="admin-ui instructor-ui flex h-screen overflow-hidden">
      <InstructorSidebar collapsed={collapsed} onToggle={toggle} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[color:var(--a-line)] bg-[color:var(--a-bg)]/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[color:var(--a-ink-dim)]">Formateur</span>
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
