import { useEffect, useState, useCallback } from 'react';
import { CheckCheck } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Btn, EmptyState } from '../../components/admin/ui';

interface Notif { id: string; type: string; message: string; isRead: boolean; createdAt: string }

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/notifications')
      .then((r) => setItems(r.data ?? []))
      .catch(() => setErr('Impossible de charger les notifications.'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const markAll = async () => {
    try { await api.patch('/notifications/mark-all-read'); load(); } catch { /* ignore */ }
  };
  const markOne = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((xs) => xs.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch { /* ignore */ }
  };

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Espace"
        title={`Notifications${unread ? ` · ${unread}` : ''}`}
        description="Activité de votre compte et de vos formations."
        actions={unread > 0 ? <Btn variant="ghost" onClick={markAll}><CheckCheck className="h-4 w-4" /> Tout marquer comme lu</Btn> : undefined}
      />

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : err ? (
        <EmptyState>{err}</EmptyState>
      ) : items.length === 0 ? (
        <EmptyState>Aucune notification.</EmptyState>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.isRead && markOne(n.id)}
              className={`a-card p-4 text-left ${n.isRead ? '' : '!border-[color:color-mix(in_srgb,var(--a-accent)_40%,transparent)] bg-[color:color-mix(in_srgb,var(--a-accent)_8%,transparent)]'}`}
            >
              <div className="flex items-start gap-2">
                {!n.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[color:var(--a-accent)]" />}
                <div className="min-w-0">
                  <p className={`text-[13px] ${n.isRead ? 'text-[color:var(--a-ink-soft)]' : 'font-medium text-[color:var(--a-ink)]'}`}>{n.message}</p>
                  <p className="mt-0.5 text-[11px] text-[color:var(--a-ink-dim)]">
                    {new Date(n.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
