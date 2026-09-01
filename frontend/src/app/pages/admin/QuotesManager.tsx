import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Mail, FileDown, Loader2 } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import {
  PageHeader, Panel, Btn, Chip, StatCard, EmptyState, Tabs, ToastHost, type Toast,
} from '../../components/admin/ui';

type Filter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED';

const statusChip = (s: string) =>
  s === 'PENDING' ? <Chip tone="amber">En attente</Chip>
    : s === 'ACCEPTED' ? <Chip tone="green">Accepté</Chip>
    : s === 'CONTACTED' ? <Chip tone="blue">Contacté</Chip>
    : <Chip tone="red">Refusé</Chip>;

export default function QuotesManager() {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [toast, setToast] = useState<Toast | null>(null);
  const [genId, setGenId] = useState<string | null>(null);

  const genDevisPdf = async (id: string) => {
    setGenId(id);
    try {
      const r = await api.post(`/admin/documents/quote/${id}`, {});
      const url = toAbsoluteUrl(r.data?.document?.url);
      setToast({ kind: 'ok', msg: `Devis ${r.data?.reference ?? ''} généré.` });
      if (url) window.open(url, '_blank', 'noopener');
    } catch (e: any) {
      setToast({ kind: 'err', msg: e?.response?.data?.message || 'Échec de la génération du devis.' });
    } finally {
      setGenId(null);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quotes');
      setQuotes(res.data?.data || res.data || []);
    } catch {
      setToast({ kind: 'err', msg: 'Erreur de chargement des devis.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!window.confirm("Confirmer l'action ?")) return;
    try {
      await api.patch(`/quotes/${id}/status`, { status: newStatus });
      setToast({ kind: 'ok', msg: 'Statut mis à jour.' });
      fetchData();
    } catch {
      setToast({ kind: 'err', msg: 'Erreur lors de la mise à jour du statut.' });
    }
  };

  const c = (s: string) => quotes.filter((q) => q.status === s).length;
  const filtered = quotes.filter((q) => filter === 'ALL' || q.status === filter);

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        eyebrow="Site vitrine"
        title="Devis"
        description="Demandes d'étude reçues via le formulaire public."
      />

      <div className="mb-4 grid grid-cols-3 gap-4">
        <StatCard tone="amber" value={c('PENDING')} label="En attente" />
        <StatCard tone="ok" value={c('ACCEPTED')} label="Acceptés" />
        <StatCard tone="danger" value={c('REJECTED')} label="Refusés" />
      </div>

      <div className="mb-4">
        <Tabs
          active={filter}
          onChange={(f) => setFilter(f)}
          tabs={[
            { id: 'ALL' as Filter, label: `Tous (${quotes.length})` },
            { id: 'PENDING' as Filter, label: `En attente (${c('PENDING')})` },
            { id: 'ACCEPTED' as Filter, label: `Acceptés (${c('ACCEPTED')})` },
            { id: 'REJECTED' as Filter, label: `Refusés (${c('REJECTED')})` },
          ]}
        />
      </div>

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : filtered.length === 0 ? (
        <EmptyState>Aucun devis pour ce filtre.</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((q) => (
            <Panel key={q.id} className="!p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[15px] text-[color:var(--a-ink)]">{q.clientName}</h3>
                {statusChip(q.status)}
              </div>
              <div className="grid gap-x-8 gap-y-1.5 text-[12.5px] text-[color:var(--a-ink-soft)] sm:grid-cols-2">
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[color:var(--a-ink-dim)]" /> {q.email}</p>
                <p><span className="text-[color:var(--a-ink-dim)]">Type : </span>{q.type ?? q.serviceType ?? '—'}</p>
                <p><span className="text-[color:var(--a-ink-dim)]">Service : </span>{q.serviceName ?? q.serviceType ?? '—'}</p>
                <p><span className="text-[color:var(--a-ink-dim)]">Budget : </span>{q.budget ? `${q.budget} MAD` : '—'}</p>
                <p><span className="text-[color:var(--a-ink-dim)]">Reçu le : </span>{new Date(q.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              {q.description && (
                <div className="mt-3 rounded-lg bg-white/[0.03] p-3 text-[12.5px] text-[color:var(--a-ink-soft)]">{q.description}</div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {q.status === 'PENDING' && (
                  <>
                    <Btn size="sm" variant="accent" onClick={() => handleUpdateStatus(q.id, 'ACCEPTED')}>
                      <CheckCircle className="h-3.5 w-3.5" /> Accepter
                    </Btn>
                    <a href={`mailto:${q.email}`} className="a-btn a-btn-ghost a-btn-sm"><Mail className="h-3.5 w-3.5" /> Contacter</a>
                    <Btn size="sm" variant="danger" onClick={() => handleUpdateStatus(q.id, 'REJECTED')}>
                      <XCircle className="h-3.5 w-3.5" /> Refuser
                    </Btn>
                  </>
                )}
                <Btn size="sm" variant="ghost" onClick={() => genDevisPdf(q.id)} disabled={genId === q.id}>
                  {genId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />} Devis PDF
                  {q.reference ? ` (${q.reference})` : ''}
                </Btn>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
