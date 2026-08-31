import { Link } from 'react-router-dom';
import { Hammer, ArrowLeft } from 'lucide-react';

/**
 * Page générique « fonctionnalité à venir » — utilisée par les entrées du menu
 * utilisateur dont l'écran dédié n'est pas encore livré (Notes, Fichiers, Rapports…).
 */
export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#FFC107]/15 flex items-center justify-center">
          <Hammer className="w-8 h-8 text-[#FFB300]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">{title}</h1>
        <p className="text-gray-500 mb-8">
          Cette section fait partie du menu utilisateur et sera disponible dans une prochaine livraison.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A1A2E] hover:text-[#FFB300] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
      </div>
    </div>
  );
}
