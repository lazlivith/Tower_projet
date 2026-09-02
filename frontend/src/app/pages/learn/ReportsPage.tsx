import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2, Clock } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader, Panel, Chip, EmptyState } from '../../components/ui';

interface Report {
  id: string; assignment: string; course: string; fileUrl: string | null;
  grade: number | null; status: string; submittedAt: string; dueDate: string;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'STUDENT') { setLoading(false); return; }
    api.get('/student/reports')
      .then((r) => setRows(r.data ?? []))
      .catch(() => setErr('Impossible de charger vos rapports.'))
      .finally(() => setLoading(false));
  }, [user?.role]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={user?.role === 'STUDENT' ? 'Apprenant' : 'Espace'}
        title="Rapports"
        description="Vos travaux et projets rendus, avec note et statut de correction."
      />

      {user?.role !== 'STUDENT' ? (
        <Panel className="text-[13px] text-[color:var(--a-ink-soft)]">
          Suivi des travaux rendus par les élèves.
          {user?.role === 'INSTRUCTOR' && (
            <> Corrigez-les depuis <Link to="/learn/instructor/assignments" className="a-link">Devoirs</Link>.</>
          )}
        </Panel>
      ) : loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : err ? (
        <EmptyState>{err}</EmptyState>
      ) : rows.length === 0 ? (
        <EmptyState>Aucun travail rendu pour l'instant.</EmptyState>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <Panel key={r.id} className="!p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-[color:var(--a-ink)]">{r.assignment}</div>
                {r.status === 'GRADED'
                  ? <Chip tone="green"><CheckCircle2 className="h-3.5 w-3.5" /> Corrigé — {r.grade}/100</Chip>
                  : <Chip tone="amber"><Clock className="h-3.5 w-3.5" /> En attente</Chip>}
              </div>
              <div className="mt-1 text-[11px] text-[color:var(--a-ink-dim)]">
                {r.course} · rendu le {new Date(r.submittedAt).toLocaleDateString('fr-FR')}
              </div>
              {r.fileUrl && (
                <a href={toAbsoluteUrl(r.fileUrl)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[color:var(--a-accent)]">
                  <FileText className="h-3.5 w-3.5" /> Voir ma remise
                </a>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
