import { useEffect, useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

interface Classroom {
  id: string;
  name: string;
  courseTitle: string;
  quizzesCount: number;
  lessons: { id: string; title: string; sequenceOrder: number }[];
}
interface Quiz {
  id: string;
  title: string;
  questions: { question: string; options: Record<string, string>; correctAnswer: string }[];
  lesson: { id: string; title: string } | null;
  _count: { attempts: number };
}

export default function InstructorQuizzes() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [title, setTitle] = useState('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; details?: string[] } | null>(null);
  const [preview, setPreview] = useState<Quiz['questions']>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = classrooms.find((c) => c.id === selectedId);

  useEffect(() => {
    api.get('/instructor/classrooms')
      .then((res) => {
        setClassrooms(res.data);
        if (res.data[0]) setSelectedId(res.data[0].id);
      })
      .catch(() => setFeedback({ type: 'error', message: 'Impossible de charger vos classes.' }));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLessonId('');
    api.get(`/instructor/classrooms/${selectedId}/quizzes`)
      .then((res) => setQuizzes(res.data))
      .catch(() => setQuizzes([]));
  }, [selectedId]);

  const refreshQuizzes = () =>
    api.get(`/instructor/classrooms/${selectedId}/quizzes`).then((res) => setQuizzes(res.data)).catch(() => {});

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setFeedback({ type: 'error', message: 'Sélectionnez un fichier .xlsx.' });

    const form = new FormData();
    form.append('file', file);
    form.append('classroomId', selectedId);
    if (lessonId) form.append('lessonId', lessonId);
    if (title.trim()) form.append('title', title.trim());

    setUploading(true);
    setFeedback(null);
    setPreview([]);
    try {
      const res = await api.post('/instructor/quizzes/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeedback({ type: 'success', message: res.data.message });
      setPreview(res.data.quiz.questions || []);
      setTitle('');
      if (fileRef.current) fileRef.current.value = '';
      refreshQuizzes();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || "Échec de l'import.",
        details: err.response?.data?.details,
      });
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Supprimer ce quiz ?')) return;
    await api.delete(`/instructor/quizzes/${id}`);
    refreshQuizzes();
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-1">Quiz — Import Excel</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Fichier <code className="bg-gray-100 px-1 rounded">.xlsx</code> avec les colonnes :
        <strong> Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer</strong> (A/B/C/D).
      </p>

      {classrooms.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> Aucune classe ne vous est assignée pour le moment.
        </div>
      ) : (
        <>
          <form onSubmit={handleUpload} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Classe</label>
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#FFC107]">
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.courseTitle}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chapitre associé (optionnel)</label>
                <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#FFC107]">
                  <option value="">— Aucun (quiz de classe) —</option>
                  {selected?.lessons.map((l) => (
                    <option key={l.id} value={l.id}>{l.sequenceOrder}. {l.title}</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">Un quiz lié à un chapitre le débloque automatiquement s'il est réussi.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre du quiz (optionnel)</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#FFC107]" placeholder="Quiz — chapitre 2" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fichier Excel</label>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#1A1A2E] file:px-4 file:py-2 file:text-white file:font-semibold hover:file:bg-[#26264a]" />
            </div>

            <button type="submit" disabled={uploading} className="inline-flex items-center gap-2 rounded-xl bg-[#FFC107] px-5 py-2.5 font-bold text-[#1A1A2E] hover:bg-yellow-400 disabled:opacity-60">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              Importer le quiz
            </button>
          </form>

          {feedback && (
            <div className={`mt-4 rounded-xl p-4 text-sm ${feedback.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              <div className="flex items-center gap-2 font-semibold">
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {feedback.message}
              </div>
              {feedback.details && (
                <ul className="mt-2 list-disc pl-5 space-y-0.5">
                  {feedback.details.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              )}
            </div>
          )}

          {preview.length > 0 && (
            <div className="mt-6">
              <h2 className="font-bold text-gray-800 mb-3">Prévisualisation ({preview.length} questions)</h2>
              <ol className="space-y-3">
                {preview.map((q, i) => (
                  <li key={i} className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="font-medium text-gray-800 mb-2">{i + 1}. {q.question}</p>
                    <div className="grid sm:grid-cols-2 gap-1.5 text-sm">
                      {(['A', 'B', 'C', 'D'] as const).map((l) => (
                        <span key={l} className={`rounded-lg px-2.5 py-1.5 ${q.correctAnswer === l ? 'bg-green-100 text-green-800 font-semibold' : 'bg-gray-50 text-gray-600'}`}>
                          {l}. {q.options[l]}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-8">
            <h2 className="font-bold text-gray-800 mb-3">Quiz de cette classe ({quizzes.length})</h2>
            {quizzes.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun quiz importé pour cette classe.</p>
            ) : (
              <div className="space-y-2">
                {quizzes.map((q) => (
                  <div key={q.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{q.title}</div>
                        <div className="text-xs text-gray-400">
                          {q.questions.length} questions · {q._count.attempts} tentative(s)
                          {q.lesson ? ` · chapitre : ${q.lesson.title}` : ''}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => remove(q.id)} className="text-gray-400 hover:text-red-600 p-1.5" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
