import { useEffect, useState, useCallback, useRef } from 'react';
import { Send, Trash2, Pin, Loader2, MessagesSquare } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ClassLite { id: string; name: string; courseTitle: string; students: number; messages: number }
interface Msg {
  id: string; body: string; pinned: boolean; createdAt: string;
  author: { id: string; nom: string; role: string };
}

export default function StudentClassBoard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/classrooms/mine');
      setClasses(r.data ?? []);
      setSelId((p) => p ?? r.data?.[0]?.id ?? null);
    } catch {
      setErr('Impossible de charger vos classes.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const loadMessages = useCallback((id: string) => {
    api.get(`/classrooms/${id}/messages`).then((r) => setMessages(r.data?.messages ?? [])).catch(() => setErr('Erreur de chargement des messages.'));
  }, []);
  useEffect(() => { if (selId) loadMessages(selId); }, [selId, loadMessages]);
  useEffect(() => { feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight }); }, [messages]);

  const selected = classes.find((c) => c.id === selId) ?? null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selId || !body.trim()) return;
    setSending(true);
    try {
      await api.post(`/classrooms/${selId}/messages`, { body: body.trim() });
      setBody('');
      loadMessages(selId);
    } catch {
      setErr("Échec de l'envoi du message.");
    } finally {
      setSending(false);
    }
  };

  const remove = async (m: Msg) => {
    if (!selId || m.author.id !== user?.id || !window.confirm('Supprimer votre message ?')) return;
    try {
      await api.delete(`/classrooms/${selId}/messages/${m.id}`);
      loadMessages(selId);
    } catch {
      setErr('Suppression impossible.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[#1A1A2E]">
          <MessagesSquare className="h-6 w-6 text-[#FFC107]" /> Espace de classe
        </h1>
        <p className="mt-1 text-sm text-gray-500">Annonces de votre formateur et échanges avec la classe.</p>
      </div>

      {err && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{err}</div>}

      {loading ? (
        <div className="text-sm text-gray-400">Chargement…</div>
      ) : classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
          Vous n'êtes rattaché à aucune classe active.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="flex flex-col gap-2">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelId(c.id)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  c.id === selId ? 'border-[#FFC107] bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-[11px] uppercase tracking-wide text-gray-400">{c.courseTitle}</div>
                <div className="font-semibold text-gray-900">{c.name}</div>
                <div className="text-[11px] text-gray-400">{c.messages} message(s)</div>
              </button>
            ))}
          </div>

          <div className="flex flex-col rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="font-semibold text-gray-900">{selected?.name}</div>
              <div className="text-[11px] text-gray-400">{selected?.courseTitle}</div>
            </div>

            <div ref={feedRef} className="flex max-h-[calc(100vh-340px)] min-h-[280px] flex-col gap-3 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">Aucun message pour l'instant.</div>
              ) : (
                messages.map((m) => {
                  const mine = m.author.id === user?.id;
                  const isInstr = m.author.role === 'INSTRUCTOR' || m.author.role === 'MANAGER';
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${isInstr ? 'bg-blue-50 border border-blue-100' : mine ? 'bg-[#1A1A2E] text-white' : 'bg-gray-100'}`}>
                        <div className={`mb-1 flex items-center gap-2 text-[11px] ${mine && !isInstr ? 'text-white/70' : 'text-gray-500'}`}>
                          <span className="font-semibold">{m.author.nom}</span>
                          {isInstr && <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">Formateur</span>}
                          {m.pinned && <Pin className="h-3 w-3 text-amber-500" />}
                          <span>{new Date(m.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          {mine && (
                            <button onClick={() => remove(m)} className="ml-1 opacity-60 hover:opacity-100" title="Supprimer">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap text-[13px]">{m.body}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={send} className="border-t border-gray-100 p-3">
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Écrire un message à la classe…"
                  className="flex-1 resize-none rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-[#FFC107]"
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(e as any); }}
                />
                <button
                  type="submit"
                  disabled={sending || !body.trim()}
                  className="flex items-center gap-1.5 self-end rounded-lg bg-[#FFC107] px-4 py-2 text-sm font-bold text-[#1A1A2E] hover:bg-yellow-400 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
