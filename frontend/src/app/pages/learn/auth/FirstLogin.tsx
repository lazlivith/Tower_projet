import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import AuthShell from '../../../components/vitrine/AuthShell';
import api from '../../../services/api';

export default function FirstLogin() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { email?: string; currentPassword?: string };

  // Sécurité : si l'utilisateur accède à la page sans les infos d'état, on le redirige vers le login
  if (!state?.email || !state?.currentPassword) {
    return <Navigate to="/learn/login" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      return setError('Le mot de passe doit contenir au moins 6 caractères.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Les mots de passe ne correspondent pas.');
    }

    setLoading(true);
    try {
      await api.post('/auth/change-initial-password', {
        email: state.email,
        currentPassword: state.currentPassword,
        newPassword
      });
      setDone(true);
      setTimeout(() => navigate('/learn/login'), 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  const field = 'w-full border-0 border-b border-[color:var(--color-line)] bg-transparent py-2.5 pl-7 text-[15px] outline-none focus:border-[color:var(--color-accent)] transition-colors';

  return (
    <div>
      <Helmet><title>Sécurisez votre compte — Tower Structure</title></Helmet>

      <AuthShell
        icon={ShieldCheck}
        eyebrow="Première connexion"
        title="Sécurisez votre compte"
        subtitle="Un mot de passe temporaire vous a été attribué. Définissez le vôtre pour continuer."
      >
        {done ? (
          <div className="fade-up flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-[color:var(--color-accent)]" />
            <p className="text-[15px]">Mot de passe mis à jour. Redirection vers la connexion…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="newPassword" className="eyebrow">Nouveau mot de passe</label>
              <div className="relative mt-2">
                <KeyRound className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink-soft)]" />
                <input
                  type="password" id="newPassword" required
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className={field}
                  placeholder="Min. 6 caractères"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="eyebrow">Confirmer le mot de passe</label>
              <div className="relative mt-2">
                <KeyRound className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink-soft)]" />
                <input
                  type="password" id="confirmPassword" required
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className={field}
                  placeholder="Répétez le mot de passe"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-500">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-solid mt-2 w-full justify-center disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Valider et continuer'}
            </button>
          </form>
        )}
      </AuthShell>
    </div>
  );
}
