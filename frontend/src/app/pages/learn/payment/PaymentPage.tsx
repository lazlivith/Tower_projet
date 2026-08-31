import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { CheckCircle, Loader, BookOpen, Clock, Tag, ArrowRight, FlaskConical, CreditCard } from 'lucide-react';

type PaymentPlan = 'FULL' | 'THREE_INSTALLMENTS';

export default function PaymentPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PaymentPlan>('FULL');
  const [isProcessing, setIsProcessing] = useState<'stripe' | 'simulate' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/courses/${courseId}`);
        setCourse(res.data);
      } catch {
        setError('Impossible de charger la formation.');
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchCourse();
  }, [courseId]);

  const price = Number(course?.price || 0);
  const installment = Math.round(price / 3);

  const handleStripe = async () => {
    setIsProcessing('stripe');
    setError('');
    try {
      const res = await api.post('/payments/checkout', {
        courseId,
        paymentMethod: 'STRIPE',
        paymentPlan: plan,
      });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }
      setError("La session de paiement n'a pas pu être créée.");
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du paiement.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSimulate = async () => {
    setIsProcessing('simulate');
    setError('');
    try {
      await api.post('/payments/simulate', { courseId });
      await refreshSession(); // met à jour hasActiveAccess
      setSuccess(true);
      setTimeout(() => navigate('/learn/student'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la confirmation du paiement.');
    } finally {
      setIsProcessing(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader className="w-8 h-8 animate-spin text-[#FFC107]" />
    </div>
  );

  if (!course && error) return (
    <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
  );

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Accès activé !</h2>
        <p className="text-gray-500 mb-2">Vous êtes maintenant inscrit à</p>
        <p className="font-bold text-[#FFC107] text-lg mb-6">{course?.title}</p>
        <p className="text-sm text-gray-400 mb-6">Redirection automatique dans 3 secondes...</p>
        <Link to="/learn/student" className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFC107] text-[#1A1A2E] font-bold rounded-xl hover:bg-yellow-400 transition-colors">
          Accéder à ma formation <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/formations" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-8">← Retour aux formations</Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Valider votre inscription</h1>
        <p className="text-gray-500 mb-8">Récapitulatif de la formation choisie</p>

        {/* Récap formation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          {course?.imageUrl && (
            <img src={course.imageUrl} alt={course.title} className="w-full h-48 object-cover" />
          )}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{course?.title}</h2>
            <p className="text-gray-500 text-sm mb-4 line-clamp-3">{course?.description}</p>
            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{course?.durationHours}h de formation</span>
              <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" />{course?.level}</span>
              <span className="flex items-center gap-1.5 font-bold text-gray-900 text-base">
                <BookOpen className="w-4 h-4 text-[#FFC107]" />{price.toLocaleString()} DH
              </span>
            </div>
          </div>
        </div>

        {/* Choix du plan de paiement */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setPlan('FULL')}
            className={`text-left p-5 rounded-2xl border-2 transition-colors ${plan === 'FULL' ? 'border-[#FFC107] bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
          >
            <div className="font-bold text-gray-900">Comptant</div>
            <div className="text-sm text-gray-500 mt-1">1 versement</div>
            <div className="text-lg font-bold text-gray-900 mt-2">{price.toLocaleString()} DH</div>
          </button>
          <button
            type="button"
            onClick={() => setPlan('THREE_INSTALLMENTS')}
            className={`text-left p-5 rounded-2xl border-2 transition-colors ${plan === 'THREE_INSTALLMENTS' ? 'border-[#FFC107] bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
          >
            <div className="font-bold text-gray-900">Échéancier 3×</div>
            <div className="text-sm text-gray-500 mt-1">3 versements mensuels</div>
            <div className="text-lg font-bold text-gray-900 mt-2">{installment.toLocaleString()} DH <span className="text-sm font-medium text-gray-500">/ mois</span></div>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        {/* Paiement par carte (Stripe) */}
        <button
          onClick={handleStripe}
          disabled={isProcessing !== null}
          className="w-full flex items-center justify-center gap-3 py-4 bg-[#1A1A2E] text-white font-bold rounded-xl hover:bg-[#26264a] transition-colors text-base disabled:opacity-60 mb-3"
        >
          {isProcessing === 'stripe'
            ? <><Loader className="w-5 h-5 animate-spin" /> Redirection vers Stripe…</>
            : <><CreditCard className="w-5 h-5" /> Payer par carte {plan === 'THREE_INSTALLMENTS' ? `(1re échéance — ${installment.toLocaleString()} DH)` : `(${price.toLocaleString()} DH)`}</>}
        </button>

        {/* Mode test */}
        <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 p-5">
          <div className="flex items-start gap-3">
            <FlaskConical className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-gray-800 text-sm mb-1">Mode démonstration</div>
              <p className="text-xs text-gray-500 mb-3">Active l'accès instantanément, sans paiement réel.</p>
              <button
                onClick={handleSimulate}
                disabled={isProcessing !== null}
                className="text-sm font-semibold text-[#1A1A2E] hover:text-[#FFB300] transition-colors inline-flex items-center gap-2 disabled:opacity-60"
              >
                {isProcessing === 'simulate'
                  ? <><Loader className="w-4 h-4 animate-spin" /> Activation…</>
                  : <><CheckCircle className="w-4 h-4" /> Confirmer en mode test</>}
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          🔒 Paiement sécurisé par Stripe · Virement bancaire sur demande
        </p>
      </div>
    </div>
  );
}
