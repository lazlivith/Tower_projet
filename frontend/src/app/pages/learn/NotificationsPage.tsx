import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../../services/api';

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
    try {
      await api.patch('/notifications/mark-all-read');
      load();
    } catch { /* ignore */ }
  };

  const markOne = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((xs) => xs.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch { /* ignore */ }
  };

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Bell className="h-6 w-6 text-[#FFC107]" />
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Notifications</h1>
          {unread > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{unread}</span>}
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Chargement…</div>
      ) : err ? (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{err}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-400">
          Aucune notification.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.isRead && markOne(n.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                n.isRead ? 'border-gray-200 bg-white' : 'border-[#FFC107]/40 bg-amber-50/60 hover:bg-amber-50'
              }`}
            >
              <div className="flex items-start gap-2">
                {!n.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#FFC107]" />}
                <div className="min-w-0">
                  <p className={`text-sm ${n.isRead ? 'text-gray-600' : 'font-medium text-gray-900'}`}>{n.message}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
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
