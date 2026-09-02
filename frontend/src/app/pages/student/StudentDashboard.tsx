import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, TrendingUp, CalendarDays, ClipboardList, Video, ArrowRight, GraduationCap,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader, Panel, PanelTitle, StatCard, EmptyState, Btn, Chip } from '../../components/ui';

interface Enrollment {
  enrollmentId: string;
  progressRate: number;
  course: {
    id: string; title: string; description: string; imageUrl: string | null;
    lessons: { id: string; isCompleted: boolean }[];
    upcomingLiveSessions: { id: string; title: string; scheduledAt: string; duration: number }[];
  };
  classroom: { id: string; name: string; instructor: { nom: string } | null } | null;
}

const when = (d: string) =>
  new Date(d).toLocaleString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [quizzesDue, setQuizzesDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/student/dashboard'),
      api.get('/student/quizzes').catch(() => ({ data: [] })),
    ])
      .then(([d, q]) => {
        setRows(d.data ?? []);
        setQuizzesDue((q.data ?? []).filter((x: any) => !x.passed).length);
      })
      .catch(() => setErr('Erreur lors du chargement de votre espace.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>;
  if (err) return <EmptyState>{err}</EmptyState>;

  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.progressRate, 0) / rows.length) : 0;
  const allSessions = rows
    .flatMap((r) => r.course.upcomingLiveSessions.map((s) => ({ ...s, course: r.course.title })))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        eyebrow="Apprenant"
        title={`Bonjour ${user?.nom?.split(' ')[0] ?? ''}`}
        description="Reprenez là où vous vous êtes arrêté."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard tone="accent" icon={<BookOpen className="h-5 w-5" />} value={rows.length} label="Formations actives" />
        <StatCard tone="ok" icon={<TrendingUp className="h-5 w-5" />} value={`${avg}%`} label="Progression moyenne" />
        <StatCard tone="amber" icon={<CalendarDays className="h-5 w-5" />} value={allSessions.length} label="Sessions à venir" />
        <StatCard tone={quizzesDue ? 'danger' : 'accent'} icon={<ClipboardList className="h-5 w-5" />} value={quizzesDue} label="Quiz à faire" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PanelTitle right={<Link to="/learn/student/courses" className="a-link text-[12px]">Tout voir →</Link>}>Mes formations</PanelTitle>
          {rows.length === 0 ? (
            <EmptyState>Aucune formation active. Contactez l'administration si vous avez déjà payé.</EmptyState>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {rows.map((r) => {
                const next = r.course.upcomingLiveSessions[0];
                return (
                  <button
                    key={r.enrollmentId}
                    onClick={() => navigate(`/learn/student/course/${r.course.id}`)}
                    className="a-card a-card-hover flex flex-col p-4 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Chip tone="blue">{r.classroom?.name ?? 'Classe'}</Chip>
                      <span className="text-[12px] font-semibold text-[color:var(--a-ink-soft)]">{r.progressRate}%</span>
                    </div>
                    <h3 className="mt-2 text-[15px] leading-snug text-[color:var(--a-ink)]">{r.course.title}</h3>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[color:var(--a-accent)]" style={{ width: `${r.progressRate}%` }} />
                    </div>
                    {r.classroom?.instructor && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[color:var(--a-ink-dim)]">
                        <GraduationCap className="h-3.5 w-3.5" /> {r.classroom.instructor.nom}
                      </div>
                    )}
                    {next && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[color:var(--a-accent-2)]">
                        <Video className="h-3.5 w-3.5" /> {next.title} · {when(next.scheduledAt)}
                      </div>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[color:var(--a-accent)]">
                      Continuer <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Panel>
          <PanelTitle right={<Link to="/learn/student/calendar" className="a-link text-[12px]">Calendrier →</Link>}>Prochaines sessions</PanelTitle>
          {allSessions.length === 0 ? (
            <EmptyState>Aucune session planifiée.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {allSessions.slice(0, 5).map((s) => (
                <li key={s.id} className="a-card flex items-center gap-3 p-3">
                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-[color:color-mix(in_srgb,var(--a-accent)_16%,transparent)] text-[color:var(--a-accent)]">
                    <Video className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-[color:var(--a-ink)]">{s.title}</div>
                    <div className="truncate text-[11px] text-[color:var(--a-ink-dim)]">{s.course} · {when(s.scheduledAt)}</div>
                  </div>
                  <Link to={`/learn/session/${s.id}`}><Btn size="sm" variant="primary">Rejoindre</Btn></Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
