import { useEffect, useState, useCallback, useRef } from 'react';
import {
  UploadCloud, FileSpreadsheet, Loader2, Trash2, Download, BarChart3, Users2, User, Plus,
} from 'lucide-react';
import api from '../../services/api';
import {
  PageHeader, Panel, PanelTitle, Btn, Chip, Field, Input, Select, Textarea, Modal,
  EmptyState, Tabs, DataTable, ToastHost, type Toast,
} from '../../components/admin/ui';
import QuizBuilder, { toApiQuestions, isBuilderValid } from '../../components/shell/QuizBuilder';

interface Classroom {
  id: string; name: string; courseId: string; courseTitle: string;
  lessons: { id: string; title: string; sequenceOrder: number }[];
}
interface QuizRow {
  id: string; title: string; description: string | null; passScore: number; dueAt: string | null;
  lesson: { id: string; title: string } | null;
  assignedTo: { id: string; nom: string } | null;
  questionsCount: number; attempts: number; createdAt: string;
}
interface ResultData {
  quiz: { title: string; passScore: number; questionsCount: number };
  summary: { cohort: number; started: number; passed: number; avgScore: number | null };
  rows: { studentId: string; nom: string; status: string; bestScore: number | null; attempts: number; lastAt: string | null }[];
}

const emptyMeta = { title: '', description: '', passScore: 70, lessonId: '', assignedToId: '', dueAt: '' };

