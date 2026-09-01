import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Clock, User, BookOpen, Loader, Ban, Plus, RefreshCw, FileDown } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import {
  PageHeader, Panel, Btn, Field, Select, Modal, EmptyState, Tabs,
  ToastHost, type Toast,
} from '../../components/admin/ui';

interface Enrollment {
  id: string;
  student: { id: string; nom: string; email: string };
  course: { id: string; title: string; price: number };
  createdAt: string;
  accessStatus: string;
  paymentPlan: string;
  payments?: { id: string; amount: number; paymentMethod: string; paymentStatus: string }[];
}

type Tab = 'SUSPENDED' | 'ACTIVE';

export default function PaymentsManager() {
  const [tab, setTab] = useState<Tab>('SUSPENDED');
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const [grantOpen, setGrantOpen] = useState(false);
  const [students, setStudents] = useState<{ id: string; nom: string; email: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [grant, setGrant] = useState({ studentId: '', courseId: '', paymentPlan: 'FULL' });
  const [granting, setGranting] = useState(false);

  const flash = (kind: Toast['kind'], msg: string) => setToast({ kind, msg });

  const genInvoice = async (paymentId: string) => {
    setBusy(paymentId);
    try {
      const r = await api.post(`/admin/documents/invoice/${paymentId}`, {});
      const url = toAbsoluteUrl(r.data?.document?.url);
      flash('ok', `Facture ${r.data?.document?.number ?? ''} générée.`);
      if (url) window.open(url, '_blank', 'noopener');
    } catch (e: any) {
      flash('err', e?.response?.data?.message || 'Échec de la génération de la facture.');
    } finally {
      setBusy(null);
    }
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/enrollments/pending?status=${tab}`);
      setRows(res.data || []);
    } catch {
      flash('err', 'Erreur lors du chargement des inscriptions.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const setAccess = async (e: Enrollment, status: 'ACTIVE' | 'SUSPENDED') => {
    const verb = status === 'ACTIVE' ? "Activer l'accès" : "Suspendre l'accès";
    if (!window.confirm(`${verb} de « ${e.student.nom} » pour « ${e.course.title} » ?`)) return;
    setBusy(e.id);
    try {
      await api.patch(`/admin/enrollments/${e.id}/validate-access`, { status });
      flash('ok', status === 'ACTIVE' ? `Accès de ${e.student.nom} activé.` : `Accès de ${e.student.nom} suspendu.`);
      setRows((prev) => prev.filter((r) => r.id !== e.id));
    } catch (err: any) {
      flash('err', err.response?.data?.message || 'Erreur.');
    } finally {
      setBusy(null);
    }
  };

  const openGrant = async () => {
    setGrant({ studentId: '', courseId: '', paymentPlan: 'FULL' });
    setGrantOpen(true);
    try {
      const [u, c] = await Promise.all([api.get('/admin/users'), api.get('/courses')]);
      const all = u.data?.data ?? u.data ?? [];
      setStudents(all.filter((x: any) => x.role === 'STUDENT'));
      setCourses(c.data?.data ?? c.data ?? []);
    } catch {
      flash('err', 'Erreur de chargement des listes.');
    }
  };

  const submitGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grant.studentId || !grant.courseId) return;
    setGranting(true);
    try {
      await api.post('/admin/enrollments/assign', grant);
      flash('ok', 'Accès accordé et activé.');
      setGrantOpen(false);
      if (tab === 'ACTIVE') fetchRows();
    } catch (err: any) {
      flash('err', err.response?.data?.message || "Erreur lors de l'attribution de l'accès.");
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Communauté"
        title="Paiements & accès"
        description="Débloquez l'accès d'un élève après paiement, suspendez un accès, ou accordez un accès manuellement."
        actions={
          <>
            <Btn variant="ghost" onClick={fetchRows}><RefreshCw className="h-4 w-4" /> Actualiser</Btn>
            <Btn variant="primary" onClick={openGrant}><Plus className="h-4 w-4" /> Donner accès</Btn>
          </>
        }
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <Tabs
          active={tab}
          onChange={(t) => setTab(t)}
          tabs={[{ id: 'SUSPENDED' as Tab, label: 'En attente' }, { id: 'ACTIVE' as Tab, label: 'Accès actifs' }]}
        />
        <span className="text-[12px] text-[color:var(--a-ink-dim)]">
          {loading ? '…' : `${rows.length} ${tab === 'SUSPENDED' ? 'en attente' : 'actif(s)'}`}
        </span>
      </div>

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : rows.length === 0 ? (
        <EmptyState>{tab === 'SUSPENDED' ? 'Aucune inscription en attente de paiement.' : 'Aucun accès actif.'}</EmptyState>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((e) => (
            <Panel key={e.id} className="!p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ${tab === 'SUSPENDED' ? 'bg-[color:color-mix(in_srgb,var(--a-accent-2)_16%,transparent)] text-[color:var(--a-accent-2)]' : 'bg-[color:color-mix(in_srgb,var(--a-ok)_16%,transparent)] text-[color:var(--a-ok)]'}`}>
                    <User className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-semibold text-[color:var(--a-ink)]">{e.student.nom}</div>
                    <div className="text-[12px] text-[color:var(--a-ink-dim)]">{e.student.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[color:var(--a-accent)]" />
                  <div>
                    <div className="text-[13px] font-medium text-[color:var(--a-ink)]">{e.course.title}</div>
                    <div className="text-[11px] text-[color:var(--a-ink-dim)]">
                      {e.course.price?.toLocaleString('fr-FR')} MAD · {e.paymentPlan === 'THREE_INSTALLMENTS' ? '3×' : 'comptant'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[12px] text-[color:var(--a-ink-dim)]">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(e.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>

                <div className="flex items-center gap-2">
                  {e.payments?.[0]?.id && (
                    <Btn variant="ghost" onClick={() => genInvoice(e.payments![0].id)} disabled={busy === e.payments![0].id}>
                      {busy === e.payments[0].id ? <Loader className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Facture
                    </Btn>
                  )}
                  {tab === 'SUSPENDED' ? (
                    <Btn variant="accent" onClick={() => setAccess(e, 'ACTIVE')} disabled={busy === e.id}>
                      {busy === e.id ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Débloquer l'accès
                    </Btn>
                  ) : (
                    <Btn variant="danger" onClick={() => setAccess(e, 'SUSPENDED')} disabled={busy === e.id}>
                      {busy === e.id ? <Loader className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />} Suspendre
                    </Btn>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal
        open={grantOpen}
        onClose={() => setGrantOpen(false)}
        title="Donner accès à une formation"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setGrantOpen(false)}>Annuler</Btn>
            <Btn variant="primary" onClick={submitGrant} disabled={granting || !grant.studentId || !grant.courseId}>
              {granting ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Accorder l'accès
            </Btn>
          </>
        }
      >
        <form onSubmit={submitGrant} className="flex flex-col gap-4">
          <p className="text-[12.5px] text-[color:var(--a-ink-dim)]">
            Inscrit et active immédiatement l'accès d'un étudiant, sans paiement préalable.
          </p>
          <Field label="Étudiant">
            <Select required value={grant.studentId} onChange={(e) => setGrant({ ...grant, studentId: e.target.value })}>
              <option value="">— Choisir —</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.nom} · {s.email}</option>)}
            </Select>
          </Field>
          <Field label="Formation">
            <Select required value={grant.courseId} onChange={(e) => setGrant({ ...grant, courseId: e.target.value })}>
              <option value="">— Choisir —</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
          </Field>
          <Field label="Plan de paiement">
            <Select value={grant.paymentPlan} onChange={(e) => setGrant({ ...grant, paymentPlan: e.target.value })}>
              <option value="FULL">Comptant</option>
              <option value="THREE_INSTALLMENTS">Échéancier 3×</option>
            </Select>
          </Field>
        </form>
      </Modal>

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
