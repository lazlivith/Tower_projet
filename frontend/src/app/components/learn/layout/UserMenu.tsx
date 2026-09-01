import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  User, Bell, FolderClosed, FileBarChart, HelpCircle, Languages, LogOut, ChevronDown,
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

/**
 * Menu déroulant utilisateur — commun à tous les espaces (élève, formateur, admin).
 * `variant` adapte l'apparence du bouton déclencheur au thème de l'en-tête.
 */
export default function UserMenu({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState(getInitialLang);

  const items = [
    { label: 'Profil', icon: User, path: '/learn/profile' },
    { label: 'Notifications', icon: Bell, path: '/learn/notifications' },
    { label: 'Fichiers personnels', icon: FolderClosed, path: '/learn/files' },
    { label: 'Rapports', icon: FileBarChart, path: '/learn/reports' },
    { label: 'FAQ', icon: HelpCircle, path: '/learn/faq' },
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

  const dark = variant === 'dark';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors focus:outline-none ${
          dark
            ? 'hover:bg-white/5 focus:ring-2 focus:ring-[color:var(--a-accent)]'
            : 'hover:bg-gray-100 focus:ring-2 focus:ring-[#FFC107]'
        }`}
      >
        <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
          dark ? 'border border-[color:var(--a-line)] text-[color:var(--a-accent)]' : 'bg-[#1A1A2E] text-[#FFC107]'
        }`}>
          {user?.nom?.charAt(0)?.toUpperCase() || 'U'}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className={`block text-sm font-semibold ${dark ? 'text-[color:var(--a-ink)]' : 'text-gray-800'}`}>
            {user?.nom || 'Utilisateur'}
          </span>
          <span className={`block text-[10px] font-semibold uppercase tracking-widest ${dark ? 'text-[color:var(--a-ink-dim)]' : 'text-gray-400'}`}>
            {user?.role}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 ${dark ? 'text-[color:var(--a-ink-dim)]' : 'text-gray-400'}`} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {items.map(({ label, icon: Icon, path }) => (
          <DropdownMenuItem key={label} onClick={() => navigate(path)} className="gap-2.5">
            <Icon className="h-4 w-4 text-gray-500" /> {label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2.5">
            <Languages className="h-4 w-4 text-gray-500" /> Langue
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
          <LogOut className="h-4 w-4" /> Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
