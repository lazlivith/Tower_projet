import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Award, ReceiptText, FileSignature, FileText } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader, Panel, EmptyState } from '../../components/ui';

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
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={user?.role === 'STUDENT' ? 'Apprenant' : 'Espace'}
        title="Fichiers personnels"
        description="Documents générés automatiquement : attestation d'inscription, factures, certificat."
      />

      {user?.role !== 'STUDENT' ? (
        <Panel className="text-[13px] text-[color:var(--a-ink-soft)]">
          Cet espace regroupe les documents personnels d'un élève.
          {user?.role === 'MANAGER' && (
            <> Côté administration, retrouvez tous les documents dans{' '}
              <Link to="/learn/admin/documents" className="a-link">Documents</Link>.
            </>
          )}
        </Panel>
      ) : loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : err ? (
        <EmptyState>{err}</EmptyState>
      ) : docs.length === 0 ? (
        <EmptyState>
          Aucun document pour l'instant. Votre attestation d'inscription apparaît dès l'activation de votre accès ;
          les factures après paiement et le certificat une fois la formation validée.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-2.5">
          {docs.map((d) => {
            const Icon = ICON[d.type] || FileText;
            return (
              <Panel key={d.id} className="!p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-white/5 text-[color:var(--a-ink-soft)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-[color:var(--a-ink)]">{d.title}</div>
                    <div className="text-[11px] text-[color:var(--a-ink-dim)]">
                      {LABEL[d.type] ?? d.type}{d.number ? ` · ${d.number}` : ''} · {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <a href={toAbsoluteUrl(d.url)} target="_blank" rel="noreferrer" className="a-btn a-btn-primary a-btn-sm">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </a>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
