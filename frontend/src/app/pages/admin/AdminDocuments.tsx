import { useEffect, useState, useCallback } from 'react';
import { FileText, Download, Loader2, Award, ReceiptText, FileSignature, GraduationCap } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import {
  PageHeader, Panel, PanelTitle, Btn, Chip, Field, Input, Select, EmptyState, Tabs,
  DataTable, ToastHost, type Toast,
} from '../../components/admin/ui';

interface Doc {
  id: string; type: string; number: string; title: string; url: string; createdAt: string;
  user: { nom: string; email: string } | null;
}
type Filter = 'ALL' | 'CERTIFICATE' | 'INVOICE' | 'QUOTE' | 'ENROLLMENT_ATTESTATION';

const TYPE_LABEL: Record<string, string> = {
  CERTIFICATE: 'Certificat', INVOICE: 'Facture', QUOTE: 'Devis', ENROLLMENT_ATTESTATION: 'Attestation',
};
const typeChip = (t: string) =>
  t === 'CERTIFICATE' ? <Chip tone="green">Certificat</Chip>
    : t === 'INVOICE' ? <Chip tone="amber">Facture</Chip>
    : t === 'QUOTE' ? <Chip tone="blue">Devis</Chip>
    : <Chip tone="gray">Attestation</Chip>;

export default function AdminDocuments() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  const [students, setStudents] = useState<{ id: string; nom: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [quotes, setQuotes] = useState<{ id: string; clientName: string; serviceType: string }[]>([]);

  const [att, setAtt] = useState({ studentId: '', courseId: '' });
  const [cert, setCert] = useState({ studentId: '', courseId: '', score: '100' });
  const [dev, setDev] = useState({ quoteId: '', amount: '' });
  const [busy, setBusy] = useState('');

  const flash = (kind: Toast['kind'], msg: string) => setToast({ kind, msg });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, u, c, q] = await Promise.all([
        api.get('/admin/documents'),
        api.get('/admin/users'),
        api.get('/admin/academy/courses'),
        api.get('/quotes'),
      ]);
      setDocs(d.data ?? []);
      setStudents((u.data?.data ?? u.data ?? []).filter((x: any) => x.role === 'STUDENT').map((x: any) => ({ id: x.id, nom: x.nom })));
      setCourses((c.data ?? []).map((x: any) => ({ id: x.id, title: x.title })));
      setQuotes((q.data?.data ?? q.data ?? []).map((x: any) => ({ id: x.id, clientName: x.clientName, serviceType: x.serviceType })));
    } catch {
      flash('err', 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (key: string, fn: () => Promise<any>, okMsg: string) => {
    setBusy(key);
    try {
      const r = await fn();
      flash('ok', `${okMsg} — ${r.data?.document?.number ?? ''}`);
      load();
    } catch (e: any) {
      flash('err', e?.response?.data?.message || 'Échec de la génération.');
    } finally {
      setBusy('');
    }
  };

  const shown = docs.filter((d) => filter === 'ALL' || d.type === filter);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        eyebrow="Administration"
        title="Documents"
        description="Génération automatisée — certificats, factures, devis et attestations d'inscription. Chaque document reçoit un numéro et est archivé."
      />

      {/* Générateurs */}
      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Panel>
          <PanelTitle><span className="inline-flex items-center gap-1.5"><FileSignature className="h-4 w-4" /> Attestation d'inscription</span></PanelTitle>
          <div className="flex flex-col gap-3">
            <Field label="Élève"><Select value={att.studentId} onChange={(e) => setAtt({ ...att, studentId: e.target.value })}><option value="">—</option>{students.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}</Select></Field>
            <Field label="Formation"><Select value={att.courseId} onChange={(e) => setAtt({ ...att, courseId: e.target.value })}><option value="">—</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select></Field>
            <Btn variant="primary" disabled={!att.studentId || !att.courseId || busy === 'att'}
              onClick={() => run('att', () => api.post('/admin/documents/attestation', att), 'Attestation générée')}>
              {busy === 'att' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />} Générer
            </Btn>
          </div>
        </Panel>

        <Panel>
          <PanelTitle><span className="inline-flex items-center gap-1.5"><Award className="h-4 w-4" /> Certificat</span></PanelTitle>
          <div className="flex flex-col gap-3">
            <Field label="Élève"><Select value={cert.studentId} onChange={(e) => setCert({ ...cert, studentId: e.target.value })}><option value="">—</option>{students.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}</Select></Field>
            <div className="grid grid-cols-[1fr_90px] gap-2">
              <Field label="Formation"><Select value={cert.courseId} onChange={(e) => setCert({ ...cert, courseId: e.target.value })}><option value="">—</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select></Field>
              <Field label="Note %"><Input type="number" min={0} max={100} value={cert.score} onChange={(e) => setCert({ ...cert, score: e.target.value })} /></Field>
            </div>
            <Btn variant="primary" disabled={!cert.studentId || !cert.courseId || busy === 'cert'}
              onClick={() => run('cert', () => api.post('/admin/documents/certificate', { ...cert, score: Number(cert.score) }), 'Certificat généré')}>
              {busy === 'cert' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />} Générer
            </Btn>
          </div>
        </Panel>

        <Panel>
          <PanelTitle><span className="inline-flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> Devis (depuis une demande)</span></PanelTitle>
          <div className="flex flex-col gap-3">
            <Field label="Demande de devis"><Select value={dev.quoteId} onChange={(e) => setDev({ ...dev, quoteId: e.target.value })}><option value="">—</option>{quotes.map((q) => <option key={q.id} value={q.id}>{q.clientName} · {q.serviceType}</option>)}</Select></Field>
            <Field label="Montant estimé HT (MAD) — optionnel"><Input type="number" min={0} value={dev.amount} onChange={(e) => setDev({ ...dev, amount: e.target.value })} placeholder="Sur étude" /></Field>
            <Btn variant="primary" disabled={!dev.quoteId || busy === 'dev'}
              onClick={() => run('dev', () => api.post(`/admin/documents/quote/${dev.quoteId}`, dev.amount ? { amount: Number(dev.amount) } : {}), 'Devis généré')}>
              {busy === 'dev' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ReceiptText className="h-4 w-4" />} Générer le PDF
            </Btn>
          </div>
        </Panel>
      </div>

      {/* Registre */}
      <div className="mb-3">
        <Tabs active={filter} onChange={(f) => setFilter(f)} tabs={[
          { id: 'ALL' as Filter, label: `Tous (${docs.length})` },
          { id: 'CERTIFICATE' as Filter, label: 'Certificats' },
          { id: 'INVOICE' as Filter, label: 'Factures' },
          { id: 'QUOTE' as Filter, label: 'Devis' },
          { id: 'ENROLLMENT_ATTESTATION' as Filter, label: 'Attestations' },
        ]} />
      </div>

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : shown.length === 0 ? (
        <EmptyState>Aucun document généré pour ce filtre.</EmptyState>
      ) : (
        <DataTable columns={['Numéro', 'Type', 'Intitulé', 'Bénéficiaire', 'Date', '']}>
          {shown.map((d) => (
            <tr key={d.id}>
              <td className="a-td-strong">{d.number}</td>
              <td>{typeChip(d.type)}</td>
              <td>{d.title}</td>
              <td>{d.user ? d.user.nom : '—'}</td>
              <td>{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
              <td className="text-right">
                <a href={toAbsoluteUrl(d.url)} target="_blank" rel="noreferrer" className="a-btn a-btn-ghost a-btn-sm">
                  <Download className="h-3.5 w-3.5" /> PDF
                </a>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
