import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp, Lock, CheckCircle, Play, FileText, HelpCircle } from 'lucide-react';
import api from '../../services/api';
import VideoPlayer from '../../components/learn/VideoPlayer';
import QuizRunner from '../../components/learn/QuizRunner';
import { parseLessonTitle } from '../../utils/parseLessonTitle';

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
      const current = res.data.find((e: any) => e.course.id === courseId);
      setCourseData(current || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Chargement…</div>;

  if (!courseData) {
    return (
      <div className="p-8 text-center">
        <h2 className="mb-4">Cours introuvable ou non inscrit</h2>
        <Link to="/learn/student" className="text-[#FFC107] hover:underline">Retour au tableau de bord</Link>
      </div>
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
    <div className="min-h-screen bg-[#FDFDFD] pb-16">
      {/* Banner */}
      <div className="bg-[#A8E6CF] px-6 py-10 lg:px-12 mx-4 mt-4 rounded-[2rem] shadow-sm">
        <button onClick={() => navigate('/learn/student')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm hover:scale-105 transition-transform">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-3xl lg:text-4xl font-extrabold mb-3 text-[#1A1A1A]">{course.title}</h1>
        <p className="text-[#1A1A1A]/80 mb-6 max-w-2xl font-medium leading-relaxed">{course.description}</p>
        <div className="max-w-md">
          <div className="flex justify-between text-xs font-bold mb-2 text-[#1A1A1A]">
            <span>Progrès</span><span>{progressRate}%</span>
          </div>
          <div className="w-full bg-[#1A1A1A]/10 rounded-full h-2">
            <div className="bg-[#1A1A1A] h-2 rounded-full transition-all duration-500" style={{ width: `${progressRate}%` }} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 lg:px-12 mt-10">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Contenu du cours</h2>
          <span className="text-sm text-gray-500 font-medium">{lessons.length} chapitres</span>
        </div>

        <div className="space-y-4">
          {lessons.map((lesson, index) => {
            const locked = !!lesson.locked;
            const parsed = parseLessonTitle(lesson.title);
            const isOpen = expanded === lesson.id;
            const hasVideo = lesson.videoProvider && lesson.videoProvider !== 'none';
            const canManualComplete = !locked && !lesson.isCompleted && !hasVideo && !lesson.hasQuiz;

            return (
              <div key={lesson.id} className={`bg-white border rounded-2xl shadow-sm transition-all ${locked ? 'border-gray-100 opacity-90' : 'border-gray-200'}`}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => setExpanded(isOpen ? null : lesson.id)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${lesson.isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                      {lesson.isCompleted ? <CheckCircle className="w-5 h-5" /> : (parsed.number ?? index + 1)}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-bold text-[15px] truncate ${locked ? 'text-gray-400' : 'text-gray-900'}`}>{parsed.title}</h3>
                      <p className="text-xs font-medium text-gray-400 flex items-center gap-2 mt-0.5">
                        {hasVideo && <span className="inline-flex items-center gap-1"><Play className="w-3 h-3" /> Vidéo</span>}
                        {lesson.hasQuiz && <span className="inline-flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Quiz</span>}
                        {lesson.documentUrl && <span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" /> Document</span>}
                        {!hasVideo && !lesson.hasQuiz && !lesson.documentUrl && 'Lecture'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {locked
                      ? <Lock className="w-4 h-4 text-gray-400" />
                      : isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </div>
                </button>

                {locked && (
                  <p className="px-5 pb-4 -mt-1 text-xs text-amber-700 bg-amber-50/60 rounded-b-2xl py-2">
                    {lesson.lockReason || "Non disponible à moins que l'activité précédente soit marquée comme achevée"}
                  </p>
                )}

                {!locked && isOpen && (
                  <div className="px-5 pb-6 space-y-5 border-t border-gray-100 pt-5">
                    {hasVideo && (
                      <VideoPlayer
                        lessonId={lesson.id}
                        provider={lesson.videoProvider}
                        embedUrl={lesson.videoEmbedUrl}
                        onCompleted={fetchData}
                      />
                    )}

                    {lesson.documentUrl && (
                      <a
                        href={lesson.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                      >
                        <FileText className="w-4 h-4" /> Ouvrir le document
                      </a>
                    )}

                    {lesson.hasQuiz && <QuizRunner lessonId={lesson.id} onPassed={fetchData} />}

                    {canManualComplete && (
                      <button
                        onClick={() => markComplete(lesson.id, true)}
                        disabled={toggling}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#FFC107] px-4 py-2 text-sm font-bold text-[#1A1A2E] hover:bg-yellow-400 disabled:opacity-60"
                      >
                        <CheckCircle className="w-4 h-4" /> Marquer ce chapitre comme terminé
                      </button>
                    )}

                    {lesson.isCompleted && (
                      <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
                        <CheckCircle className="w-4 h-4" /> Chapitre terminé
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
