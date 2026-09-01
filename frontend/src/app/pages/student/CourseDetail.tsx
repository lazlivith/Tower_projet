import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp, Lock, CheckCircle, Play, FileText, HelpCircle } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import VideoPlayer from '../../components/learn/VideoPlayer';
import QuizRunner from '../../components/learn/QuizRunner';
import { parseLessonTitle } from '../../utils/parseLessonTitle';
import { Panel, Btn, EmptyState } from '../../components/admin/ui';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/student/dashboard');
      setCourseData(res.data.find((e: any) => e.course.id === courseId) || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>;
  if (!courseData) {
    return (
      <EmptyState>
        Cours introuvable ou vous n'y êtes pas inscrit.
        <div className="mt-3"><Btn variant="ghost" onClick={() => navigate('/learn/student')}>Retour au tableau de bord</Btn></div>
      </EmptyState>
    );
  }

  const { course, progressRate } = courseData;
  const lessons: any[] = course.lessons;

  const markComplete = async (lessonId: string, next: boolean) => {
    if (toggling) return;
    setToggling(true);
    try {
      await api.patch(`/student/lessons/${lessonId}/toggle`, { isCompleted: next });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1000px]">
      <Panel className="mb-6">
        <button
          onClick={() => navigate('/learn/student')}
          className="mb-4 grid h-9 w-9 place-items-center rounded-full border border-[color:var(--a-line)] text-[color:var(--a-ink-soft)] transition-colors hover:border-[color:var(--a-accent)] hover:text-[color:var(--a-accent)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-[1.5rem] text-[color:var(--a-ink)]">{course.title}</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[color:var(--a-ink-soft)]">{course.description}</p>
        <div className="mt-4 max-w-md">
          <div className="mb-1.5 flex justify-between text-[12px] font-semibold text-[color:var(--a-ink-soft)]">
            <span>Progression</span><span>{progressRate}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[color:var(--a-accent)] transition-all duration-500" style={{ width: `${progressRate}%` }} />
          </div>
        </div>
      </Panel>

      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-[1.1rem] text-[color:var(--a-ink)]">Contenu du cours</h2>
        <span className="text-[12px] text-[color:var(--a-ink-dim)]">{lessons.length} chapitre(s)</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {lessons.map((lesson, index) => {
          const locked = !!lesson.locked;
          const parsed = parseLessonTitle(lesson.title);
          const isOpen = expanded === lesson.id;
          const hasVideo = lesson.videoProvider && lesson.videoProvider !== 'none';
          const canManualComplete = !locked && !lesson.isCompleted && !hasVideo && !lesson.hasQuiz;

          return (
            <div key={lesson.id} className={`a-card ${locked ? 'opacity-70' : ''}`}>
              <button
                type="button"
                disabled={locked}
                onClick={() => setExpanded(isOpen ? null : lesson.id)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left disabled:cursor-not-allowed"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-[13px] font-bold ${
                    lesson.isCompleted ? 'bg-[color:color-mix(in_srgb,var(--a-ok)_18%,transparent)] text-[color:var(--a-ok)]' : 'bg-white/5 text-[color:var(--a-ink-soft)]'
                  }`}>
                    {lesson.isCompleted ? <CheckCircle className="h-4 w-4" /> : (parsed.number ?? index + 1)}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`truncate text-[14px] font-semibold ${locked ? 'text-[color:var(--a-ink-dim)]' : 'text-[color:var(--a-ink)]'}`}>{parsed.title}</h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[color:var(--a-ink-dim)]">
                      {hasVideo && <span className="inline-flex items-center gap-1"><Play className="h-3 w-3" /> Vidéo</span>}
                      {lesson.hasQuiz && <span className="inline-flex items-center gap-1"><HelpCircle className="h-3 w-3" /> Quiz</span>}
                      {lesson.documentUrl && <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" /> Document</span>}
                      {!hasVideo && !lesson.hasQuiz && !lesson.documentUrl && 'Lecture'}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 text-[color:var(--a-ink-dim)]">
                  {locked ? <Lock className="h-4 w-4" /> : isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {locked && (
                <p className="border-t border-[color:var(--a-line-soft)] px-4 py-2 text-[11px] text-[color:var(--a-accent-2)]">
                  {lesson.lockReason || "Non disponible tant que l'activité précédente n'est pas achevée."}
                </p>
              )}

              {!locked && isOpen && (
                <div className="flex flex-col gap-5 border-t border-[color:var(--a-line-soft)] px-4 pb-6 pt-5">
                  {hasVideo && (
                    <VideoPlayer
                      lessonId={lesson.id}
                      provider={lesson.videoProvider}
                      embedUrl={lesson.videoEmbedUrl}
                      onCompleted={fetchData}
                    />
                  )}

                  {lesson.documentUrl && (
                    <a href={toAbsoluteUrl(lesson.documentUrl)} target="_blank" rel="noreferrer" className="a-btn a-btn-ghost self-start">
                      <FileText className="h-4 w-4" /> Ouvrir le document
                    </a>
                  )}

                  {lesson.hasQuiz && <QuizRunner lessonId={lesson.id} onPassed={fetchData} />}

                  {canManualComplete && (
                    <Btn variant="primary" onClick={() => markComplete(lesson.id, true)} disabled={toggling} className="self-start">
                      <CheckCircle className="h-4 w-4" /> Marquer ce chapitre comme terminé
                    </Btn>
                  )}

                  {lesson.isCompleted && (
                    <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--a-ok)]">
                      <CheckCircle className="h-4 w-4" /> Chapitre terminé
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {lessons.length === 0 && <EmptyState>Aucun chapitre publié pour l'instant.</EmptyState>}
      </div>
    </div>
  );
}
