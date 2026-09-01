import { Link, useLocation, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Menu, X, ArrowUpRight, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { services } from '../../data/mockData';
import type { VitrineTheme } from '../../hooks/useVitrineTheme';

const NAV = [
  { to: '/', label: 'Accueil' },
  { to: '/services', label: 'Services', sub: services.map((s) => ({ to: `/services/${s.id}`, label: s.title })) },
  { to: '/about', label: 'À propos' },
  { to: '/formations', label: 'Formations' },
  { to: '/blog', label: 'Blog' },
];

interface HeaderProps {
  theme?: VitrineTheme;
  onToggleTheme?: () => void;
}

export default function Header({ theme = 'dark', onToggleTheme }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [mobileServices, setMobileServices] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Efface l'en-tête à l'approche du pied de page
  useEffect(() => {
    const sentinel = document.getElementById('footer-sentinel');
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([e]) => setAtFooter(e.isIntersecting),
      { rootMargin: '0px 0px -40px 0px', threshold: 0 }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => { setOpen(false); setMobileServices(false); }, [pathname]);

  const dashboardLink = () => {
    if (!user) return '/learn/login';
    if (user.role === 'MANAGER') return '/learn/admin';
    if (user.role === 'INSTRUCTOR') return '/learn/instructor';
    return user.isActive && user.hasActiveAccess ? '/learn/student' : '/learn/restricted';
  };

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 border-b backdrop-blur-xl transition-all duration-500 will-change-transform ${
          atFooter ? 'header-hidden' : ''
        } ${
          scrolled
            ? 'bg-[color:var(--color-paper)]/85 border-[color:var(--color-line)] shadow-[0_1px_24px_-10px_rgba(0,0,0,0.4)]'
            : 'bg-[color:var(--color-paper)]/55 border-transparent'
        }`}
      >
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="flex h-[66px] items-center justify-between">
            <Link
              to="/"
              className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-[0.14em] uppercase text-[color:var(--color-ink)]"
            >
              Tower&nbsp;Structure
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((n) => (
                <div key={n.to} className="group relative">
                  <Link
                    to={n.to}
                    className={`flex items-center gap-1 px-3.5 py-2 text-[13.5px] text-[color:var(--color-ink)] transition-opacity ${
                      isActive(n.to) ? '' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span className="relative">
                      {n.label}
                      <span
                        className={`absolute -bottom-1 left-0 h-px bg-[color:var(--color-accent)] transition-all duration-300 ${
                          isActive(n.to) ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}
                      />
                    </span>
                    {n.sub && <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180" />}
                  </Link>

                  {n.sub && (
                    <div className="invisible absolute left-0 top-full pt-3 opacity-0 translate-y-1 transition-all duration-300 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0">
                      <div className="w-[320px] rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-paper)] p-2 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.3)]">
                        {n.sub.map((s) => (
                          <Link
                            key={s.to}
                            to={s.to}
                            className="group/item flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-[13px] leading-snug text-[color:var(--color-ink-soft)] transition-colors hover:bg-[color:var(--color-paper-2)] hover:text-[color:var(--color-ink)]"
                          >
                            {s.label}
                            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-0 -translate-x-1 transition-all group-hover/item:opacity-100 group-hover/item:translate-x-0" />
                          </Link>
                        ))}
                        <Link
                          to="/services"
                          className="mt-1 flex items-center gap-2 rounded-xl px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)]"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tous les services
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-2 pl-2 sm:gap-3 sm:pl-3">
              {/* Bascule thème clair / sombre */}
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--color-line)] text-[15px] text-[color:var(--color-ink)] transition-colors hover:border-[color:var(--color-accent)]"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              <div className="hidden md:flex items-center gap-3">
                {user ? (
                  <>
                    <Link to={dashboardLink()} className="text-[13px] text-[color:var(--color-ink)] hover:text-[color:var(--color-accent)]">
                      {user.nom?.split(' ')[0]}
                    </Link>
                    <button onClick={() => { logout(); navigate('/'); }} className="text-[13px] text-[color:var(--color-ink)] opacity-50 hover:opacity-100">
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <Link to="/learn/login" className="btn btn-solid !py-2 !px-5 !text-[12.5px]">
                    Espace apprenant
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              <button className="md:hidden text-[color:var(--color-ink)]" onClick={() => setOpen((o) => !o)} aria-label="Menu">
                {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-[color:var(--color-paper)] pt-[66px] md:hidden overflow-y-auto">
          <nav className="flex flex-col px-6 py-6">
            {NAV.map((n) =>
              n.sub ? (
                <div key={n.to} className="border-b border-[color:var(--color-line)]">
                  <button
                    onClick={() => setMobileServices((v) => !v)}
                    className="flex w-full items-center justify-between py-4 font-[family-name:var(--font-display)] text-2xl"
                  >
                    {n.label}
                    <ChevronDown className={`w-5 h-5 transition-transform ${mobileServices ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileServices && (
                    <div className="pb-4 pl-1">
                      {n.sub.map((s) => (
                        <Link key={s.to} to={s.to} className="block py-2 text-[15px] text-[color:var(--color-ink-soft)]">{s.label}</Link>
                      ))}
                      <Link to="/services" className="block py-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-accent)]">
                        Tous les services
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <Link key={n.to} to={n.to} className="border-b border-[color:var(--color-line)] py-4 font-[family-name:var(--font-display)] text-2xl">
                  {n.label}
                </Link>
              )
            )}
            <Link to="/quote" className="border-b border-[color:var(--color-line)] py-4 font-[family-name:var(--font-display)] text-2xl">
              Devis
            </Link>
            <Link to={user ? dashboardLink() : '/learn/login'} className="btn btn-solid mt-7 justify-center">
              {user ? 'Mon espace' : 'Espace apprenant'} <ArrowUpRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
