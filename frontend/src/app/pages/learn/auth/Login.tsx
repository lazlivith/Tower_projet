import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();
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
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        
        if (result?.requirePasswordChange) {
          navigate('/learn/first-login', { 
            state: { 
              email: result.email, 
              currentPassword: formData.password 
            } 
          });
          return;
        }

        // Redirection selon le rôle de l'utilisateur connecté
        const storedUser = JSON.parse(localStorage.getItem('tower_user') || '{}');
        const role = storedUser?.role;
        if (role === 'MANAGER') {
          navigate(returnUrl || '/learn/admin');
        } else if (role === 'INSTRUCTOR') {
          navigate(returnUrl || '/learn/instructor');
        } else {
          navigate(returnUrl || '/learn/student');
        }
      } else {
        await register(formData.email, formData.password, formData.name);
        navigate(returnUrl || '/learn/restricted');
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
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#16213E] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-[#FFC107] rounded flex items-center justify-center">
              <span className="font-bold text-[#1A1A2E] text-xl">TS</span>
            </div>
          </div>
          <h2 className="mb-2">{isLogin ? 'Connexion à Tower-Learn' : 'Rejoindre Tower-Learn'}</h2>
          <p className="text-gray-600">
            {isLogin ? 'Accédez à votre espace pédagogique' : 'Créez votre compte étudiant'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block mb-2">
                Nom complet
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1A1A2E]"></div>
            ) : (
              <>
                {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isLogin ? 'Se connecter' : "S'inscrire"}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-[#FFC107] hover:underline"
          >
            {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>
        </div>

        {isLogin && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm mb-2 font-semibold">Comptes de démonstration:</p>
            <div className="text-sm space-y-1 text-gray-600">
              <p>👤 Étudiant: <span className="font-mono">eleve@tower.ma</span></p>
              <p>👨‍🏫 Instructeur: <span className="font-mono">prof@tower.ma</span></p>
              <p>👨‍💼 Admin: <span className="font-mono">admin@tower.ma</span></p>
              <p className="mt-2 text-xs text-gray-500">Mot de passe: <span className="font-mono">password123</span> (tous comptes)</p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-600 hover:text-[#FFC107] text-sm">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
