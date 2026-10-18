import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import AuthShell from '../../../components/vitrine/AuthShell';
import AuthField from '../../../components/vitrine/AuthField';
import api from '../../../services/api';

export default function FirstLogin() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <div>
      <Helmet><title>Sécurisez votre compte — Tower Structure</title></Helmet>

      <AuthShell title="Sécurisez votre compte" subtitle="Première connexion : choisissez un mot de passe définitif pour continuer.">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-[#2189B7]" />
            <p className="text-[15px] text-[#0f1b2a]">Mot de passe mis à jour. Redirection vers la connexion…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <AuthField
              icon={KeyRound}
              label="Nouveau mot de passe"
              id="newPassword" type={showPassword ? 'text' : 'password'} required
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 caractères"
              autoComplete="new-password"
              endAdornment={
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-slate-400 hover:text-slate-600" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <AuthField
              icon={KeyRound}
              label="Confirmer le mot de passe"
              id="confirmPassword" type={showPassword ? 'text' : 'password'} required
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Répétez le mot de passe"
              autoComplete="new-password"
            />

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F59E0B] py-3.5 text-[15px] font-semibold text-[#0a2132] transition-colors hover:bg-[#f7ad2e] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Valider et continuer'}
            </button>
          </form>
        )}
      </AuthShell>
    </div>
  );
}
