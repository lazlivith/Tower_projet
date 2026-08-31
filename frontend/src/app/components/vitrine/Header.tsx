import { Link, useLocation, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { to: '/projets', label: 'Projets' },
  { to: '/services', label: 'Services' },
  { to: '/formations', label: 'Formations' },
  { to: '/blog', label: 'Journal' },
  { to: '/about', label: 'Studio' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const overlayHome = pathname === '/'; // header transparent au-dessus du hero

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const dashboardLink = () => {
    if (!user) return '/learn/login';
    if (user.role === 'MANAGER') return '/learn/admin';
    if (user.role === 'INSTRUCTOR') return '/learn/instructor';
    return user.isActive && user.hasActiveAccess ? '/learn/student' : '/learn/restricted';
  };

  const solid = scrolled || !overlayHome || open;
  const textDark = solid;

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
          solid ? 'bg-[color:var(--color-paper)]/90 backdrop-blur border-b border-[color:var(--color-line)]' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="flex h-[72px] items-center justify-between">
            <Link
              to="/"
              className={`font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-[0.14em] uppercase ${
                textDark ? 'text-[color:var(--color-ink)]' : 'text-white'
              }`}
            >
              Tower&nbsp;Structure
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-9">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`text-[13.5px] transition-opacity hover:opacity-60 ${
                    textDark ? 'text-[color:var(--color-ink)]' : 'text-white'
                  } ${pathname === n.to ? 'opacity-60' : ''}`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    to={dashboardLink()}
                    className={`text-[13.5px] hover:opacity-60 ${textDark ? 'text-[color:var(--color-ink)]' : 'text-white'}`}
                  >
                    {user.nom?.split(' ')[0]}
                  </Link>
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    className={`text-[13.5px] opacity-50 hover:opacity-100 ${textDark ? 'text-[color:var(--color-ink)]' : 'text-white'}`}
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  to="/learn/login"
                  className={`group inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-medium transition-colors ${
                    textDark
                      ? 'bg-[color:var(--color-ink)] text-[color:var(--color-paper)] hover:bg-[color:var(--color-accent)]'
                      : 'bg-white text-[color:var(--color-ink)] hover:bg-white/90'
                  }`}
                >
                  Espace apprenant
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className={`md:hidden ${textDark ? 'text-[color:var(--color-ink)]' : 'text-white'}`}
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-[color:var(--color-paper)] pt-[72px] md:hidden">
          <nav className="flex flex-col px-6 py-8">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="font-[family-name:var(--font-display)] text-3xl py-3 border-b border-[color:var(--color-line)]"
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/quote"
              className="font-[family-name:var(--font-display)] text-3xl py-3 border-b border-[color:var(--color-line)]"
            >
              Devis
            </Link>
            <Link
              to={user ? dashboardLink() : '/learn/login'}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-ink)] px-6 py-3.5 text-sm font-medium text-[color:var(--color-paper)]"
            >
              {user ? 'Mon espace' : 'Espace apprenant'} <ArrowUpRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
