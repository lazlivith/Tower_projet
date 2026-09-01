import { useEffect, useState } from 'react';
import { Award, Download, Clock, HelpCircle } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import { PageHeader, Panel, PanelTitle, EmptyState } from '../../components/admin/ui';

interface Certificate { id: string; courseTitle: string; score: number; issuedAt: string; downloadUrl: string }
interface Pending {
  courseTitle: string; hoursSpent: number; hoursRequired: number;
  hoursOk: boolean; quizzesOk: boolean; quizzesPassed: number; quizzesTotal: number;
}

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/certificates')
      .then((res) => {
        setCertificates(res.data.certificates || []);
        setPending(res.data.pending || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        eyebrow="Apprenant"
        title="Mes certificats"
        description={`Délivrés automatiquement dès ${pending[0]?.hoursRequired ?? 85} h de présence et tous les quiz validés.`}
      />

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : certificates.length === 0 && pending.length === 0 ? (
        <EmptyState>Aucune formation en cours.</EmptyState>
      ) : (
        <>
          {certificates.length > 0 && (
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              {certificates.map((c) => (
                <div key={c.id} className="a-card overflow-hidden !border-[color:color-mix(in_srgb,var(--a-accent-2)_45%,transparent)]">
                  <div className="bg-[color:var(--a-panel-2)] p-6 text-center">
                    <Award className="mx-auto mb-3 h-14 w-14 text-[color:var(--a-accent-2)]" />
                    <div className="font-[family-name:var(--font-display,inherit)] font-semibold text-[color:var(--a-ink)]">Certificat de réussite</div>
                    <div className="text-[11px] text-[color:var(--a-ink-dim)]">Tower Structure</div>
                  </div>
                  <div className="p-5">
                    <p className="text-center text-[15px] font-semibold text-[color:var(--a-ink)]">{c.courseTitle}</p>
                    <div className="my-4 grid grid-cols-2 gap-3 text-center text-[12px]">
                      <div>
                        <div className="text-[color:var(--a-ink-dim)]">Obtenu le</div>
                        <div className="font-semibold text-[color:var(--a-ink-soft)]">{new Date(c.issuedAt).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <div>
                        <div className="text-[color:var(--a-ink-dim)]">Score</div>
                        <div className="font-semibold text-[color:var(--a-accent-2)]">{c.score}%</div>
                      </div>
                    </div>
                    <a
                      href={toAbsoluteUrl(c.downloadUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="a-btn a-btn-primary w-full justify-center"
                    >
                      <Download className="h-4 w-4" /> Télécharger le PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pending.length > 0 && (
            <Panel>
              <PanelTitle>En cours d'obtention</PanelTitle>
              <div className="grid gap-3 md:grid-cols-2">
                {pending.map((p, i) => {
                  const pct = Math.min(100, Math.round((p.hoursSpent / p.hoursRequired) * 100));
                  return (
                    <div key={i} className="a-card p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Award className="h-5 w-5 text-[color:var(--a-ink-dim)]" />
                        <h4 className="text-[13px] font-semibold text-[color:var(--a-ink)]">{p.courseTitle}</h4>
                      </div>
                      <div className="mb-1 flex justify-between text-[11px] text-[color:var(--a-ink-dim)]">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Présence</span>
                        <span className={p.hoursOk ? 'font-semibold text-[color:var(--a-ok)]' : ''}>{Math.round(p.hoursSpent)} / {p.hoursRequired} h</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-[color:var(--a-accent-2)]" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-2 flex justify-between text-[11px] text-[color:var(--a-ink-dim)]">
                        <span className="inline-flex items-center gap-1"><HelpCircle className="h-3 w-3" /> Quiz validés</span>
                        <span className={p.quizzesOk ? 'font-semibold text-[color:var(--a-ok)]' : ''}>{p.quizzesPassed} / {p.quizzesTotal}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
