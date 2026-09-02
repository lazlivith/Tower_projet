import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  GraduationCap,
  Users2,
  FolderKanban,
  Newspaper,
  Image as ImageIcon,
  FileSignature,
  FileText,
  CreditCard,
  UserCog,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  Wrench,
} from 'lucide-react';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

const GROUPS: { title: string; items: { label: string; to: string; icon: any; end?: boolean }[] }[] = [
  {
    title: 'Pilotage',
    items: [
      { label: "Vue d'ensemble", to: '/learn/admin', icon: LayoutDashboard, end: true },
      { label: 'Analytics', to: '/learn/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Académie',
    items: [
      { label: 'Formations', to: '/learn/admin/courses', icon: GraduationCap },
      { label: 'Instructeurs', to: '/learn/admin/instructors', icon: UserCog },
      { label: 'Classes & contenus', to: '/learn/admin/academy', icon: FolderKanban },
    ],
  },
  {
    title: 'Communauté',
    items: [
      { label: 'Utilisateurs', to: '/learn/admin/users', icon: Users2 },
      { label: 'Paiements', to: '/learn/admin/payments', icon: CreditCard },
      { label: 'Documents', to: '/learn/admin/documents', icon: FileText },
    ],
  },
  {
    title: 'Site vitrine',
    items: [
      { label: 'Publications', to: '/learn/admin/publications', icon: Newspaper },
      { label: 'Projets', to: '/learn/admin/projects', icon: ImageIcon },
      { label: 'Services', to: '/learn/admin/services', icon: Wrench },
      { label: 'Devis', to: '/learn/admin/quotes', icon: FileSignature },
    ],
  },
];

export default function AdminSidebar({ collapsed, onToggle }: Props) {
  const { pathname } = useLocation();

  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(to + '/');

  return (
    <aside
      className="flex h-screen flex-shrink-0 flex-col border-r border-[color:var(--a-line)] bg-[color:var(--a-bg-2)] transition-[width] duration-300"
      style={{ width: collapsed ? 76 : 258 }}
    >
      {/* Marque */}
      <div className="flex h-16 items-center gap-3 border-b border-[color:var(--a-line)] px-4">
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-[color:var(--a-accent-2)] font-[family-name:var(--font-display,inherit)] text-sm font-bold text-black">
          TS
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate font-[family-name:var(--font-display,inherit)] text-[13px] font-semibold tracking-wide text-[color:var(--a-ink)]">
              Tower Structure
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--a-accent)]">
              Back-office
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="a-scroll flex-1 overflow-y-auto py-4">
        {GROUPS.map((g) => (
          <div key={g.title} className="mb-4">
            {!collapsed && (
              <div className="px-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--a-ink-dim)]">
                {g.title}
              </div>
            )}
            <div className="flex flex-col gap-0.5 px-2.5">
              {g.items.map((it) => {
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
          </div>
        ))}
      </nav>

      {/* Pied */}
      <div className="border-t border-[color:var(--a-line)] p-2.5">
        <Link
          to="/"
          title={collapsed ? 'Site vitrine' : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-[color:var(--a-ink-soft)] transition-colors hover:bg-white/5 hover:text-[color:var(--a-ink)] ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Globe className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={2} />
          {!collapsed && <span>Site vitrine</span>}
        </Link>
        <button
          onClick={onToggle}
          className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[12px] text-[color:var(--a-ink-dim)] transition-colors hover:bg-white/5 hover:text-[color:var(--a-ink)] ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          {!collapsed && <span>Réduire</span>}
        </button>
      </div>
    </aside>
  );
}
