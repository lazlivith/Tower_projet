import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Video } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Panel, Btn, Chip, EmptyState, ToastHost, type Toast } from '../../components/admin/ui';

interface Session {
  id: string; title: string; scheduledAt: string; duration: number | null;
  provider?: string | null; meetingUrl?: string | null;
  course?: { title: string } | null;
  instructor?: { nom: string } | null;
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function StudentCalendar() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selDay, setSelDay] = useState(ymd(new Date()));
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    api.get('/sessions/upcoming')
      .then((r) => setSessions(r.data ?? []))
      .catch(() => setToast({ kind: 'err', msg: 'Erreur de chargement des sessions.' }))
      .finally(() => setLoading(false));
  }, []);

  const byDay = useMemo(() => {
    const m: Record<string, Session[]> = {};
    for (const s of sessions) (m[ymd(new Date(s.scheduledAt))] ??= []).push(s);
    return m;
  }, [sessions]);

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const off = (first.getDay() + 6) % 7;
    const days: (Date | null)[] = Array.from({ length: off }, () => null);
    const dim = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) days.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [cursor]);

  const daySessions = (byDay[selDay] ?? []).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const todayKey = ymd(new Date());

  const join = async (s: Session) => {
    try {
      const r = await api.get(`/sessions/${s.id}/join`);
      const url = r.data?.url || r.data?.roomUrl || r.data?.joinUrl;
      if (url) window.open(url, '_blank', 'noopener');
      else setToast({ kind: 'err', msg: 'Lien de session indisponible.' });
    } catch {
      setToast({ kind: 'err', msg: 'Impossible de rejoindre la session.' });
    }
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader eyebrow="Apprenant" title="Sessions" description="Vos sessions en direct à venir." />

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[15px] font-semibold text-[color:var(--a-ink)]">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</div>
              <div className="flex gap-1.5">
                <Btn size="sm" variant="ghost" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft className="h-3.5 w-3.5" /></Btn>
                <Btn size="sm" variant="ghost" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); setSelDay(ymd(d)); }}>Aujourd'hui</Btn>
                <Btn size="sm" variant="ghost" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight className="h-3.5 w-3.5" /></Btn>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-[color:var(--a-ink-dim)]">
              {DAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {grid.map((d, i) => {
                if (!d) return <div key={i} />;
                const key = ymd(d);
                const items = byDay[key] ?? [];
                const isSel = key === selDay;
                return (
                  <button
                    key={key}
                    onClick={() => setSelDay(key)}
                    className={`min-h-[64px] rounded-lg border p-1.5 text-left transition-colors ${
                      isSel ? 'border-[color:var(--a-accent)] bg-[color:color-mix(in_srgb,var(--a-accent)_12%,transparent)]'
                        : 'border-[color:var(--a-line)] hover:border-[color:var(--a-accent)]/50'
                    }`}
                  >
                    <div className={`text-[12px] font-semibold ${key === todayKey ? 'text-[color:var(--a-accent-2)]' : 'text-[color:var(--a-ink-soft)]'}`}>{d.getDate()}</div>
                    <div className="mt-1 flex flex-col gap-0.5">
                      {items.slice(0, 2).map((s) => (
                        <span key={s.id} className="truncate rounded bg-[color:color-mix(in_srgb,var(--a-accent)_18%,transparent)] px-1 py-0.5 text-[10px] text-[color:var(--a-accent)]">
                          {new Date(s.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} {s.title}
                        </span>
                      ))}
                      {items.length > 2 && <span className="text-[10px] text-[color:var(--a-ink-dim)]">+{items.length - 2}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <div className="mb-3 text-[14px] font-semibold text-[color:var(--a-ink)]">
              {new Date(selDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            {daySessions.length === 0 ? (
              <EmptyState>Aucune session ce jour.</EmptyState>
            ) : (
              <div className="flex flex-col gap-2.5">
                {daySessions.map((s) => {
                  const start = new Date(s.scheduledAt);
                  const end = new Date(start.getTime() + (s.duration ?? 90) * 60000);
                  const now = new Date();
                  const live = now >= start && now <= end;
                  return (
                    <div key={s.id} className="a-card p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-[color:var(--a-ink)]">{s.title}</div>
                          <div className="text-[11px] text-[color:var(--a-ink-dim)]">
                            {s.course?.title ?? ''}{s.instructor?.nom ? ` · ${s.instructor.nom}` : ''}
                          </div>
                        </div>
                        {live ? <Chip tone="green">En cours</Chip> : <Chip tone="blue">{(s.provider || 'jitsi').toUpperCase()}</Chip>}
                      </div>
                      <div className="mt-1.5 text-[12px] text-[color:var(--a-ink-soft)]">
                        {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {s.duration ?? 90} min
                      </div>
                      <div className="mt-2.5">
                        <Btn size="sm" variant="primary" onClick={() => join(s)}><Video className="h-3.5 w-3.5" /> Rejoindre</Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      )}

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
