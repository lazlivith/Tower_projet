import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Trash2, Pin, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader, Panel, Btn, Chip, EmptyState, Textarea, ToastHost, type Toast } from '../../components/admin/ui';

interface ClassLite { id: string; name: string; courseTitle: string; students: number; messages: number }
interface Msg {
  id: string; body: string; pinned: boolean; createdAt: string;
  author: { id: string; nom: string; role: string };
}

export default function InstructorClassBoard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [selId, setSelId] = useState<string | null>(params.get('class'));
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const flash = (kind: Toast['kind'], msg: string) => setToast({ kind, msg });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/classrooms/mine');
      setClasses(r.data ?? []);
      setSelId((p) => p ?? r.data?.[0]?.id ?? null);
    } catch {
      flash('err', 'Erreur de chargement des classes.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const loadMessages = useCallback(async (id: string) => {
    setLoadingMsgs(true);
    try {
      const r = await api.get(`/classrooms/${id}/messages`);
      setMessages(r.data?.messages ?? []);
    } catch {
      flash('err', 'Erreur de chargement des messages.');
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (!selId) return;
    setParams((p) => { p.set('class', selId); return p; }, { replace: true });
    loadMessages(selId);
  }, [selId, loadMessages, setParams]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [messages]);

  const selected = classes.find((c) => c.id === selId) ?? null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selId || !body.trim()) return;
    setSending(true);
    try {
      await api.post(`/classrooms/${selId}/messages`, { body: body.trim(), pinned });
      setBody('');
      setPinned(false);
      loadMessages(selId);
    } catch (err: any) {
      flash('err', err?.response?.data?.message || "Échec de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  const remove = async (m: Msg) => {
    if (!selId || !window.confirm('Supprimer ce message ?')) return;
    try {
      await api.delete(`/classrooms/${selId}/messages/${m.id}`);
      loadMessages(selId);
    } catch {
      flash('err', 'Suppression impossible.');
    }
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Formateur"
        title="Espace de classe"
        description="Diffusez des annonces à toute la classe. Les élèves peuvent répondre — c'est le fil d'échange commun."
      />

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : classes.length === 0 ? (
        <EmptyState>Aucune classe assignée.</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="flex flex-col gap-2">
            {classes.map((c) => {
              const active = c.id === selId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelId(c.id)}
                  className={`a-card a-card-hover w-full p-3.5 text-left ${active ? '!border-[color:var(--a-accent)] shadow-[0_0_0_1px_var(--a-accent)]' : ''}`}
                >
                  <div className="text-[11px] uppercase tracking-wide text-[color:var(--a-ink-dim)]">{c.courseTitle}</div>
                  <div className="mt-0.5 font-semibold text-[color:var(--a-ink)]">{c.name}</div>
                  <div className="mt-1 text-[11px] text-[color:var(--a-ink-dim)]">{c.students} élève(s) · {c.messages} message(s)</div>
                </button>
              );
            })}
          </div>

          <Panel className="flex flex-col !p-0">
            <div className="border-b border-[color:var(--a-line)] px-4 py-3">
              <div className="font-semibold text-[color:var(--a-ink)]">{selected?.name}</div>
              <div className="text-[11px] text-[color:var(--a-ink-dim)]">{selected?.courseTitle}</div>
            </div>

            <div ref={feedRef} className="a-scroll flex max-h-[calc(100vh-360px)] min-h-[280px] flex-col gap-3 overflow-y-auto p-4">
              {loadingMsgs ? (
                <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
              ) : messages.length === 0 ? (
                <EmptyState>Aucun message. Publiez la première annonce.</EmptyState>
              ) : (
                messages.map((m) => {
                  const mine = m.author.id === user?.id;
                  const isInstr = m.author.role === 'INSTRUCTOR' || m.author.role === 'MANAGER';
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] rounded-2xl border px-3.5 py-2.5 ${
                        isInstr
                          ? 'border-[color:color-mix(in_srgb,var(--a-accent)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--a-accent)_12%,transparent)]'
                          : 'border-[color:var(--a-line)] bg-[color:var(--a-card)]'
                      }`}>
                        <div className="mb-1 flex items-center gap-2 text-[11px]">
                          <span className="font-semibold text-[color:var(--a-ink)]">{m.author.nom}</span>
                          {isInstr && <Chip tone="blue">Formateur</Chip>}
                          {m.pinned && <Pin className="h-3 w-3 text-[color:var(--a-accent-2)]" />}
                          <span className="text-[color:var(--a-ink-dim)]">
                            {new Date(m.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {(mine || true) && (
                            <button onClick={() => remove(m)} className="ml-1 text-[color:var(--a-ink-dim)] hover:text-[color:var(--a-danger)]" title="Supprimer">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap text-[13px] text-[color:var(--a-ink-soft)]">{m.body}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={send} className="border-t border-[color:var(--a-line)] p-3">
              <Textarea
                rows={2}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Écrire une annonce à la classe…"
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(e as any); }}
              />
              <div className="mt-2 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[12px] text-[color:var(--a-ink-soft)]">
                  <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="accent-[color:var(--a-accent-2)]" />
                  Épingler
                </label>
                <Btn variant="primary" type="submit" disabled={sending || !body.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publier
                </Btn>
              </div>
            </form>
          </Panel>
        </div>
      )}

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
