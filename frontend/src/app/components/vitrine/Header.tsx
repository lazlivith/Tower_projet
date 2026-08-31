import { Link, useNavigate } from 'react-router';
import { Menu, X, User, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/learn/login';
    switch (user.role) {
      case 'MANAGER':
        return '/learn/admin';
      case 'INSTRUCTOR':
        return '/learn/instructor';
      case 'STUDENT':
        return user.isActive ? '/learn/student' : '/learn/restricted';
      default:
        return '/';
    }
  };

  return (
    <header className="bg-[#0A0A0A]/95 backdrop-blur-md text-white sticky top-0 z-50 border-b border-white/5">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6B00] rounded-sm flex items-center justify-center font-bold text-white tracking-tighter shadow-lg shadow-orange-500/20">
              TS
            </div>
            <span className="font-bold text-xl tracking-tight">TOWER STRUCTURE</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center gap-8 mr-12">
              <Link to="/" className="hover:text-[#FF6B00] transition-colors text-xs uppercase font-bold tracking-widest text-gray-300">
                Accueil
              </Link>
              <Link to="/about" className="hover:text-[#FF6B00] transition-colors text-xs uppercase font-bold tracking-widest text-gray-300">
                À Propos
              </Link>
              
              {/* Dropdown Menu */}
              <div className="relative group py-8">
                <Link to="/services" className="flex items-center gap-1 hover:text-[#FF6B00] transition-colors text-xs uppercase font-bold tracking-widest text-white">
                  Services <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[#FF6B00]" />
                </Link>
                <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-64 bg-[#111111] border border-gray-800/50 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 p-3 z-50">
                  <div className="flex flex-col">
                    <Link to="/services/bim" className="px-5 py-4 text-[11px] uppercase tracking-[0.2em] font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left flex items-center justify-between group/link">
                      BIM & Modélisation 3D
                      <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-[#FF6B00]" />
                    </Link>
                    <Link to="/services/diagnostic" className="px-5 py-4 text-[11px] uppercase tracking-[0.2em] font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left flex items-center justify-between group/link">
                      Diagnostic Structurel
                      <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-[#FF6B00]" />
                    </Link>
                    <Link to="/services/eurocodes" className="px-5 py-4 text-[11px] uppercase tracking-[0.2em] font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left flex items-center justify-between group/link">
                      Calculs Eurocodes
                      <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-[#FF6B00]" />
                    </Link>
                  </div>
                </div>
              </div>

              <Link to="/formations" className="hover:text-[#FF6B00] transition-colors text-xs uppercase font-bold tracking-widest text-gray-300">
                Formations
              </Link>
              <Link to="/quote" className="hover:text-[#FF6B00] transition-colors text-xs uppercase font-bold tracking-widest text-gray-300">
                Devis
              </Link>
            </div>

            {user ? (
              <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-2 hover:text-[#FF6B00] transition-colors text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                  {user.nom}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 hover:text-[#FF6B00] transition-colors text-sm font-medium text-gray-400"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/learn/login"
                className="px-6 py-2.5 bg-[#FF6B00] text-white text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#e66000] hover:shadow-lg hover:shadow-orange-500/20 transition-all"
              >
                Accès Tower-Learn
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <div className="flex flex-col gap-4">
              <Link to="/" className="hover:text-[#FFC107] transition-colors">
                Accueil
              </Link>
              <Link to="/about" className="hover:text-[#FFC107] transition-colors">
                À Propos
              </Link>
              <Link to="/services" className="hover:text-[#FFC107] transition-colors">
                Services
              </Link>
              <Link to="/formations" className="hover:text-[#FFC107] transition-colors">
                Formations
              </Link>
              <Link to="/quote" className="hover:text-[#FFC107] transition-colors">
                Devis
              </Link>

              {user ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    className="flex items-center gap-2 hover:text-[#FFC107] transition-colors pt-4 border-t border-gray-700"
                  >
                    <User className="w-4 h-4" />
                    {user.nom}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 hover:text-[#FFC107] transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  to="/learn/login"
                  className="px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors text-center"
                >
                  Accès Tower-Learn
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
