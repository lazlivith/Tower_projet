import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ShieldCheck, KeyRound } from 'lucide-react';
import api from '../../../services/api';

export default function FirstLogin() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
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
      
      // Après succès, on renvoie l'utilisateur vers le login
      // (On pourrait aussi faire le login automatiquement, mais par sécurité, on lui demande de se reconnecter)
      alert("Mot de passe mis à jour avec succès. Veuillez vous connecter avec votre nouveau mot de passe.");
      navigate('/learn/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#16213E] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Sécurisez votre compte</h2>
          <p className="text-gray-600 text-sm">
            C'est votre première connexion. Vous devez modifier votre mot de passe temporaire pour continuer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-gray-500" /> Nouveau mot de passe
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC107] transition-all"
              placeholder="Min. 6 caractères"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-gray-500" /> Confirmer le mot de passe
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC107] transition-all"
              placeholder="Répétez le mot de passe"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3.5 bg-[#FFC107] text-[#1A1A2E] font-bold rounded-xl hover:bg-[#FFD54F] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1A1A2E]"></div>
            ) : (
              'Valider et continuer'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
