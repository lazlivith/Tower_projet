import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, MessagesSquare, ClipboardList, CalendarDays, Award,
  Globe, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

const ITEMS: { label: string; to: string; icon: any; end?: boolean }[] = [
  { label: 'Tableau de bord', to: '/learn/student', icon: LayoutDashboard, end: true },
  { label: 'Mes cours', to: '/learn/student/courses', icon: BookOpen },
  { label: 'Espace de classe', to: '/learn/student/board', icon: MessagesSquare },
  { label: 'Mes quiz', to: '/learn/student/quizzes', icon: ClipboardList },
  { label: 'Sessions', to: '/learn/student/calendar', icon: CalendarDays },
  { label: 'Certificats', to: '/learn/student/certificates', icon: Award },
];

export default function StudentSidebar({ collapsed, onToggle }: Props) {
  const { pathname } = useLocation();
  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(to + '/');

  return (
    <aside
      className="flex h-screen flex-shrink-0 flex-col border-r border-[color:var(--a-line)] bg-[color:var(--a-bg-2)] transition-[width] duration-300"
      style={{ width: collapsed ? 76 : 258 }}
    >
      <div className="flex h-16 items-center gap-3 border-b border-[color:var(--a-line)] px-4">
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-[color:var(--a-accent)] text-sm font-bold text-black">
          TS
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold tracking-wide text-[color:var(--a-ink)]">Tower Structure</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--a-accent)]">Espace apprenant</div>
          </div>
        )}
      </div>

      <nav className="a-scroll flex-1 overflow-y-auto py-4">
        <div className="flex flex-col gap-0.5 px-2.5">
          {ITEMS.map((it) => {
            const active = isActive(it.to, it.end);
            return (
              <Link
                key={it.to}
                to={it.to}
                title={collapsed ? it.label : undefined}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-[color:color-mix(in_srgb,var(--a-accent)_16%,transparent)] text-[color:var(--a-accent)]'
                    : 'text-[color:var(--a-ink-soft)] hover:bg-white/5 hover:text-[color:var(--a-ink)]'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <it.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={2} />
                {!collapsed && <span className="truncate">{it.label}</span>}
                {active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[color:var(--a-accent)]" />}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-[color:var(--a-line)] p-2.5">
        <Link
          to="/"
          title={collapsed ? 'Site vitrine' : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-[color:var(--a-ink-soft)] transition-colors hover:bg-white/5 hover:text-[color:var(--a-ink)] ${collapsed ? 'justify-center' : ''}`}
        >
          <Globe className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={2} />
          {!collapsed && <span>Site vitrine</span>}
        </Link>
        <button
          onClick={onToggle}
          className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[12px] text-[color:var(--a-ink-dim)] transition-colors hover:bg-white/5 hover:text-[color:var(--a-ink)] ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          {!collapsed && <span>Réduire</span>}
        </button>
      </div>
    </aside>
  );
}
