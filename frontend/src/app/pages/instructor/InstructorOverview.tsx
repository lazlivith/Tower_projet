import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users2, GraduationCap, PlayCircle, CalendarDays, ClipboardCheck, MessagesSquare, Video,
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Panel, PanelTitle, StatCard, EmptyState, Btn } from '../../components/ui';

interface Overview {
  kpis: {
    classes: number; courses: number; activeStudents: number; lessons: number;
    upcomingSessions: number; pendingSubmissions: number; classMessages: number;
  };
  classes: { id: string; name: string; courseId: string; courseTitle: string; students: number }[];
  upcomingSessions: {
    id: string; title: string; scheduledAt: string; duration: number | null;
    provider?: string | null; meetingUrl?: string | null; course: { title: string };
  }[];
  recentMessages: { id: string; body: string; author: string; role: string; classroom: string; createdAt: string }[];
}

const when = (d: string) =>
  new Date(d).toLocaleString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function InstructorOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.get('/instructor/overview').then((r) => setData(r.data)).catch(() => setErr("Impossible de charger votre espace."));
  }, []);

  if (err) return <EmptyState>{err}</EmptyState>;
  if (!data) return <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>;

  const k = data.kpis;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        eyebrow="Formateur"
        title="Tableau de bord"
        description="Suivez vos classes, votre contenu et vos sessions."
        actions={
          <>
            <Link to="/learn/instructor/content"><Btn variant="ghost"><PlayCircle className="h-4 w-4" /> Ajouter du contenu</Btn></Link>
            <Link to="/learn/instructor/calendar"><Btn variant="primary"><CalendarDays className="h-4 w-4" /> Planifier une session</Btn></Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard tone="accent" icon={<Users2 className="h-5 w-5" />} value={k.activeStudents} label="Élèves actifs" hint={`${k.classes} classe(s) · ${k.courses} formation(s)`} />
        <StatCard tone="amber" icon={<PlayCircle className="h-5 w-5" />} value={k.lessons} label="Leçons publiées" />
        <StatCard tone="ok" icon={<CalendarDays className="h-5 w-5" />} value={k.upcomingSessions} label="Sessions à venir" />
        <StatCard tone={k.pendingSubmissions ? 'danger' : 'accent'} icon={<ClipboardCheck className="h-5 w-5" />} value={k.pendingSubmissions} label="Devoirs à corriger" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelTitle right={<Link to="/learn/instructor/calendar" className="a-link text-[12px]">Calendrier →</Link>}>Prochaines sessions</PanelTitle>
          {data.upcomingSessions.length === 0 ? (
            <EmptyState>Aucune session planifiée.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {data.upcomingSessions.map((s) => (
                <li key={s.id} className="a-card flex items-center gap-3 p-3.5">
                  <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-[color:color-mix(in_srgb,var(--a-accent)_16%,transparent)] text-[color:var(--a-accent)]">
                    <Video className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-[color:var(--a-ink)]">{s.title}</div>
                    <div className="truncate text-[11px] text-[color:var(--a-ink-dim)]">
                      {s.course.title} · {when(s.scheduledAt)} · {s.duration ?? 120} min
                    </div>
                  </div>
                  <span className="a-chip a-chip-blue">{(s.provider || 'jitsi').toUpperCase()}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelTitle right={<Link to="/learn/instructor/board" className="a-link text-[12px]">Ouvrir →</Link>}>
            <span className="inline-flex items-center gap-1.5"><MessagesSquare className="h-4 w-4" /> Espace de classe</span>
          </PanelTitle>
          {data.recentMessages.length === 0 ? (
            <EmptyState>Aucun message pour l'instant.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {data.recentMessages.map((m) => (
                <li key={m.id} className="text-[13px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[color:var(--a-ink)]">{m.author}</span>
                    <span className="text-[10px] text-[color:var(--a-ink-dim)]">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="line-clamp-2 text-[color:var(--a-ink-soft)]">{m.body}</p>
                  <span className="text-[10px] uppercase tracking-wide text-[color:var(--a-ink-dim)]">{m.classroom}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="mt-4">
        <PanelTitle right={<Link to="/learn/instructor/classes" className="a-link text-[12px]">Détail →</Link>}>Mes classes</PanelTitle>
        {data.classes.length === 0 ? (
          <EmptyState>Aucune classe assignée. Contactez l'administration.</EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.classes.map((c) => (
              <Link key={c.id} to="/learn/instructor/classes" className="a-card a-card-hover p-4">
                <div className="flex items-center gap-2 text-[color:var(--a-ink-dim)]"><GraduationCap className="h-4 w-4" /><span className="text-[11px] uppercase tracking-wide">{c.courseTitle}</span></div>
                <div className="mt-1.5 font-semibold text-[color:var(--a-ink)]">{c.name}</div>
                <div className="mt-1 text-[12px] text-[color:var(--a-ink-dim)]">{c.students} élève(s)</div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
