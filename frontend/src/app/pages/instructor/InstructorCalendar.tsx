import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Trash2, Video, Loader2, Save, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import {
  PageHeader, Panel, Btn, Chip, Field, Input, Select, Textarea, Modal, EmptyState,
  ToastHost, type Toast,
} from '../../components/admin/ui';

interface Session {
  id: string; title: string; description: string | null; scheduledAt: string; duration: number | null;
  provider: string | null; meetingUrl: string | null; jitsiUrl: string;
  course: { id: string; title: string };
}
interface Course { id: string; title: string }

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const emptyForm = { courseId: '', title: '', description: '', scheduledAt: '', duration: 90, meetingUrl: '' };

export default function InstructorCalendar() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selDay, setSelDay] = useState<string>(ymd(new Date()));
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const flash = (kind: Toast['kind'], msg: string) => setToast({ kind, msg });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([api.get('/instructor/sessions'), api.get('/instructor/my-courses')]);
      setSessions(s.data ?? []);
      setCourses((c.data ?? []).map((x: any) => ({ id: x.id, title: x.title })));
    } catch {
      flash('err', 'Erreur de chargement du calendrier.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const byDay = useMemo(() => {
    const m: Record<string, Session[]> = {};
    for (const s of sessions) (m[ymd(new Date(s.scheduledAt))] ??= []).push(s);
    return m;
  }, [sessions]);

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7; // lundi = 0
    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    const dim = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) days.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [cursor]);

  const daySessions = (byDay[selDay] ?? []).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, courseId: courses[0]?.id ?? '', scheduledAt: `${selDay}T09:00` });
    setModalOpen(true);
  };
  const openEdit = (s: Session) => {
    setEditing(s);
    setForm({
      courseId: s.course.id, title: s.title, description: s.description ?? '',
      scheduledAt: toLocalInput(s.scheduledAt), duration: s.duration ?? 90, meetingUrl: s.meetingUrl ?? '',
    });
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(), description: form.description.trim() || undefined,
        scheduledAt: new Date(form.scheduledAt).toISOString(), duration: Number(form.duration) || 90,
        meetingUrl: form.meetingUrl.trim() || undefined,
      };
      if (editing) {
        await api.patch(`/instructor/sessions/${editing.id}`, body);
        flash('ok', 'Session mise à jour.');
      } else {
        await api.post(`/instructor/courses/${form.courseId}/sessions`, body);
        flash('ok', 'Session planifiée.');
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      flash('err', err?.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: Session) => {
    if (!window.confirm(`Supprimer la session « ${s.title} » ?`)) return;
    try {
      await api.delete(`/instructor/sessions/${s.id}`);
      flash('ok', 'Session supprimée.');
      load();
    } catch {
      flash('err', 'Suppression impossible.');
    }
  };

  const join = async (s: Session) => {
    try {
      const r = await api.get(`/sessions/${s.id}/join`);
      const url = r.data?.url || r.data?.roomUrl || r.data?.joinUrl;
      if (url) window.open(url, '_blank', 'noopener');
      else flash('err', 'Lien de session indisponible.');
    } catch {
      flash('err', 'Impossible de rejoindre la session.');
    }
  };

  const todayKey = ymd(new Date());

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        eyebrow="Formateur"
        title="Calendrier des sessions"
        description="Planifiez vos sessions en direct. Collez un lien Teams / Zoom / Meet, ou laissez une salle générée automatiquement."
        actions={<Btn variant="primary" onClick={openCreate} disabled={courses.length === 0}><Plus className="h-4 w-4" /> Nouvelle session</Btn>}
      />

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
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
                const isToday = key === todayKey;
                return (
                  <button
                    key={key}
                    onClick={() => setSelDay(key)}
                    className={`min-h-[68px] rounded-lg border p-1.5 text-left transition-colors ${
                      isSel ? 'border-[color:var(--a-accent)] bg-[color:color-mix(in_srgb,var(--a-accent)_12%,transparent)]'
                        : 'border-[color:var(--a-line)] hover:border-[color:var(--a-accent)]/50'
                    }`}
                  >
                    <div className={`text-[12px] font-semibold ${isToday ? 'text-[color:var(--a-accent-2)]' : 'text-[color:var(--a-ink-soft)]'}`}>{d.getDate()}</div>
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
                          <div className="text-[11px] text-[color:var(--a-ink-dim)]">{s.course.title}</div>
                        </div>
                        {live ? <Chip tone="green">En cours</Chip> : <Chip tone="blue">{(s.provider || 'jitsi').toUpperCase()}</Chip>}
                      </div>
                      <div className="mt-1.5 text-[12px] text-[color:var(--a-ink-soft)]">
                        {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {s.duration ?? 90} min
                      </div>
                      {s.description && <p className="mt-1 text-[12px] text-[color:var(--a-ink-dim)]">{s.description}</p>}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <Btn size="sm" variant="primary" onClick={() => join(s)}><Video className="h-3.5 w-3.5" /> Rejoindre</Btn>
                        <Btn size="sm" variant="ghost" onClick={() => openEdit(s)}>Éditer</Btn>
                        <Btn size="sm" variant="danger" onClick={() => remove(s)}><Trash2 className="h-3.5 w-3.5" /></Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      )}

      {courses.length === 0 && !loading && (
        <p className="mt-4 text-[12.5px] text-[color:var(--a-ink-dim)]">
          Aucune formation ne vous est assignée — voir <Link to="/learn/instructor/classes" className="a-link">Mes classes</Link>.
        </p>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier la session' : 'Nouvelle session'}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Btn>
            <Btn variant="primary" onClick={submit} disabled={saving || !form.title.trim() || (!editing && !form.courseId)}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {editing ? 'Mettre à jour' : 'Planifier'}
            </Btn>
          </>
        }
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          {!editing && (
            <Field label="Formation">
              <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Titre"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex : Q&A et corrections d'exercices" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date & heure"><Input type="datetime-local" required value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></Field>
            <Field label="Durée (min)"><Input type="number" min={15} max={300} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Lien de réunion (Teams / Zoom / Meet) — optionnel" hint="Laissez vide pour générer une salle vidéo automatiquement.">
            <Input value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} placeholder="https://teams.microsoft.com/l/meetup-join/…" />
          </Field>
          <Field label="Note (optionnel)"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          {form.meetingUrl.trim() && (
            <a href={form.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-[color:var(--a-accent)]">
              <ExternalLink className="h-3.5 w-3.5" /> Tester le lien
            </a>
          )}
        </form>
      </Modal>

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
