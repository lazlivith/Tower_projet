import { Link } from 'react-router-dom';
import { User, Mail, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader, Panel } from '../../components/ui';

const roleLabel: Record<string, string> = {
  MANAGER: 'Administrateur',
  INSTRUCTOR: 'Formateur',
  STUDENT: 'Apprenant',
};

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Compte" title="Mon profil" />

      <Panel>
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-[color:var(--a-line)] text-xl font-bold text-[color:var(--a-accent)]">
            {user?.nom?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-semibold text-[color:var(--a-ink)]">{user?.nom}</div>
            <div className="text-[13px] text-[color:var(--a-ink-dim)]">{user?.role ? roleLabel[user.role] ?? user.role : ''}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 text-[13px] text-[color:var(--a-ink-soft)]">
          <div className="flex items-center gap-3"><User className="h-4 w-4 text-[color:var(--a-ink-dim)]" /> {user?.nom}</div>
          <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-[color:var(--a-ink-dim)]" /> {user?.email}</div>
          <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-[color:var(--a-ink-dim)]" /> Compte {user?.isActive === false ? 'suspendu' : 'actif'}</div>
        </div>

        <div className="mt-5 border-t border-[color:var(--a-line)] pt-4">
          <Link
            to="/learn/first-login"
            state={{ email: user?.email }}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[color:var(--a-accent)] hover:underline"
          >
            <KeyRound className="h-4 w-4" /> Changer mon mot de passe
          </Link>
        </div>
      </Panel>
    </div>
  );
}
