import { Bell } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import UserMenu from './UserMenu';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-8 h-20 flex-shrink-0 flex items-center justify-between relative z-10 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E] tracking-tight">
          Bienvenue, <span className="text-[#FFC107]">{user?.nom}</span>
        </h1>
        <p className="text-[13px] font-medium text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }).replace(/^\w/, (c) => c.toUpperCase())}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
          title="Notifications"
        >
          <Bell className="w-[22px] h-[22px] text-gray-600" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="w-[1px] h-8 bg-gray-200"></div>
        <UserMenu />
      </div>
    </header>
  );
}
