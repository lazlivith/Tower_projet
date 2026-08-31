import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, RotateCcw } from 'lucide-react';
import api from '../../services/api';

interface QuizQuestion {
  index: number;
  question: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
}
interface QuizData {
  id: string;
  title: string;
  passScore: number;
  questions: QuizQuestion[];
}
interface QuizResult {
  score: number;
  passed: boolean;
  correct: number;
  total: number;
  lessonCompleted: boolean;
}

/**
 * Quiz interactif d'un chapitre : charge le quiz de la leçon, collecte les réponses,
 * soumet à `/lessons/quiz/:id/submit`. Si réussi, le chapitre est marqué achevé côté serveur.
 */
export default function QuizRunner({ lessonId, onPassed }: { lessonId: string; onPassed?: () => void }) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.get(`/lessons/${lessonId}/quiz`)
      .then((res) => { if (alive) setQuiz(res.data); })
      .catch(() => { if (alive) setError("Impossible de charger le quiz."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [lessonId]);

  if (loading) return <div className="py-4 text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement du quiz…</div>;
  if (error) return <p className="py-2 text-sm text-red-600">{error}</p>;
  if (!quiz) return null;

  const allAnswered = quiz.questions.every((q) => answers[q.index]);

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/lessons/quiz/${quiz.id}/submit`, { answers });
      setResult(res.data);
      if (res.data.passed) onPassed?.();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la soumission.");
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => { setResult(null); setAnswers({}); };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-bold text-gray-800">{quiz.title}</h4>
        <span className="text-xs text-gray-500">Seuil de réussite : {quiz.passScore}%</span>
      </div>

      {result ? (
        <div className="text-center py-4">
          <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}>
            {result.passed ? <CheckCircle2 className="h-7 w-7 text-green-600" /> : <XCircle className="h-7 w-7 text-red-500" />}
          </div>
          <p className="text-lg font-bold text-gray-900">{result.score}%</p>
          <p className="text-sm text-gray-500">{result.correct} / {result.total} bonnes réponses</p>
          <p className={`mt-2 text-sm font-semibold ${result.passed ? 'text-green-700' : 'text-red-600'}`}>
            {result.passed
              ? (result.lessonCompleted ? 'Quiz réussi — chapitre validé ✅' : 'Quiz réussi ✅')
              : 'Quiz non validé — réessayez'}
          </p>
          {!result.passed && (
            <button onClick={retry} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#26264a]">
              <RotateCcw className="h-4 w-4" /> Recommencer
            </button>
          )}
        </div>
      ) : (
        <>
          <ol className="space-y-5">
            {quiz.questions.map((q) => (
              <li key={q.index}>
                <p className="mb-2 font-medium text-gray-800">{q.index + 1}. {q.question}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                    <label
                      key={letter}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        answers[q.index] === letter ? 'border-[#FFC107] bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.index}`}
                        className="accent-[#FFB300]"
                        checked={answers[q.index] === letter}
                        onChange={() => setAnswers((a) => ({ ...a, [q.index]: letter }))}
                      />
                      <span className="font-semibold text-gray-500">{letter}.</span> {q.options[letter]}
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            onClick={submit}
            disabled={!allAnswered || submitting}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#FFC107] px-5 py-2.5 text-sm font-bold text-[#1A1A2E] hover:bg-yellow-400 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Valider mes réponses
          </button>
        </>
      )}
    </div>
  );
}
