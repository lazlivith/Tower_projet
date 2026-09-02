import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Clock, User, Users2 } from 'lucide-react';
import api from '../../services/api';
import QuizRunner from '../../components/learn/QuizRunner';
import { PageHeader, Panel, Btn, Chip, EmptyState, ToastHost, type Toast } from '../../components/ui';

interface QuizItem {
  id: string; title: string; description: string | null; passScore: number; dueAt: string | null;
  questionsCount: number; personal: boolean; course: string; classroom: string;
  myBestScore: number | null; passed: boolean; attempted: boolean;
}

export default function StudentQuizzes() {
  const [items, setItems] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<QuizItem | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/student/quizzes');
      setItems(r.data ?? []);
    } catch {
      setToast({ kind: 'err', msg: 'Impossible de charger vos quiz.' });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Apprenant"
        title="Mes quiz"
        description="Quiz assignés par vos formateurs (à toute la classe ou personnellement)."
      />

      {active ? (
        <div className="mx-auto max-w-2xl">
          <button onClick={() => { setActive(null); load(); }} className="mb-3 text-sm text-[color:var(--a-ink-dim)] hover:text-[color:var(--a-ink)]">← Retour à la liste</button>
          <QuizRunner quizId={active.id} onDone={() => load()} />
        </div>
      ) : loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : items.length === 0 ? (
        <EmptyState>Aucun quiz ne vous est assigné pour le moment.</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((q) => {
            const overdue = q.dueAt && new Date(q.dueAt) < new Date() && !q.passed;
            return (
              <Panel key={q.id} className="flex flex-col !p-4">
                <div className="mb-1 flex items-center gap-2">
                  {q.personal
                    ? <Chip tone="amber"><User className="h-3 w-3" /> Personnel</Chip>
                    : <Chip tone="blue"><Users2 className="h-3 w-3" /> Classe</Chip>}
                  {q.passed && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[color:var(--a-ok)]"><CheckCircle2 className="h-3.5 w-3.5" /> Validé</span>}
                </div>
                <h3 className="text-[15px] text-[color:var(--a-ink)]">{q.title}</h3>
                {q.description && <p className="mt-0.5 line-clamp-2 text-[12px] text-[color:var(--a-ink-dim)]">{q.description}</p>}
                <div className="mt-2 text-[11px] text-[color:var(--a-ink-dim)]">
                  {q.course} · {q.questionsCount} question(s) · seuil {q.passScore}%
                </div>
                {q.dueAt && (
                  <div className={`mt-1 flex items-center gap-1 text-[11px] ${overdue ? 'text-[color:var(--a-danger)]' : 'text-[color:var(--a-ink-dim)]'}`}>
                    <Clock className="h-3 w-3" /> Limite : {new Date(q.dueAt).toLocaleDateString('fr-FR')}
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-[11px] text-[color:var(--a-ink-soft)]">
                    {q.attempted ? `Meilleur : ${q.myBestScore}%` : 'Non commencé'}
                  </span>
                  <Btn size="sm" variant="primary" onClick={() => setActive(q)} disabled={!!overdue}>
                    {q.passed ? 'Refaire' : q.attempted ? 'Reprendre' : 'Commencer'}
                  </Btn>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
