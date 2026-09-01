import { useEffect, useState, useCallback } from 'react';
import { UserPlus, Mail, ShieldCheck, ShieldOff, KeyRound, BookOpen } from 'lucide-react';
import api from '../../services/api';
import {
  PageHeader, Panel, Btn, Chip, Field, Input, Select, Modal, EmptyState,
  DataTable, ToastHost, type Toast,
} from '../../components/admin/ui';

interface InstructorClass { id: string; name: string; courseId: string; courseTitle: string; students: number }
interface Instructor {
  id: string; nom: string; email: string; isActive: boolean; pendingFirstLogin: boolean;
  createdAt: string; classes: InstructorClass[]; coursesCount: number; studentsCount: number;
}
interface CourseLite { id: string; title: string }

export default function InstructorsManager() {
  const [rows, setRows] = useState<Instructor[]>([]);
  const [courses, setCourses] = useState<CourseLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', courseId: '' });
  const [createdInfo, setCreatedInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, cRes] = await Promise.all([
        api.get('/admin/instructors'),
        api.get('/admin/academy/courses'),
      ]);
      setRows(iRes.data ?? []);
      setCourses((cRes.data ?? []).map((c: any) => ({ id: c.id, title: c.title })));
    } catch {
      setToast({ kind: 'err', msg: 'Erreur de chargement des instructeurs.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setCreatedInfo(null);
    try {
      const res = await api.post('/admin/instructors', {
        nom: form.nom.trim(),
        email: form.email.trim(),
        courseId: form.courseId || undefined,
      });
      setToast({ kind: 'ok', msg: res.data?.message ?? 'Instructeur créé.' });
      if (res.data?.tempPassword) {
        setCreatedInfo(`Email non envoyé (SMTP). Mot de passe temporaire : ${res.data.tempPassword}`);
      } else {
        setModal(false);
      }
      setForm({ nom: '', email: '', courseId: '' });
      load();
    } catch (err: any) {
      setToast({ kind: 'err', msg: err?.response?.data?.message ?? 'Échec de la création.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u: Instructor) => {
    if (!window.confirm(`${u.isActive ? 'Bloquer' : 'Débloquer'} le compte de ${u.nom} ?`)) return;
    try {
      await api.patch(`/admin/users/${u.id}/toggle-status`, { action: u.isActive ? 'BLOCK' : 'UNBLOCK' });
      setToast({ kind: 'ok', msg: `Compte ${u.isActive ? 'bloqué' : 'réactivé'}.` });
      load();
    } catch {
      setToast({ kind: 'err', msg: 'Erreur lors de la modification du statut.' });
    }
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        eyebrow="Académie"
        title="Instructeurs"
        description="Créez les comptes formateurs et suivez leurs classes. L'assignation fine se fait dans « Classes & contenus »."
        actions={<Btn variant="primary" onClick={() => { setModal(true); setCreatedInfo(null); }}><UserPlus className="h-4 w-4" /> Créer un instructeur</Btn>}
      />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Panel className="!p-4"><div className="text-[11px] uppercase text-[color:var(--a-ink-dim)]">Total</div><div className="mt-1 font-[family-name:var(--font-display,inherit)] text-2xl text-[color:var(--a-ink)]">{rows.length}</div></Panel>
        <Panel className="!p-4"><div className="text-[11px] uppercase text-[color:var(--a-ink-dim)]">Actifs</div><div className="mt-1 font-[family-name:var(--font-display,inherit)] text-2xl text-[color:var(--a-ok)]">{rows.filter((r) => r.isActive).length}</div></Panel>
        <Panel className="!p-4"><div className="text-[11px] uppercase text-[color:var(--a-ink-dim)]">1ʳᵉ connexion en attente</div><div className="mt-1 font-[family-name:var(--font-display,inherit)] text-2xl text-[color:var(--a-accent-2)]">{rows.filter((r) => r.pendingFirstLogin).length}</div></Panel>
        <Panel className="!p-4"><div className="text-[11px] uppercase text-[color:var(--a-ink-dim)]">Élèves encadrés</div><div className="mt-1 font-[family-name:var(--font-display,inherit)] text-2xl text-[color:var(--a-ink)]">{rows.reduce((a, r) => a + r.studentsCount, 0)}</div></Panel>
      </div>

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : rows.length === 0 ? (
        <EmptyState>Aucun instructeur pour le moment. Cliquez sur « Créer un instructeur ».</EmptyState>
      ) : (
        <DataTable columns={['Instructeur', 'Classes assignées', 'Élèves', 'Statut', 'Actions']}>
          {rows.map((u) => (
            <tr key={u.id}>
              <td>
                <div className="a-td-strong flex items-center gap-2">{u.nom}</div>
                <div className="flex items-center gap-1 text-[11px] text-[color:var(--a-ink-dim)]"><Mail className="h-3 w-3" /> {u.email}</div>
              </td>
              <td>
                {u.classes.length === 0 ? (
                  <span className="text-[color:var(--a-ink-dim)]">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {u.classes.map((c) => (
                      <span key={c.id} className="a-chip a-chip-blue" title={c.courseTitle}>
                        <BookOpen className="h-3 w-3" /> {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="a-td-strong">{u.studentsCount}</td>
              <td>
                <div className="flex flex-col gap-1">
                  {u.isActive ? <Chip tone="green">Actif</Chip> : <Chip tone="red">Bloqué</Chip>}
                  {u.pendingFirstLogin && <Chip tone="amber"><KeyRound className="h-3 w-3" /> MDP à changer</Chip>}
                </div>
              </td>
              <td>
                <Btn size="sm" variant={u.isActive ? 'danger' : 'accent'} onClick={() => toggleStatus(u)}>
                  {u.isActive ? <><ShieldOff className="h-3.5 w-3.5" /> Bloquer</> : <><ShieldCheck className="h-3.5 w-3.5" /> Débloquer</>}
                </Btn>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Créer un instructeur"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setModal(false)}>Fermer</Btn>
            <Btn variant="primary" onClick={submit} disabled={saving || !form.nom.trim() || !form.email.trim()}>
              {saving ? 'Création…' : 'Créer & envoyer les identifiants'}
            </Btn>
          </>
        }
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Nom complet">
            <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex. Karim Bennani" required />
          </Field>
          <Field label="Email professionnel" hint="Un mot de passe temporaire est envoyé à cette adresse ; changement forcé à la 1ʳᵉ connexion.">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="prenom.nom@exemple.ma" required />
          </Field>
          <Field label="Assigner à une formation (optionnel)" hint="Rattache l'instructeur à une classe existante sans formateur, ou en crée une.">
            <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">— Aucune pour l'instant —</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
          </Field>
          {createdInfo && (
            <div className="rounded-lg border border-[color:color-mix(in_srgb,var(--a-accent-2)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--a-accent-2)_10%,transparent)] px-3 py-2 text-[12.5px] text-[color:var(--a-accent-2)]">
              {createdInfo}
            </div>
          )}
        </form>
      </Modal>

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
