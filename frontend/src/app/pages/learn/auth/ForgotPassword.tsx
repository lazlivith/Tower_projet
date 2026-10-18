import { useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { Mail, Loader2, MailCheck } from 'lucide-react';
import AuthShell from '../../../components/vitrine/AuthShell';
import AuthField from '../../../components/vitrine/AuthField';
import api from '../../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Helmet><title>Mot de passe oublié — Tower Structure</title></Helmet>

      <AuthShell
        title="Mot de passe oublié"
        subtitle="Indiquez votre adresse email : si un compte existe, un lien de réinitialisation valable 1 h vous sera envoyé."
        footer={
          !sent && (
            <Link to="/learn/login" className="mt-6 block text-center text-[13.5px] text-slate-500">
              <span className="font-semibold text-[#2189B7] hover:underline">Retour à la connexion</span>
            </Link>
          )
        }
      >
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <MailCheck className="h-10 w-10 text-[#2189B7]" />
            <p className="text-[15px] text-[#0f1b2a]">
              Si <span className="font-semibold">{email}</span> correspond à un compte, un email vient d'être envoyé.
            </p>
            <p className="text-[13px] text-slate-500">Pensez à vérifier vos courriers indésirables.</p>
            <Link to="/learn/login" className="mt-3 text-[13.5px] font-semibold text-[#2189B7] hover:underline">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <AuthField
              icon={Mail}
              label="Adresse email"
              id="email" type="email" required autoFocus
              value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>
        )}
      </AuthShell>
    </div>
  );
}
