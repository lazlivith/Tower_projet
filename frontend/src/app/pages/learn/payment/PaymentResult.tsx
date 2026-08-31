import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

/**
 * Pages de retour Stripe Checkout : /payment/success et /payment/cancel.
 * L'activation réelle de l'accès est faite par le webhook `checkout.session.completed` ;
 * cette page ne fait qu'informer l'utilisateur.
 */
export default function PaymentResult({ status }: { status: 'success' | 'cancel' }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get('session_id');

  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(() => navigate('/learn/student'), 5000);
      return () => clearTimeout(t);
    }
  }, [status, navigate]);

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 text-center max-w-md w-full">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
          {isSuccess
            ? <CheckCircle2 className="w-10 h-10 text-green-600" />
            : <XCircle className="w-10 h-10 text-red-500" />}
        </div>

        {isSuccess ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Paiement confirmé</h1>
            <p className="text-gray-500 mb-2">
              Votre inscription est en cours d'activation. Vous recevrez un email de confirmation
              et votre accès à l'espace e-learning sera actif dans quelques instants.
            </p>
            {sessionId && <p className="text-[11px] text-gray-300 mb-6 break-all">Réf. {sessionId}</p>}
            <Link to="/learn/student" className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFC107] text-[#1A1A2E] font-bold rounded-xl hover:bg-yellow-400 transition-colors">
              Accéder à mon espace <ArrowRight className="w-5 h-5" />
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Paiement annulé</h1>
            <p className="text-gray-500 mb-6">
              Le paiement n'a pas été finalisé. Aucun montant n'a été prélevé.
              Vous pouvez réessayer à tout moment.
            </p>
            <Link to="/formations" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1A2E] text-white font-bold rounded-xl hover:bg-[#26264a] transition-colors">
              Retour aux formations
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
