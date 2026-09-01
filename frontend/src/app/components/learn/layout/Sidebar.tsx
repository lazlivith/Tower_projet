import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react'; // ou framer-motion selon la version
import {
  Home,
  BookOpen,
  Users,
  LogOut,
  Menu,
  X,
  FileText,
  BarChart3,
  MessageCircle,
  Calendar,
  Award,
  Image,
  Globe,
  Bell,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/learn/login');
  };

  const getNavigationGroups = () => {
    let mainNav: any[] = [];
    if (user?.role === 'MANAGER') {
      mainNav = [
        { icon: Home, label: 'Vue d\'ensemble', path: '/learn/admin' },
        { icon: BookOpen, label: 'Formations', path: '/learn/admin/courses' },
        { icon: Users, label: 'Utilisateurs', path: '/learn/admin/users' },
        { icon: FileText, label: 'Paiements', path: '/learn/admin/payments' },
        { icon: FileText, label: 'Publications', path: '/learn/admin/publications' },
        { icon: Image, label: 'Projets', path: '/learn/admin/projects' },
        { icon: FileText, label: 'Devis', path: '/learn/admin/quotes' },
        { icon: BarChart3, label: 'Analytics', path: '/learn/admin/analytics' },
      ];
    } else if (user?.role === 'INSTRUCTOR') {
      mainNav = [
        { icon: Home, label: 'Tableau de bord', path: '/learn/instructor' },
        { icon: BookOpen, label: 'Mes Cours', path: '/learn/instructor/courses' },
        { icon: FileText, label: 'Devoirs', path: '/learn/instructor/assignments' },
        { icon: HelpCircle, label: 'Quiz (Excel)', path: '/learn/instructor/quizzes' },
        { icon: MessageCircle, label: 'Messages', path: '/learn/instructor/messages' },
        { icon: Calendar, label: 'Sessions', path: '/learn/instructor/sessions' },
        { icon: BarChart3, label: 'Statistiques', path: '/learn/instructor/stats' },
      ];
    } else if (user?.role === 'STUDENT') {
      mainNav = [
        { icon: Home, label: 'Tableau de bord', path: '/learn/student' },
        { icon: BookOpen, label: 'Mes Cours', path: '/learn/student/courses' },
        { icon: MessageCircle, label: 'Espace de classe', path: '/learn/student/board' },
        { icon: Calendar, label: 'Sessions', path: '/learn/student/calendar' },
        { icon: Award, label: 'Certificats', path: '/learn/student/certificates' },
        { icon: Bell, label: 'Notifications', path: '/learn/student/notifications' },
      ];
    }

    const publicNav = [
      { icon: Globe, label: 'Retourner au site vitrine', path: '/' }
    ];

    return { mainNav, publicNav };
  };

  const { mainNav, publicNav } = getNavigationGroups();

  return (
    <motion.aside
      initial={{ width: 256 }}
      animate={{ width: sidebarOpen ? 256 : 80 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-[#1A1A2E] text-white flex flex-col h-screen flex-shrink-0 relative z-20 overflow-hidden"
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-700 h-20 flex items-center flex-shrink-0">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 bg-[#FFC107] rounded flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-[#1A1A2E] text-lg">TS</span>
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <div className="font-bold text-[15px] truncate tracking-wide text-gray-100">Tower Structure</div>
                <div className="text-xs text-[#FFC107] font-medium truncate uppercase tracking-widest mt-0.5">E-Learning</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-700/50 rounded-full border border-gray-600 flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-[#FFC107] text-lg">
              {user?.nom?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0 whitespace-nowrap"
              >
                <div className="font-medium text-sm truncate text-gray-100">{user?.nom || 'Utilisateur'}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5 truncate">{user?.role}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-6 custom-scrollbar overflow-x-hidden">
        
        {/* Navigation Principale */}
        <div className="flex flex-col gap-1.5">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-6 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                Navigation Principale
              </motion.div>
            )}
          </AnimatePresence>
          {mainNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg hover:bg-[#FFC107] hover:text-[#1A1A2E] transition-colors duration-200 group relative"
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0 opacity-75 group-hover:opacity-100" strokeWidth={2.2} />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium text-[13px] whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          ))}
        </div>

        {/* Espace Public (Bridge) */}
        <div className="flex flex-col gap-1.5">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-6 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                Espace Public
              </motion.div>
            )}
          </AnimatePresence>
          {publicNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 group relative text-gray-300 hover:text-white"
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0 opacity-75 group-hover:opacity-100 group-hover:text-blue-400" strokeWidth={2.2} />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium text-[13px] whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          ))}
        </div>

      </nav>

      {/* Footer Actions */}
      <div className="border-t border-gray-700 p-4 space-y-3 flex-shrink-0 bg-gray-900/20 overflow-hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-700/50 rounded-lg transition-colors w-full group whitespace-nowrap"
          title={!sidebarOpen ? 'Agrandir' : undefined}
        >
          {sidebarOpen ? (
            <X className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-white transition-colors" />
          ) : (
            <Menu className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-white transition-colors" />
          )}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors"
              >
                Réduire le menu
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors w-full text-left group whitespace-nowrap"
          title={!sidebarOpen ? 'Déconnexion' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-red-400 transition-colors" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium text-gray-300 group-hover:text-red-400 transition-colors"
              >
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #4B5563; }
      `}</style>
    </motion.aside>
  );
}
