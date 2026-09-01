import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Save, Loader2, UploadCloud, Eye, EyeOff } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import {
  PageHeader, Btn, Chip, Field, Input, Select, Textarea, Modal,
  EmptyState, Tabs, ToastHost, type Toast,
} from '../../components/admin/ui';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string | null;
  status: 'ONGOING' | 'COMPLETED';
  isPublished: boolean;
  createdAt: string;
}

const CATEGORIES = ['Résidentiel', 'Commercial', 'Infrastructure', 'Industriel', 'Santé'];
type ProjectStatus = 'ONGOING' | 'COMPLETED';
interface ProjectForm {
  title: string; category: string; description: string;
  imageUrl: string; status: ProjectStatus; isPublished: boolean;
  location: string; surface: string; missions: string; challenge: string; solution: string;
}
const empty: ProjectForm = {
  title: '', category: 'Résidentiel', description: '', imageUrl: '', status: 'COMPLETED', isPublished: true,
  location: '', surface: '', missions: '', challenge: '', solution: '',
};
type Filter = 'ALL' | 'COMPLETED' | 'ONGOING';
const PLACEHOLDER = 'https://placehold.co/600x400/1e293b/64748b?text=Projet';

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>({ ...empty });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (kind: Toast['kind'], msg: string) => setToast({ kind, msg });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cms/admin/projects');
      setProjects(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch {
      flash('err', 'Erreur de chargement des projets.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...empty }); setIsOpen(true); };
  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      ...empty,
      title: p.title, category: p.category, description: p.description,
      imageUrl: p.imageUrl ?? '', status: p.status, isPublished: p.isPublished,
      location: (p as any).location ?? '', surface: (p as any).surface ?? '',
      missions: (p as any).missions ?? '', challenge: (p as any).challenge ?? '', solution: (p as any).solution ?? '',
    });
    setIsOpen(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = toAbsoluteUrl(res.data?.url);
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
        title: form.title, description: form.description, category: form.category,
        imageUrl: form.imageUrl, status: form.status, isPublished: form.isPublished,
        location: form.location, surface: form.surface, missions: form.missions,
        challenge: form.challenge, solution: form.solution,
      };
      if (editing) {
        await api.put(`/cms/projects/${editing.id}`, payload);
        flash('ok', 'Projet mis à jour.');
      } else {
        await api.post('/cms/projects', payload);
        flash('ok', 'Projet créé.');
      }
      setIsOpen(false);
      fetchProjects();
    } catch (err: any) {
      flash('err', err.response?.data?.message || err.response?.data?.errors?.[0]?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (p: Project) => {
    try {
      await api.patch(`/cms/projects/${p.id}/toggle-publish`);
      fetchProjects();
    } catch {
      flash('err', 'Erreur lors du changement de visibilité.');
    }
  };

  const remove = async (p: Project) => {
    if (!window.confirm(`Supprimer le projet « ${p.title} » ?`)) return;
    try {
      await api.delete(`/cms/projects/${p.id}`);
      flash('ok', 'Projet supprimé.');
      fetchProjects();
    } catch {
      flash('err', 'Erreur lors de la suppression.');
    }
  };

  const shown = projects.filter((p) => filter === 'ALL' || p.status === filter);

  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader
        eyebrow="Site vitrine"
        title="Projets"
        description={loading ? '…' : `${projects.length} projet(s) — alimente les pages « Projets réalisés / en cours » du site.`}
        actions={
          <>
            <Tabs
              active={filter}
              onChange={(f) => setFilter(f)}
              tabs={[
                { id: 'ALL' as Filter, label: 'Tous' },
                { id: 'COMPLETED' as Filter, label: 'Réalisés' },
                { id: 'ONGOING' as Filter, label: 'En cours' },
              ]}
            />
            <Btn variant="primary" onClick={openCreate}><Plus className="h-4 w-4" /> Nouveau projet</Btn>
          </>
        }
      />

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : shown.length === 0 ? (
        <EmptyState>Aucun projet dans cette catégorie.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <div key={p.id} className="a-card a-card-hover overflow-hidden">
              <div className="relative">
                <img
                  src={p.imageUrl || PLACEHOLDER}
                  alt=""
                  className="h-40 w-full bg-white/5 object-cover"
                  onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                />
                <span className="absolute left-2 top-2">
                  {p.status === 'ONGOING' ? <Chip tone="amber">En cours</Chip> : <Chip tone="green">Réalisé</Chip>}
                </span>
                {!p.isPublished && <span className="absolute right-2 top-2"><Chip tone="gray">Masqué</Chip></span>}
              </div>
              <div className="p-4">
                <Chip tone="blue">{p.category}</Chip>
                <h4 className="mt-2 text-[14px] text-[color:var(--a-ink)]">{p.title}</h4>
                <p className="mt-1 line-clamp-2 text-[12.5px] text-[color:var(--a-ink-soft)]">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Btn size="sm" variant="ghost" onClick={() => openEdit(p)}><Edit className="h-3.5 w-3.5" /> Modifier</Btn>
                  <Btn size="sm" variant="accent" onClick={() => togglePublish(p)}>
                    {p.isPublished ? <><EyeOff className="h-3.5 w-3.5" /> Masquer</> : <><Eye className="h-3.5 w-3.5" /> Publier</>}
                  </Btn>
                  <Btn size="sm" variant="danger" onClick={() => remove(p)}><Trash2 className="h-3.5 w-3.5" /></Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? 'Modifier le projet' : 'Nouveau projet'}
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
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex : Tour Yasmine — Casablanca" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Catégorie">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="État">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>
                <option value="COMPLETED">Projet réalisé</option>
                <option value="ONGOING">Projet en cours</option>
              </Select>
            </Field>
          </div>
          <Field label="Description (≥ 10 caractères)">
            <Textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>

          <details className="a-card rounded-xl p-4">
            <summary className="cursor-pointer text-[13px] font-semibold text-[color:var(--a-ink)]">Étude de cas (page détail) — optionnel</summary>
            <div className="mt-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Lieu"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Casablanca" /></Field>
                <Field label="Surface"><Input value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} placeholder="12 000 m²" /></Field>
              </div>
              {([['missions', 'Missions confiées'], ['challenge', 'Défi technique'], ['solution', 'Solution apportée']] as const).map(([k, label]) => (
                <Field key={k} label={label}>
                  <Textarea rows={2} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                </Field>
              ))}
            </div>
          </details>

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
