import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, RotateCcw } from 'lucide-react';
import api from '../../services/api';

interface QuizQuestion {
  index: number;
  question: string;
  options: Record<string, string>;
}
interface QuizData {
  id: string;
  title: string;
  description?: string | null;
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
 * Quiz interactif — pris en charge :
 *  - quiz d'un chapitre  : passer `lessonId`  → GET /lessons/:id/quiz
 *  - quiz assigné (autonome) : passer `quizId` → GET /student/quizzes/:id
 * La soumission se fait toujours sur POST /lessons/quiz/:id/submit.
 */
export default function QuizRunner({
  lessonId,
  quizId,
  onPassed,
  onDone,
}: {
  lessonId?: string;
  quizId?: string;
  onPassed?: () => void;
  onDone?: (r: QuizResult) => void;
}) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const url = quizId ? `/student/quizzes/${quizId}` : `/lessons/${lessonId}/quiz`;
    api.get(url)
      .then((res) => { if (alive) setQuiz(res.data); })
      .catch((e) => { if (alive) setError(e?.response?.data?.message || 'Impossible de charger le quiz.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [lessonId, quizId]);

  if (loading) return <div className="py-4 text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement du quiz…</div>;
  if (error) return <p className="py-2 text-sm text-red-600">{error}</p>;
  if (!quiz) return <p className="py-2 text-sm text-gray-500">Aucun quiz.</p>;

  const allAnswered = quiz.questions.every((q) => answers[q.index]);

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/lessons/quiz/${quiz.id}/submit`, { answers });
      setResult(res.data);
      onDone?.(res.data);
      if (res.data.passed) onPassed?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission.');
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => { setResult(null); setAnswers({}); };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-gray-800">{quiz.title}</h4>
          {quiz.description && <p className="text-xs text-gray-500">{quiz.description}</p>}
        </div>
        <span className="text-xs text-gray-500">Seuil : {quiz.passScore}%</span>
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
            {quiz.questions.map((q) => {
              const letters = Object.keys(q.options);
              return (
                <li key={q.index}>
                  <p className="mb-2 font-medium text-gray-800">{q.index + 1}. {q.question}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {letters.map((letter) => (
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
              );
            })}
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