export default function InstructorQuizzes() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selId, setSelId] = useState('');
  const [students, setStudents] = useState<{ id: string; nom: string }[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  const [tab, setTab] = useState<'import' | 'compose'>('import');
  const [meta, setMeta] = useState({ ...emptyMeta });
  const [builderRows, setBuilderRows] = useState<{ q: string; opts: string[]; correct: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [results, setResults] = useState<ResultData | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  const flash = (kind: Toast['kind'], msg: string) => setToast({ kind, msg });
  const selected = classrooms.find((c) => c.id === selId);

  const loadClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/instructor/classrooms');
      setClassrooms(r.data ?? []);
      setSelId((p) => p || r.data?.[0]?.id || '');
    } catch {
      flash('err', 'Impossible de charger vos classes.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { loadClassrooms(); }, [loadClassrooms]);

  const refreshQuizzes = useCallback((cid: string) => {
    api.get(`/instructor/classrooms/${cid}/quizzes`).then((r) => setQuizzes(r.data ?? [])).catch(() => setQuizzes([]));
  }, []);

  useEffect(() => {
    if (!selId || !selected) return;
    setMeta({ ...emptyMeta });
    refreshQuizzes(selId);
    api.get(`/instructor/courses/${selected.courseId}/students`)
      .then((r) => setStudents((r.data ?? []).map((s: any) => ({ id: s.id, nom: s.nom }))))
      .catch(() => setStudents([]));
  }, [selId, selected, refreshQuizzes]);

  const commonFields = () => {
    const f: Record<string, string> = {};
    if (meta.lessonId) f.lessonId = meta.lessonId;
    if (meta.assignedToId) f.assignedToId = meta.assignedToId;
    if (meta.dueAt) f.dueAt = new Date(meta.dueAt).toISOString();
    return f;
  };

  const downloadTemplate = async () => {
    try {
      const r = await api.get('/instructor/quizzes/template.xlsx', { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modele-quiz-tower.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      flash('err', 'Téléchargement du modèle impossible.');
    }
  };

  const submitImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return flash('err', 'Sélectionnez un fichier .xlsx ou .csv.');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('classroomId', selId);
    if (meta.title.trim()) fd.append('title', meta.title.trim());
    if (meta.description.trim()) fd.append('description', meta.description.trim());
    fd.append('passScore', String(meta.passScore));
    Object.entries(commonFields()).forEach(([k, v]) => fd.append(k, v));
    setBusy(true);
    try {
      const r = await api.post('/instructor/quizzes/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      flash('ok', r.data.message);
      if (fileRef.current) fileRef.current.value = '';
      setMeta({ ...emptyMeta });
      refreshQuizzes(selId);
    } catch (err: any) {
      const d = err?.response?.data;
      flash('err', (d?.details?.length ? d.details.join(' · ') : d?.message) || "Échec de l'import.");
    } finally {
      setBusy(false);
    }
  };

  const submitCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBuilderValid(builderRows)) return flash('err', 'Chaque question doit avoir un intitulé, ≥ 2 options et une bonne réponse.');
    setBusy(true);
    try {
      const r = await api.post(`/instructor/classrooms/${selId}/quizzes`, {
        title: meta.title.trim() || 'Quiz',
        description: meta.description.trim() || undefined,
        passScore: meta.passScore,
        questions: toApiQuestions(builderRows),
        ...commonFields(),
      });
      flash('ok', r.data.message);
      setMeta({ ...emptyMeta });
      setBuilderRows([]);
      refreshQuizzes(selId);
    } catch (err: any) {
      flash('err', err?.response?.data?.message || 'Échec de la création.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Supprimer ce quiz ?')) return;
    await api.delete(`/instructor/quizzes/${id}`).catch(() => flash('err', 'Suppression impossible.'));
    refreshQuizzes(selId);
  };

  const openResults = async (id: string) => {
    setLoadingResults(true);
    setResults({ quiz: { title: '', passScore: 0, questionsCount: 0 }, summary: { cohort: 0, started: 0, passed: 0, avgScore: null }, rows: [] });
    try {
      const r = await api.get(`/instructor/quizzes/${id}/results`);
      setResults(r.data);
    } catch {
      flash('err', 'Impossible de charger les résultats.');
      setResults(null);
    } finally {
      setLoadingResults(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        eyebrow="Formateur"
        title="Quiz"
        description="Créez un quiz pour toute la classe ou pour un élève précis — par import de fichier ou avec le composeur."
        actions={<Btn variant="ghost" onClick={downloadTemplate}><Download className="h-4 w-4" /> Modèle .xlsx</Btn>}
      />

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : classrooms.length === 0 ? (
        <EmptyState>Aucune classe ne vous est assignée.</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          {/* Création */}
          <Panel>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Select value={selId} onChange={(e) => setSelId(e.target.value)} className="!w-auto">
                {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.courseTitle}</option>)}
              </Select>
              <Tabs active={tab} onChange={setTab} tabs={[{ id: 'import' as const, label: 'Importer un fichier' }, { id: 'compose' as const, label: 'Composer' }]} />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <Field label="Titre"><Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} placeholder="Quiz — chapitre 2" /></Field>
              <Field label="Seuil de réussite (%)"><Input type="number" min={1} max={100} value={meta.passScore} onChange={(e) => setMeta({ ...meta, passScore: Number(e.target.value) })} /></Field>
              <Field label="Chapitre associé (optionnel)" hint="Un quiz lié à un chapitre le débloque s'il est réussi.">
                <Select value={meta.lessonId} onChange={(e) => setMeta({ ...meta, lessonId: e.target.value })}>
                  <option value="">— Aucun (quiz autonome) —</option>
                  {selected?.lessons.map((l) => <option key={l.id} value={l.id}>{l.sequenceOrder}. {l.title}</option>)}
                </Select>
              </Field>
              <Field label="Date limite (optionnel)"><Input type="datetime-local" value={meta.dueAt} onChange={(e) => setMeta({ ...meta, dueAt: e.target.value })} /></Field>
              <Field label="Destinataire" className="col-span-2">
                <Select value={meta.assignedToId} onChange={(e) => setMeta({ ...meta, assignedToId: e.target.value })}>
                  <option value="">Toute la classe</option>
                  {students.map((s) => <option key={s.id} value={s.id}>Un élève : {s.nom}</option>)}
                </Select>
              </Field>
            </div>

            {tab === 'import' ? (
              <form onSubmit={submitImport} className="flex flex-col gap-3">
                <Field label="Fichier (.xlsx, .xls ou .csv)" hint="Colonnes : Question · OptionA…OptionF (2 à 6) · CorrectAnswer (A–F) · PassScore (optionnel).">
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="block w-full text-[13px] text-[color:var(--a-ink-soft)] file:mr-3 file:rounded-lg file:border-0 file:bg-[color:var(--a-accent)] file:px-3 file:py-1.5 file:text-black file:font-semibold" />
                </Field>
                <Btn variant="primary" type="submit" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Importer le quiz
                </Btn>
              </form>
            ) : (
              <form onSubmit={submitCompose} className="flex flex-col gap-3">
                <Textarea rows={2} placeholder="Description / consigne (optionnel)" value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} className="a-textarea" />
                <QuizBuilder value={builderRows} onChange={setBuilderRows} />
                <Btn variant="primary" type="submit" disabled={busy || !isBuilderValid(builderRows)}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Créer le quiz ({builderRows.length} question{builderRows.length > 1 ? 's' : ''})
                </Btn>
              </form>
            )}
          </Panel>

          {/* Liste */}
          <Panel>
            <PanelTitle>Quiz de cette classe ({quizzes.length})</PanelTitle>
            {quizzes.length === 0 ? (
              <EmptyState>Aucun quiz. Créez-en un via l'import ou le composeur.</EmptyState>
            ) : (
              <div className="flex flex-col gap-2">
                {quizzes.map((q) => (
                  <div key={q.id} className="a-card p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 flex-shrink-0 text-[color:var(--a-ok)]" />
                          <span className="truncate font-semibold text-[color:var(--a-ink)]">{q.title}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[color:var(--a-ink-dim)]">
                          {q.assignedTo
                            ? <Chip tone="amber"><User className="h-3 w-3" /> {q.assignedTo.nom}</Chip>
                            : <Chip tone="blue"><Users2 className="h-3 w-3" /> Toute la classe</Chip>}
                          {q.lesson && <Chip tone="gray">Chapitre : {q.lesson.title}</Chip>}
                          <span>{q.questionsCount} question(s) · seuil {q.passScore}% · {q.attempts} tentative(s)</span>
                          {q.dueAt && <span>· limite {new Date(q.dueAt).toLocaleDateString('fr-FR')}</span>}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 gap-1.5">
                        <Btn size="sm" variant="ghost" onClick={() => openResults(q.id)}><BarChart3 className="h-3.5 w-3.5" /> Résultats</Btn>
                        <Btn size="sm" variant="danger" onClick={() => remove(q.id)}><Trash2 className="h-3.5 w-3.5" /></Btn>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      <Modal open={!!results} onClose={() => setResults(null)} title={`Résultats — ${results?.quiz.title ?? ''}`} maxWidth={720}>
        {loadingResults || !results ? (
          <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-4 gap-3">
              <Mini label="Cohorte" value={results.summary.cohort} />
              <Mini label="Commencé" value={results.summary.started} />
              <Mini label="Réussi" value={results.summary.passed} tone="ok" />
              <Mini label="Score moy." value={results.summary.avgScore == null ? '—' : `${results.summary.avgScore}%`} />
            </div>
            <DataTable columns={['Élève', 'Statut', 'Meilleur score', 'Tentatives', 'Dernier essai']}>
              {results.rows.map((r) => (
                <tr key={r.studentId}>
                  <td className="a-td-strong">{r.nom}</td>
                  <td>
                    {r.status === 'PASSED' ? <Chip tone="green">Réussi</Chip>
                      : r.status === 'FAILED' ? <Chip tone="red">Échoué</Chip>
                      : <Chip tone="gray">Non commencé</Chip>}
                  </td>
                  <td>{r.bestScore == null ? '—' : `${r.bestScore}%`}</td>
                  <td>{r.attempts}</td>
                  <td>{r.lastAt ? new Date(r.lastAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                </tr>
              ))}
            </DataTable>
          </>
        )}
      </Modal>

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'ok' }) {
  return (
    <div className="a-card rounded-lg p-2.5 text-center">
      <div className={`font-[family-name:var(--font-display,inherit)] text-lg font-semibold ${tone === 'ok' ? 'text-[color:var(--a-ok)]' : 'text-[color:var(--a-ink)]'}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-[color:var(--a-ink-dim)]">{label}</div>
    </div>
  );
}
