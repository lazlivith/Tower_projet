import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import AuthShell from '../../../components/vitrine/AuthShell';
import AuthField from '../../../components/vitrine/AuthField';
import api from '../../../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div>
        <Helmet><title>Lien invalide — Tower Structure</title></Helmet>
        <AuthShell title="Lien invalide" subtitle="Ce lien de réinitialisation est incomplet ou a expiré.">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <ShieldAlert className="h-10 w-10 text-red-500" />
            <p className="text-[15px] text-[#0f1b2a]">Aucun jeton de réinitialisation détecté dans le lien.</p>
            <Link to="/learn/forgot-password" className="mt-2 text-[13.5px] font-semibold text-[#2189B7] hover:underline">
              Demander un nouveau lien
            </Link>
          </div>
        </AuthShell>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      return setError('Le mot de passe doit contenir au moins 8 caractères.');
    }
    if (password !== confirmPassword) {
      return setError('Les mots de passe ne correspondent pas.');
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/learn/login'), 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || "Ce lien n'est plus valide. Demandez-en un nouveau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Helmet><title>Réinitialiser le mot de passe — Tower Structure</title></Helmet>

      <AuthShell title="Nouveau mot de passe" subtitle="Choisissez un mot de passe définitif pour votre compte.">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-[#2189B7]" />
            <p className="text-[15px] text-[#0f1b2a]">Mot de passe réinitialisé. Redirection vers la connexion…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <AuthField
              icon={KeyRound}
              label="Nouveau mot de passe"
              id="password" type={showPassword ? 'text' : 'password'} required autoFocus
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 caractères"
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        )}
      </AuthShell>
    </div>
  );
}
