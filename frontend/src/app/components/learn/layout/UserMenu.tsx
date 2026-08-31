import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  User, StickyNote, Calendar, FolderClosed, FileBarChart,
  Settings2, Languages, LogOut, ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from '../../ui/dropdown-menu';
import { useAuth } from '../../../contexts/AuthContext';

const LANGS = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
];

function getInitialLang() {
  try {
    return localStorage.getItem('tower_lang') || 'fr';
  } catch {
    return 'fr';
  }
}

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState(getInitialLang);

  const isStudent = user?.role === 'STUDENT';
  // Calendrier : les étudiants ont un écran dédié, les autres rôles une page générique
  const calendarPath = isStudent ? '/learn/student/calendar' : '/learn/calendar';

  const items = [
    { label: 'Profil', icon: User, path: '/learn/profile' },
    { label: 'Notes', icon: StickyNote, path: '/learn/notes' },
    { label: 'Calendrier', icon: Calendar, path: calendarPath },
    { label: 'Fichiers personnels', icon: FolderClosed, path: '/learn/files' },
    { label: 'Rapports', icon: FileBarChart, path: '/learn/reports' },
    { label: 'Préférences', icon: Settings2, path: '/learn/preferences' },
  ];

  const handleLang = (code: string) => {
    setLang(code);
    try {
      localStorage.setItem('tower_lang', code);
    } catch { /* stockage indisponible */ }
    document.documentElement.lang = code;
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
  };

  const handleLogout = () => {
    logout();
    navigate('/learn/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC107]">
        <span className="w-9 h-9 rounded-full bg-[#1A1A2E] text-[#FFC107] flex items-center justify-center font-bold text-sm">
          {user?.nom?.charAt(0)?.toUpperCase() || 'U'}
        </span>
        <span className="hidden sm:block text-left leading-tight">
          <span className="block text-sm font-semibold text-gray-800">{user?.nom || 'Utilisateur'}</span>
          <span className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{user?.role}</span>
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {items.map(({ label, icon: Icon, path }) => (
          <DropdownMenuItem key={label} onClick={() => navigate(path)} className="gap-2.5">
            <Icon className="w-4 h-4 text-gray-500" /> {label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2.5">
            <Languages className="w-4 h-4 text-gray-500" /> Langue
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={lang} onValueChange={handleLang}>
              {LANGS.map((l) => (
                <DropdownMenuRadioItem key={l.code} value={l.code}>{l.label}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive" className="gap-2.5">
          <LogOut className="w-4 h-4" /> Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
