import { useState, useEffect } from 'react';
import { CheckCircle, Clock, User, BookOpen, X, Loader } from 'lucide-react';
import api from '../../services/api';

type PendingEnrollment = {
  id: string;
  student: { id: string; nom: string; email: string };
  course: { id: string; title: string; price: number };
  createdAt: string;
  accessStatus: string;
};

export default function PaymentsManager() {
  const [pending, setPending] = useState<PendingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/enrollments/pending');
      setPending(res.data || []);
    } catch {
      showFeedback('error', 'Erreur lors du chargement des inscriptions en attente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleValidate = async (enrollmentId: string, studentNom: string, courseTitle: string) => {
    if (!window.confirm(`Activer l'accès de "${studentNom}" à la formation "${courseTitle}" ?`)) return;
    setValidating(enrollmentId);
    try {
      await api.patch(`/admin/enrollments/${enrollmentId}/validate-access`);
      showFeedback('success', `✅ Accès de ${studentNom} activé avec succès !`);
      setPending(prev => prev.filter(e => e.id !== enrollmentId));
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || "Erreur lors de la validation.");
    } finally {
      setValidating(null);
    }
  };

  return (
    <div className="p-6">
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium flex items-center gap-3 max-w-sm ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <X className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm">{feedback.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Validation des Accès Étudiants</h2>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${pending.length} inscription${pending.length !== 1 ? 's' : ''} en attente de validation`}
          </p>
        </div>
        <button onClick={fetchPending} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 animate-pulse">Chargement...</div>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
          <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">Tout est à jour !</h3>
          <p className="text-gray-400 text-sm">Aucune inscription en attente de validation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map(enrollment => (
            <div key={enrollment.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">{enrollment.student.nom}</div>
                  <div className="text-sm text-gray-500">{enrollment.student.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-semibold text-sm text-gray-800">{enrollment.course.title}</div>
                  <div className="text-xs text-gray-400">{enrollment.course.price?.toLocaleString()} DH</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock className="w-4 h-4" />
                {new Date(enrollment.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">En attente</span>
                <button
                  onClick={() => handleValidate(enrollment.id, enrollment.student.nom, enrollment.course.title)}
                  disabled={validating === enrollment.id}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
                >
                  {validating === enrollment.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Valider l'accès
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
