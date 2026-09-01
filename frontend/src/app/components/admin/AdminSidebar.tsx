import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  GraduationCap,
  Users2,
  FolderKanban,
  Newspaper,
  Image as ImageIcon,
  FileSignature,
  CreditCard,
  UserCog,
  Globe,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
    ],
  },
  {
    title: 'Site vitrine',
    items: [
      { label: 'Publications', to: '/learn/admin/publications', icon: Newspaper },
      { label: 'Projets', to: '/learn/admin/projects', icon: ImageIcon },
      { label: 'Devis', to: '/learn/admin/quotes', icon: FileSignature },
    ],
  },
];

export default function AdminSidebar({ collapsed, onToggle }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
          onClick={() => {
            logout();
            navigate('/learn/login');
          }}
          title={collapsed ? 'Déconnexion' : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-[color:var(--a-ink-soft)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--a-danger)_14%,transparent)] hover:text-[color:var(--a-danger)] ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={2} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
        <button
          onClick={onToggle}
          className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[12px] text-[color:var(--a-ink-dim)] transition-colors hover:bg-white/5 hover:text-[color:var(--a-ink)] ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          {!collapsed && <span>Réduire</span>}
        </button>
        {!collapsed && user && (
          <div className="mt-2 flex items-center gap-2.5 rounded-lg bg-white/[0.03] px-3 py-2">
            <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border border-[color:var(--a-line)] text-[13px] font-bold text-[color:var(--a-accent)]">
              {user.nom?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-semibold text-[color:var(--a-ink)]">{user.nom}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--a-ink-dim)]">{user.role}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
