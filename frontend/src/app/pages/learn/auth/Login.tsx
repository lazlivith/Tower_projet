import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { UserPlus, Mail, Lock, User2, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import AuthShell from '../../../components/vitrine/AuthShell';
import AuthField from '../../../components/vitrine/AuthField';
import { useAuth } from '../../../contexts/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <div>
      <Helmet><title>{isLogin ? 'Connexion' : 'Inscription'} — Tower Structure</title></Helmet>

      <AuthShell
        title={isLogin ? 'Bienvenue' : 'Créer un compte'}
        subtitle={isLogin ? 'Connectez-vous à votre espace Tower Structure.' : 'Rejoignez Tower Structure en quelques secondes.'}
        footer={
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="mt-6 w-full text-center text-[13.5px] text-slate-500"
          >
            {isLogin ? (
              <>Pas encore de compte ? <span className="font-semibold text-[#2189B7] hover:underline">S'inscrire</span></>
            ) : (
              <>Déjà un compte ? <span className="font-semibold text-[#2189B7] hover:underline">Se connecter</span></>
            )}
          </button>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {!isLogin && (
            <AuthField
              icon={User2}
              label="Nom complet"
              id="name" name="name" type="text" required
              value={formData.name} onChange={handleChange}
            />
          )}

          <AuthField
            icon={Mail}
            label="Adresse email"
            id="email" name="email" type="email" required
            value={formData.email} onChange={handleChange}
            autoComplete="email"
          />

          <AuthField
            icon={Lock}
            label="Mot de passe"
            labelRight={
              isLogin && (
                <Link to="/learn/forgot-password" className="text-[12.5px] font-semibold text-[#2189B7] hover:underline">
                  Mot de passe oublié ?
                </Link>
              )
            }
            id="password" name="password" type={showPassword ? 'text' : 'password'} required
            value={formData.password} onChange={handleChange}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
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
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Se connecter' : "S'inscrire"}
                {isLogin ? <ArrowRight className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              </>
            )}
          </button>
        </form>
      </AuthShell>
    </div>
  );
}
