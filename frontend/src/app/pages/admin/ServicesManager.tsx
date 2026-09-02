import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Save, Loader2, UploadCloud, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../../services/api';
import { uploadFile } from '../../services/upload';
import {
  PageHeader, Btn, Chip, Field, Input, Select, Textarea, Modal,
  EmptyState, ToastHost, type Toast,
} from '../../components/ui';

interface Service {
  id: string;
  slug: string;
  kind: 'SERVICE' | 'AMO';
  title: string;
  summary: string;
  imageUrl: string | null;
  objective: string | null;
  scope: string[];
  deliverables: string[];
  order: number;
  isPublished: boolean;
}

type ServiceKind = 'SERVICE' | 'AMO';
interface ServiceForm {
  title: string; slug: string; kind: ServiceKind; summary: string;
  imageUrl: string; objective: string; scope: string; deliverables: string; isPublished: boolean;
}
const empty: ServiceForm = {
  title: '', slug: '', kind: 'SERVICE', summary: '',
  imageUrl: '', objective: '', scope: '', deliverables: '', isPublished: true,
};

const PLACEHOLDER = 'https://placehold.co/600x400/1e293b/64748b?text=Service';
const linesToArr = (v: string) => v.split('\n').map((l) => l.trim()).filter(Boolean);
const arrToLines = (a?: string[]) => (Array.isArray(a) ? a.join('\n') : '');

export default function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>({ ...empty });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (kind: Toast['kind'], msg: string) => setToast({ kind, msg });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cms/admin/services');
      setServices(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch {
      flash('err', 'Erreur de chargement des services.');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...empty }); setIsOpen(true); };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      title: s.title, slug: s.slug, kind: s.kind, summary: s.summary,
      imageUrl: s.imageUrl ?? '', objective: s.objective ?? '',
      scope: arrToLines(s.scope), deliverables: arrToLines(s.deliverables),
      isPublished: s.isPublished,
    });
    setIsOpen(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadFile(file, 'image', 'services');
      if (url) setForm((f) => ({ ...f, imageUrl: url }));
    } catch {
      flash('err', "Échec de l'upload de l'image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || undefined,
        kind: form.kind,
        summary: form.summary,
        imageUrl: form.imageUrl,
        objective: form.objective,
        scope: linesToArr(form.scope),
        deliverables: linesToArr(form.deliverables),
        isPublished: form.isPublished,
      };
      if (editing) {
        await api.put(`/cms/services/${editing.id}`, payload);
        flash('ok', 'Service mis à jour.');
      } else {
        await api.post('/cms/services', payload);
        flash('ok', 'Service créé.');
      }
      setIsOpen(false);
      fetchServices();
    } catch (err: any) {
      flash('err', err.response?.data?.message || err.response?.data?.errors?.[0]?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (s: Service) => {
    try {
      await api.patch(`/cms/services/${s.id}/toggle-publish`);
      fetchServices();
    } catch {
      flash('err', 'Erreur lors du changement de visibilité.');
    }
  };

  const remove = async (s: Service) => {
    if (!window.confirm(`Supprimer le service « ${s.title} » ?`)) return;
    try {
      await api.delete(`/cms/services/${s.id}`);
      flash('ok', 'Service supprimé.');
      fetchServices();
    } catch {
      flash('err', 'Erreur lors de la suppression.');
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...services];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setServices(next);
    setReordering(true);
    try {
      await api.patch('/cms/services/reorder', { ids: next.map((s) => s.id) });
    } catch {
      flash('err', "Erreur lors du changement d'ordre.");
      fetchServices();
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader
        eyebrow="Site vitrine"
        title="Services"
        description={loading ? '…' : `${services.length} service(s) — alimente la page « Services » et le menu du site. Le type « AMO » s'affiche dans l'encart d'accompagnement.`}
        actions={<Btn variant="primary" onClick={openCreate}><Plus className="h-4 w-4" /> Nouveau service</Btn>}
      />

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : services.length === 0 ? (
        <EmptyState>Aucun service pour le moment.</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {services.map((s, i) => (
            <div key={s.id} className="a-card a-card-hover flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex shrink-0 flex-col gap-1">
                <button type="button" disabled={i === 0 || reordering} onClick={() => move(i, -1)}
                  className="a-btn a-btn-ghost !px-2 !py-1 disabled:opacity-30" aria-label="Monter">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" disabled={i === services.length - 1 || reordering} onClick={() => move(i, 1)}
                  className="a-btn a-btn-ghost !px-2 !py-1 disabled:opacity-30" aria-label="Descendre">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <img
                src={s.imageUrl || PLACEHOLDER}
                alt=""
                className="h-20 w-32 shrink-0 rounded-lg bg-white/5 object-cover"
                onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone={s.kind === 'AMO' ? 'amber' : 'blue'}>{s.kind === 'AMO' ? 'AMO' : 'Prestation'}</Chip>
                  {!s.isPublished && <Chip tone="gray">Masqué</Chip>}
                  <span className="text-[11px] text-[color:var(--a-ink-dim)]">/services/{s.slug}</span>
                </div>
                <h4 className="mt-1 truncate text-[14px] text-[color:var(--a-ink)]">{s.title}</h4>
                <p className="mt-1 line-clamp-2 text-[12.5px] text-[color:var(--a-ink-soft)]">{s.summary}</p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Btn size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="h-3.5 w-3.5" /> Modifier</Btn>
                <Btn size="sm" variant="accent" onClick={() => togglePublish(s)}>
                  {s.isPublished ? <><EyeOff className="h-3.5 w-3.5" /> Masquer</> : <><Eye className="h-3.5 w-3.5" /> Publier</>}
                </Btn>
                <Btn size="sm" variant="danger" onClick={() => remove(s)}><Trash2 className="h-3.5 w-3.5" /></Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? 'Modifier le service' : 'Nouveau service'}
        maxWidth={720}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Btn>
            <Btn variant="primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {editing ? 'Mettre à jour' : 'Créer'}
            </Btn>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Titre">
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex : Études d'exécution (EXE) & calculs de structure" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as ServiceKind })}>
                <option value="SERVICE">Prestation (liste des services)</option>
                <option value="AMO">AMO (encart d'accompagnement)</option>
              </Select>
            </Field>
            <Field label="Slug (URL) — laisser vide pour auto">
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="exe" />
            </Field>
          </div>
          <Field label="Résumé (affiché sur la page Services)">
            <Textarea required rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </Field>
          <Field label="Objectif (page détail) — optionnel">
            <Textarea rows={2} value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
          </Field>
          <Field label="Périmètre d'action — une ligne par point">
            <Textarea rows={4} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}
              placeholder={'Descente de charges et dimensionnement des fondations…\nCalculs de structures en béton armé (EC2)…'} />
          </Field>
          <Field label="Livrables techniques — une ligne par point">
            <Textarea rows={3} value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} />
          </Field>

          <Field label="Image">
            <div className="flex gap-2">
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="a-btn a-btn-ghost">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Upload
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </div>
            {form.imageUrl && <img src={form.imageUrl} alt="" className="mt-2 h-40 w-full rounded-lg object-cover" />}
          </Field>

          <label className="flex items-center gap-2 text-[13px] text-[color:var(--a-ink-soft)]">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="accent-[color:var(--a-accent-2)]" />
            Visible sur le site public
          </label>
        </form>
      </Modal>

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
