import { Link } from 'react-router';
import { Lock, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export default function RestrictedAccess() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-12 text-center">
        <Lock className="w-20 h-20 text-[#FFC107] mx-auto mb-6" />
        <h1 className="mb-4">Accès Restreint</h1>
        <p className="text-gray-600 mb-8">
          Bonjour <span className="font-semibold">{user?.nom}</span>, votre compte a bien été créé mais votre accès aux formations est en attente de validation.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h3 className="mb-3 text-yellow-800">Prochaines étapes:</h3>
          <ol className="text-left space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#FFC107]">1.</span>
              <span>Validation de votre inscription par notre équipe</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#FFC107]">2.</span>
              <span>Réception d'un email de confirmation (sous 24-48h)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#FFC107]">3.</span>
              <span>Accès complet à la plateforme de formations</span>
            </li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-[#F5F6FA] p-6 rounded-lg">
            <Mail className="w-8 h-8 text-[#FFC107] mx-auto mb-3" />
            <h4 className="mb-2">Email</h4>
            <p className="text-sm text-gray-600">contact@tower-structure.fr</p>
          </div>
          <div className="bg-[#F5F6FA] p-6 rounded-lg">
            <Phone className="w-8 h-8 text-[#FFC107] mx-auto mb-3" />
            <h4 className="mb-2">Téléphone</h4>
            <p className="text-sm text-gray-600">+33 1 23 45 67 89</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Pour toute question, n'hésitez pas à nous contacter.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
