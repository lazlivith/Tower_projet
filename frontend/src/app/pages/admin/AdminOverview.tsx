import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users2, GraduationCap, Wallet, TrendingUp, AlertTriangle, PlayCircle,
  UserPlus, FolderKanban, Newspaper, FileSignature,
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Panel, PanelTitle, StatCard, Chip, EmptyState, Btn } from '../../components/admin/ui';

interface Overview {
  users: { total: number; students: number; instructors: number; managers: number };
  academy: { totalCourses: number; publishedCourses: number; totalClassrooms: number; classroomsNoInstructor: number; totalLessons: number; lessonsWithVideo: number };
  enrollments: { active: number; suspended: number; completed: number; total: number };
  revenue: { total: number; month: number; currency: string };
  vitrine: { publications: number; projects: number; pendingQuotes: number };
  recent: {
    users: { id: string; nom: string; email: string; role: string; isActive: boolean; createdAt: string }[];
    payments: { id: string; amount: number; method: string; status: string; createdAt: string; student: string; course: string }[];
    enrollments: { id: string; status: string; createdAt: string; student: string; course: string }[];
  };
}

const money = (n: number) => `${Number(n).toLocaleString('fr-FR')} MAD`;
const when = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const roleChip = (r: string) =>
  r === 'MANAGER' ? <Chip tone="amber">Admin</Chip> : r === 'INSTRUCTOR' ? <Chip tone="blue">Prof</Chip> : <Chip tone="gray">Élève</Chip>;

const statusChip = (s: string) =>
  s === 'ACTIVE' ? <Chip tone="green">Actif</Chip> : s === 'SUSPENDED' ? <Chip tone="red">Bloqué</Chip> : <Chip tone="gray">{s}</Chip>;

