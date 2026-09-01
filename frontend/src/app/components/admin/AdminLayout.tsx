import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const KEY = 'tower_admin_sidebar_collapsed';

const TITLES: { match: (p: string) => boolean; label: string }[] = [
  { match: (p) => p === '/learn/admin', label: "Vue d'ensemble" },
  { match: (p) => p.startsWith('/learn/admin/analytics'), label: 'Analytics' },
  { match: (p) => p.startsWith('/learn/admin/courses'), label: 'Formations' },
  { match: (p) => p.startsWith('/learn/admin/instructors'), label: 'Instructeurs' },
  { match: (p) => p.startsWith('/learn/admin/academy'), label: 'Classes & contenus' },
  { match: (p) => p.startsWith('/learn/admin/users'), label: 'Utilisateurs' },
  { match: (p) => p.startsWith('/learn/admin/payments'), label: 'Paiements' },
  { match: (p) => p.startsWith('/learn/admin/documents'), label: 'Documents' },
  { match: (p) => p.startsWith('/learn/admin/publications'), label: 'Publications' },
  { match: (p) => p.startsWith('/learn/admin/projects'), label: 'Projets' },
  { match: (p) => p.startsWith('/learn/admin/quotes'), label: 'Devis' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
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

  const crumb = TITLES.find((t) => t.match(pathname))?.label ?? 'Administration';

  return (
    <div className="admin-ui flex h-screen overflow-hidden">
      <AdminSidebar collapsed={collapsed} onToggle={toggle} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[color:var(--a-line)] bg-[color:var(--a-bg)]/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[color:var(--a-ink-dim)]">Administration</span>
            <span className="text-[color:var(--a-ink-dim)]">/</span>
            <span className="font-semibold text-[color:var(--a-ink)]">{crumb}</span>
          </div>
          <div className="text-[12px] text-[color:var(--a-ink-dim)]">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </header>

        <main key={pathname} className="a-scroll a-grid-bg a-page-in flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
