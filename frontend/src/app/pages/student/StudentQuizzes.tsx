import { useEffect, useState, useCallback } from 'react';
import { ClipboardList, CheckCircle2, Clock, User, Users2 } from 'lucide-react';
import api from '../../services/api';
import QuizRunner from '../../components/learn/QuizRunner';

interface QuizItem {
  id: string; title: string; description: string | null; passScore: number; dueAt: string | null;
  questionsCount: number; personal: boolean; course: string; classroom: string;
  myBestScore: number | null; passed: boolean; attempted: boolean;
}

export default function StudentQuizzes() {
  const [items, setItems] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<QuizItem | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/student/quizzes');
      setItems(r.data ?? []);
    } catch {
      setErr('Impossible de charger vos quiz.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[#1A1A2E]">
          <ClipboardList className="h-6 w-6 text-[#FFC107]" /> Mes quiz
        </h1>
        <p className="mt-1 text-sm text-gray-500">Quiz assignés par vos formateurs (à toute la classe ou à vous personnellement).</p>
      </div>

      {err && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{err}</div>}

      {active ? (
        <div className="mx-auto max-w-2xl">
          <button onClick={() => { setActive(null); load(); }} className="mb-3 text-sm text-gray-500 hover:text-gray-800">← Retour à la liste</button>
          <QuizRunner quizId={active.id} onDone={() => load()} />
        </div>
      ) : loading ? (
        <div className="text-sm text-gray-400">Chargement…</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
          Aucun quiz ne vous est assigné pour le moment.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((q) => {
            const overdue = q.dueAt && new Date(q.dueAt) < new Date() && !q.passed;
            return (
              <div key={q.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-1 flex items-center gap-2">
                  {q.personal
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700"><User className="h-3 w-3" /> Personnel</span>
                    : <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700"><Users2 className="h-3 w-3" /> Classe</span>}
                  {q.passed && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> Validé</span>}
                </div>
                <h3 className="font-bold text-gray-900">{q.title}</h3>
                {q.description && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{q.description}</p>}
                <div className="mt-2 text-xs text-gray-400">
                  {q.course} · {q.questionsCount} question(s) · seuil {q.passScore}%
                </div>
                {q.dueAt && (
                  <div className={`mt-1 flex items-center gap-1 text-xs ${overdue ? 'text-red-600' : 'text-gray-400'}`}>
                    <Clock className="h-3 w-3" /> Limite : {new Date(q.dueAt).toLocaleDateString('fr-FR')}
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {q.attempted ? `Meilleur : ${q.myBestScore}%` : 'Non commencé'}
                  </span>
                  <button
                    onClick={() => setActive(q)}
                    disabled={!!overdue}
                    className="rounded-lg bg-[#FFC107] px-3 py-1.5 text-xs font-bold text-[#1A1A2E] hover:bg-yellow-400 disabled:opacity-50"
                  >
                    {q.passed ? 'Refaire' : q.attempted ? 'Reprendre' : 'Commencer'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
