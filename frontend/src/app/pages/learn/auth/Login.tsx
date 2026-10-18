import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { LogIn, UserPlus, Mail, Lock, User2, Loader2 } from 'lucide-react';
import AuthShell from '../../../components/vitrine/AuthShell';
import { useAuth } from '../../../contexts/AuthContext';
import { useReveal } from '../../../hooks/useReveal';

const DEMO_ACCOUNTS = [
  { role: 'Étudiant', email: 'eleve@tower.ma' },
  { role: 'Instructeur', email: 'prof@tower.ma' },
  { role: 'Admin', email: 'admin@tower.ma' },
];

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnUrl = location.state?.returnUrl;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  useReveal([isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.email, formData.password, formData.name);

      if (result?.requirePasswordChange) {
        navigate('/learn/first-login', {
          state: { email: result.email, currentPassword: formData.password }
        });
        return;
      }

      const u = result?.user || JSON.parse(localStorage.getItem('tower_user') || '{}');

      if (u.role === 'MANAGER') {
        navigate(returnUrl || '/learn/admin');
      } else if (u.role === 'INSTRUCTOR') {
        navigate(returnUrl || '/learn/instructor');
      } else if (u.hasActiveAccess) {
        navigate(returnUrl || '/learn/student');
      } else {
        // Étudiant sans accès : doit choisir une formation et payer
        navigate('/learn/restricted');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const field = 'w-full border-0 border-b border-[color:var(--color-line)] bg-transparent py-2.5 pl-7 text-[15px] outline-none focus:border-[color:var(--color-accent)] transition-colors';

  return (
    <div>
      <Helmet><title>{isLogin ? 'Connexion' : 'Inscription'} — Tower Structure</title></Helmet>

      <AuthShell
        icon={isLogin ? LogIn : UserPlus}
        eyebrow="Espace pédagogique"
        title={isLogin ? 'Connexion à Tower Structure' : 'Rejoindre Tower Structure'}
        subtitle={isLogin ? 'Accédez à votre espace apprenant, formateur ou administrateur.' : 'Créez votre compte étudiant en quelques secondes.'}
        footer={
          isLogin && (
            <div className="fade-up mt-6 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-2)]/40 p-5">
              <p className="eyebrow">Comptes de démonstration</p>
              <ul className="mt-3 space-y-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <li key={a.email} className="flex items-center justify-between gap-3 border-t border-[color:var(--color-line)] py-2 text-[13px] first:border-t-0 first:pt-0">
                    <span className="text-[color:var(--color-ink-soft)]">{a.role}</span>
                    <button
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, email: a.email }))}
                      className="font-mono text-[12.5px] text-[color:var(--color-accent)] hover:underline"
                      title="Pré-remplir l'email"
                    >
                      {a.email}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11.5px] text-[color:var(--color-ink-soft)]">
                Mot de passe pour tous les comptes : <span className="font-mono text-[color:var(--color-ink)]">password123</span>
              </p>
            </div>
          )
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="eyebrow">Nom complet</label>
              <div className="relative mt-2">
                <User2 className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink-soft)]" />
                <input
                  type="text" id="name" name="name" required
                  value={formData.name} onChange={handleChange}
                  className={field}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="eyebrow">Email</label>
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink-soft)]" />
              <input
                type="email" id="email" name="email" required
                value={formData.email} onChange={handleChange}
                className={field}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="eyebrow">Mot de passe</label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink-soft)]" />
              <input
                type="password" id="password" name="password" required
                value={formData.password} onChange={handleChange}
                className={field}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-500">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-solid mt-2 w-full justify-center disabled:opacity-60">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isLogin ? 'Se connecter' : "S'inscrire"}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="arrow-link mx-auto text-[13px] text-[color:var(--color-ink-soft)]"
          >
            {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>
        </form>
      </AuthShell>
    </div>
  );
}