export default function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/admin/overview')
      .then((r) => setData(r.data))
      .catch(() => setErr("Impossible de charger le suivi global."));
  }, []);

  if (err) return <EmptyState>{err}</EmptyState>;
  if (!data) return <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement du suivi…</div>;

  const { users, academy, enrollments, revenue, vitrine, recent } = data;
  const payRate = enrollments.total ? Math.round((enrollments.active / enrollments.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Pilotage"
        title="Vue d'ensemble"
        description="Suivi global de la plateforme : communauté, académie, revenus et contenu vitrine."
        actions={
          <>
            <Link to="/learn/admin/instructors"><Btn variant="ghost"><UserPlus className="h-4 w-4" /> Instructeur</Btn></Link>
            <Link to="/learn/admin/courses"><Btn variant="primary"><GraduationCap className="h-4 w-4" /> Nouvelle formation</Btn></Link>
          </>
        }
      />

      {/* KPI principaux */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard tone="accent" icon={<Users2 className="h-5 w-5" />} value={users.total}
          label="Utilisateurs" hint={`${users.students} élèves · ${users.instructors} profs · ${users.managers} admin`} />
        <StatCard tone="amber" icon={<Wallet className="h-5 w-5" />} value={money(revenue.month)}
          label="Revenus ce mois" hint={`Total encaissé : ${money(revenue.total)}`} />
        <StatCard tone="ok" icon={<TrendingUp className="h-5 w-5" />} value={`${payRate}%`}
          label="Taux d'activation" hint={`${enrollments.active} accès actifs / ${enrollments.total} inscriptions`} />
        <StatCard tone={enrollments.suspended ? 'danger' : 'accent'} icon={<AlertTriangle className="h-5 w-5" />}
          value={enrollments.suspended} label="Accès à débloquer" hint="Inscriptions en attente de paiement" />
      </div>

      {/* Entonnoir + académie */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-1">
          <PanelTitle>Entonnoir d'inscription</PanelTitle>
          <Funnel label="Comptes élèves" value={users.students} max={users.students || 1} tone="var(--a-ink-soft)" />
          <Funnel label="Inscriptions formation" value={enrollments.total} max={users.students || 1} tone="var(--a-accent)" />
          <Funnel label="Accès actifs (payés)" value={enrollments.active} max={users.students || 1} tone="var(--a-ok)" />
          <Funnel label="Formations terminées" value={enrollments.completed} max={users.students || 1} tone="var(--a-accent-2)" />
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelTitle right={<Link to="/learn/admin/academy" className="a-link text-[12px]">Gérer →</Link>}>Académie</PanelTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniStat icon={<GraduationCap className="h-4 w-4" />} value={academy.totalCourses} label="Formations" sub={`${academy.publishedCourses} publiées`} />
            <MiniStat icon={<FolderKanban className="h-4 w-4" />} value={academy.totalClassrooms} label="Classes en ligne" sub={`${academy.classroomsNoInstructor} sans prof`} warn={academy.classroomsNoInstructor > 0} />
            <MiniStat icon={<PlayCircle className="h-4 w-4" />} value={academy.totalLessons} label="Leçons" sub={`${academy.lessonsWithVideo} avec vidéo`} />
            <MiniStat icon={<Users2 className="h-4 w-4" />} value={users.instructors} label="Instructeurs" />
            <MiniStat icon={<Newspaper className="h-4 w-4" />} value={vitrine.publications} label="Publications" />
            <MiniStat icon={<FileSignature className="h-4 w-4" />} value={vitrine.pendingQuotes} label="Devis en attente" warn={vitrine.pendingQuotes > 0} />
          </div>
          {academy.classroomsNoInstructor > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-[color:color-mix(in_srgb,var(--a-accent-2)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--a-accent-2)_10%,transparent)] px-3 py-2 text-[12.5px] text-[color:var(--a-accent-2)]">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {academy.classroomsNoInstructor} classe(s) sans formateur assigné.
              <Link to="/learn/admin/academy" className="ml-auto underline">Assigner</Link>
            </div>
          )}
        </Panel>
      </div>

      {/* Activité récente */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel>
          <PanelTitle right={<Link to="/learn/admin/users" className="a-link text-[12px]">Tous →</Link>}>Nouveaux comptes</PanelTitle>
          {recent.users.length === 0 ? (
            <EmptyState>Aucun compte récent.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {recent.users.map((u) => (
                <li key={u.id} className="flex items-center gap-3 text-[13px]">
                  <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border border-[color:var(--a-line)] text-[12px] font-bold text-[color:var(--a-accent)]">
                    {u.nom?.charAt(0)?.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-[color:var(--a-ink)]">{u.nom}</div>
                    <div className="truncate text-[11px] text-[color:var(--a-ink-dim)]">{u.email}</div>
                  </div>
                  {roleChip(u.role)}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelTitle right={<Link to="/learn/admin/payments" className="a-link text-[12px]">Tous →</Link>}>Paiements récents</PanelTitle>
          {recent.payments.length === 0 ? (
            <EmptyState>Aucun paiement enregistré.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {recent.payments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 text-[13px]">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-[color:var(--a-ink)]">{p.student}</div>
                    <div className="truncate text-[11px] text-[color:var(--a-ink-dim)]">{p.course} · {when(p.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-[family-name:var(--font-display,inherit)] text-[color:var(--a-accent-2)]">{money(p.amount)}</div>
                    <div className="text-[10px] uppercase text-[color:var(--a-ink-dim)]">{p.status}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelTitle right={<Link to="/learn/admin/payments" className="a-link text-[12px]">Gérer →</Link>}>Inscriptions récentes</PanelTitle>
          {recent.enrollments.length === 0 ? (
            <EmptyState>Aucune inscription.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {recent.enrollments.map((e) => (
                <li key={e.id} className="flex items-center gap-3 text-[13px]">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-[color:var(--a-ink)]">{e.student}</div>
                    <div className="truncate text-[11px] text-[color:var(--a-ink-dim)]">{e.course} · {when(e.createdAt)}</div>
                  </div>
                  {statusChip(e.status)}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Funnel({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const pct = Math.max(3, Math.round((value / max) * 100));
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="text-[color:var(--a-ink-soft)]">{label}</span>
        <span className="font-semibold text-[color:var(--a-ink)]">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
      </div>
    </div>
  );
}

function MiniStat({
  icon, value, label, sub, warn,
}: { icon: React.ReactNode; value: React.ReactNode; label: string; sub?: string; warn?: boolean }) {
  return (
    <div className="a-card rounded-xl p-3">
      <div className="flex items-center gap-2 text-[color:var(--a-ink-dim)]">{icon}<span className="text-[11px] uppercase tracking-wide">{label}</span></div>
      <div className="mt-1.5 font-[family-name:var(--font-display,inherit)] text-xl font-semibold text-[color:var(--a-ink)]">{value}</div>
      {sub && <div className={`mt-0.5 text-[11px] ${warn ? 'text-[color:var(--a-accent-2)]' : 'text-[color:var(--a-ink-dim)]'}`}>{sub}</div>}
    </div>
  );
}
