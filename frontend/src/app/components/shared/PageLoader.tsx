import { Loader2 } from 'lucide-react';

/**
 * Repli affiché pendant le chargement d'un chunk différé (React.lazy).
 * Styles en ligne : doit rester lisible quel que soit l'espace (vitrine claire,
 * back-office sombre) sans dépendre d'une feuille de style scoped.
 */
export default function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="animate-spin" style={{ width: 28, height: 28, opacity: 0.45 }} />
    </div>
  );
}
