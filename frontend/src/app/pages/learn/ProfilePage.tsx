import { Link } from 'react-router-dom';
import { User, Mail, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const roleLabel: Record<string, string> = {
  MANAGER: 'Manager / SuperAdmin',
  INSTRUCTOR: 'Instructeur',
  STUDENT: 'Étudiant',
};

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">Mon profil</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1A1A2E] text-[#FFC107] flex items-center justify-center text-xl font-bold">
            {user?.nom?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{user?.nom}</div>
            <div className="text-sm text-gray-500">{user?.role ? roleLabel[user.role] ?? user.role : ''}</div>
          </div>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-3 text-gray-700">
            <User className="w-4 h-4 text-gray-400" /> {user?.nom}
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Mail className="w-4 h-4 text-gray-400" /> {user?.email}
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <ShieldCheck className="w-4 h-4 text-gray-400" /> Compte {user?.isActive === false ? 'suspendu' : 'actif'}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <Link
            to="/learn/first-login"
            state={{ email: user?.email }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A1A2E] hover:text-[#FFB300] transition-colors"
          >
            <KeyRound className="w-4 h-4" /> Changer mon mot de passe
          </Link>
        </div>
      </div>
    </div>
  );
}
