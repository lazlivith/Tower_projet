import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderClosed, Download, Award, ReceiptText, FileSignature, FileText } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Doc { id: string; type: string; number: string | null; title: string; url: string; createdAt: string }

const ICON: Record<string, any> = {
  CERTIFICATE: Award, INVOICE: ReceiptText, QUOTE: FileText, ENROLLMENT_ATTESTATION: FileSignature,
};
const LABEL: Record<string, string> = {
  CERTIFICATE: 'Certificat', INVOICE: 'Facture', QUOTE: 'Devis', ENROLLMENT_ATTESTATION: "Attestation d'inscription",
};

export default function PersonalFiles() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'STUDENT') { setLoading(false); return; }
    api.get('/student/documents')
      .then((r) => setDocs(r.data ?? []))
      .catch(() => setErr('Impossible de charger vos documents.'))
      .finally(() => setLoading(false));
  }, [user?.role]);

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-2.5">
        <FolderClosed className="h-6 w-6 text-[#FFC107]" />
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Fichiers personnels</h1>
      </div>

      {user?.role !== 'STUDENT' ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Cet espace regroupe les documents générés automatiquement pour un élève
          (attestation d'inscription, factures, certificat).
          {user?.role === 'MANAGER' && (
            <>
              {' '}Côté administration, retrouvez tous les documents dans{' '}
              <Link to="/learn/admin/documents" className="font-semibold text-[#1A1A2E] underline">Documents</Link>.
            </>
          )}
        </div>
      ) : loading ? (
        <div className="text-sm text-gray-400">Chargement…</div>
      ) : err ? (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{err}</div>
      ) : docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-400">
          Aucun document pour l'instant. Votre attestation d'inscription apparaît dès l'activation de votre accès ;
          les factures après paiement et le certificat une fois la formation validée.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {docs.map((d) => {
            const Icon = ICON[d.type] || FileText;
            return (
              <div key={d.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-gray-900">{d.title}</div>
                  <div className="text-xs text-gray-400">
                    {LABEL[d.type] ?? d.type}{d.number ? ` · ${d.number}` : ''} · {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <a
                  href={toAbsoluteUrl(d.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A2E] px-3 py-2 text-xs font-bold text-white hover:bg-[#26264a]"
                >
                  <Download className="h-3.5 w-3.5" /> PDF
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
