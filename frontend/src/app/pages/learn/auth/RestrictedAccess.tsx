import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, GraduationCap, CreditCard, ArrowRight, LogOut, Clock } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

interface PendingCourse {
  id: string;
  title: string;
  accessStatus: string;
}

export default function RestrictedAccess() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<PendingCourse[]>([]);

  // Un instructeur/manager ne doit jamais atterrir ici
  useEffect(() => {
    if (user?.role === 'MANAGER') navigate('/learn/admin', { replace: true });
    if (user?.role === 'INSTRUCTOR') navigate('/learn/instructor', { replace: true });
    if (user?.role === 'STUDENT' && user.hasActiveAccess) navigate('/learn/student', { replace: true });
  }, [user, navigate]);

  // Inscriptions en attente (paiement hors-ligne / validation admin)
  useEffect(() => {
    api.get('/courses/my-courses')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setPending(list.filter((c: any) => c.accessStatus && c.accessStatus !== 'ACTIVE'));
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/learn/login'); };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center py-12 px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-10">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#FFC107]/15 flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#FFB300]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">
            Bonjour {user?.nom} — votre compte est prêt
          </h1>
          <p className="text-gray-500">
            Pour accéder à votre espace d'apprentissage, choisissez une formation et effectuez le paiement.
            Votre accès s'ouvre automatiquement après validation.
          </p>
        </div>

        {pending.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-2">
              <Clock className="w-4 h-4" /> En attente de validation
            </div>
            <ul className="text-sm text-amber-800 space-y-1">
              {pending.map((c) => <li key={c.id}>• {c.title}</li>)}
            </ul>
            <p className="text-xs text-amber-700 mt-2">
              Un règlement par virement/chèque a été enregistré. L'administration active votre accès dès réception.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <Link
            to="/formations"
            className="flex items-center justify-between rounded-xl bg-[#1A1A2E] text-white px-5 py-4 hover:bg-[#26264a] transition-colors"
          >
            <span className="flex items-center gap-3 font-semibold">
              <GraduationCap className="w-5 h-5 text-[#FFC107]" /> Parcourir le catalogue de formations
            </span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="rounded-xl border border-gray-200 px-5 py-4 text-sm text-gray-500 flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            Paiement en ligne sécurisé (carte, comptant ou 3×) ou sur devis. Après paiement, votre espace de cours
            est débloqué immédiatement.
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between text-sm">
          <Link to="/" className="text-gray-500 hover:text-[#1A1A2E]">← Retour à l'accueil</Link>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-500 hover:text-red-600">
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
