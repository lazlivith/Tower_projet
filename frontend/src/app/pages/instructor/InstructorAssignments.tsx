import { useEffect, useState, useCallback } from 'react';
import { ClipboardCheck, FileText, Loader2, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import {
  PageHeader, Panel, Btn, Chip, Field, Input, Textarea, Modal, EmptyState,
  ToastHost, type Toast,
} from '../../components/ui';

interface Submission {
  id: string; grade: number | null; fileUrl: string | null; status: string; createdAt: string;
  student: { nom: string; email: string };
  assignment: { title: string; course: { title: string } };
}

export default function InstructorAssignments() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [target, setTarget] = useState<Submission | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const flash = (kind: Toast['kind'], msg: string) => setToast({ kind, msg });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/assignments/pending');
      setRows(r.data ?? []);
    } catch {
      flash('err', 'Erreur de chargement des devoirs.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openGrade = (s: Submission) => { setTarget(s); setGrade(''); setFeedback(''); };

  const submitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    const n = Number(grade);
    if (Number.isNaN(n) || n < 0 || n > 100) { flash('err', 'Note entre 0 et 100.'); return; }
    setSaving(true);
    try {
      await api.patch(`/assignments/${target.id}/grade`, { grade: n, feedback: feedback || undefined });
      flash('ok', 'Devoir corrigé.');
      setTarget(null);
      load();
    } catch (err: any) {
      flash('err', err?.response?.data?.message || 'Erreur lors de la notation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        eyebrow="Formateur"
        title="Devoirs à corriger"
        description="Copies remises par vos élèves, en attente de correction."
        actions={<Btn variant="ghost" onClick={load}>Actualiser</Btn>}
      />

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : rows.length === 0 ? (
        <EmptyState>
          <div className="flex flex-col items-center gap-2">
            <ClipboardCheck className="h-8 w-8 text-[color:var(--a-ok)]" />
            Aucune copie en attente. Tout est corrigé.
          </div>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((s) => (
            <Panel key={s.id} className="!p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[color:var(--a-ink)]">{s.student.nom}</span>
                    <Chip tone="amber">À corriger</Chip>
                  </div>
                  <div className="text-[12px] text-[color:var(--a-ink-dim)]">{s.assignment.course.title} — {s.assignment.title}</div>
                  <div className="text-[11px] text-[color:var(--a-ink-dim)]">Remis le {new Date(s.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className="flex items-center gap-2">
                  {s.fileUrl && (
                    <a href={s.fileUrl} target="_blank" rel="noreferrer" className="a-btn a-btn-ghost a-btn-sm"><FileText className="h-3.5 w-3.5" /> Copie</a>
                  )}
                  <Btn size="sm" variant="primary" onClick={() => openGrade(s)}><CheckCircle className="h-3.5 w-3.5" /> Corriger & noter</Btn>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={`Noter — ${target?.student.nom ?? ''}`}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setTarget(null)}>Annuler</Btn>
            <Btn variant="primary" onClick={submitGrade} disabled={saving || grade === ''}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Enregistrer la note
            </Btn>
          </>
        }
      >
        <form onSubmit={submitGrade} className="flex flex-col gap-4">
          <div className="text-[12.5px] text-[color:var(--a-ink-dim)]">
            {target?.assignment.course.title} — {target?.assignment.title}
          </div>
          <Field label="Note / 100">
            <Input type="number" min={0} max={100} value={grade} onChange={(e) => setGrade(e.target.value)} required />
          </Field>
          <Field label="Appréciation (optionnel)">
            <Textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </Field>
        </form>
      </Modal>

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
