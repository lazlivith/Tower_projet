import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Save, Loader2, UploadCloud, Eye, EyeOff } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import {
  PageHeader, Panel, Btn, Chip, Field, Input, Select, Textarea, Modal,
  EmptyState, ToastHost, type Toast,
} from '../../components/admin/ui';

interface Publication {
  id: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  content: string;
  imageUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: string;
}

const CATEGORIES = ['BIM', 'Eurocodes', 'Diagnostic', 'Formation', 'Actualité'];
type PubStatus = 'DRAFT' | 'PUBLISHED';
interface PubForm {
  title: string; excerpt: string; category: string;
  content: string; imageUrl: string; status: PubStatus;
}
const empty: PubForm = { title: '', excerpt: '', category: 'BIM', content: '', imageUrl: '', status: 'DRAFT' };
const PLACEHOLDER = 'https://placehold.co/160x120/1e293b/64748b?text=Article';

export default function PublicationsManager() {
  const [posts, setPosts] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Publication | null>(null);
  const [form, setForm] = useState<PubForm>({ ...empty });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (kind: Toast['kind'], msg: string) => setToast({ kind, msg });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cms/admin/publications');
      setPosts(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch {
      flash('err', 'Erreur de chargement des publications.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...empty }); setIsOpen(true); };
  const openEdit = (p: Publication) => {
    setEditing(p);
    setForm({
      title: p.title, excerpt: p.excerpt ?? '', category: p.category ?? 'BIM',
      content: p.content, imageUrl: p.imageUrl ?? '', status: p.status,
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
        title: form.title, content: form.content, excerpt: form.excerpt,
        category: form.category, imageUrl: form.imageUrl, status: form.status,
      };
      if (editing) {
        await api.put(`/cms/publications/${editing.id}`, payload);
        flash('ok', 'Publication mise à jour.');
      } else {
        await api.post('/cms/publications', payload);
        flash('ok', 'Publication créée.');
      }
      setIsOpen(false);
      fetchPosts();
    } catch (err: any) {
      flash('err', err.response?.data?.message || err.response?.data?.errors?.[0]?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (p: Publication) => {
    try {
      await api.patch(`/cms/publications/${p.id}/toggle-publish`);
      fetchPosts();
    } catch {
      flash('err', 'Erreur lors du changement de statut.');
    }
  };

  const remove = async (p: Publication) => {
    if (!window.confirm(`Supprimer la publication « ${p.title} » ?`)) return;
    try {
      await api.delete(`/cms/publications/${p.id}`);
      flash('ok', 'Publication supprimée.');
      fetchPosts();
    } catch {
      flash('err', 'Erreur lors de la suppression.');
    }
  };

  const publishedCount = posts.filter((p) => p.status === 'PUBLISHED').length;

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        eyebrow="Site vitrine"
        title="Blog / Publications"
        description={loading ? '…' : `${posts.length} publication(s) · ${publishedCount} en ligne — alimente la page Blog du site.`}
        actions={<Btn variant="primary" onClick={openCreate}><Plus className="h-4 w-4" /> Nouvelle publication</Btn>}
      />

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : posts.length === 0 ? (
        <EmptyState>Aucune publication. Créez-en une pour alimenter la page Blog du site.</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => (
            <Panel key={p.id} className="!p-4">
              <div className="flex gap-4">
                <img
                  src={p.imageUrl || PLACEHOLDER}
                  alt=""
                  className="h-24 w-32 flex-shrink-0 rounded-lg bg-white/5 object-cover"
                  onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-[14.5px] text-[color:var(--a-ink)]">{p.title}</h3>
                    {p.status === 'PUBLISHED' ? <Chip tone="green">En ligne</Chip> : <Chip tone="gray">Brouillon</Chip>}
                    {p.category && <Chip tone="blue">{p.category}</Chip>}
                  </div>
                  <p className="line-clamp-2 text-[12.5px] text-[color:var(--a-ink-soft)]">{p.excerpt || p.content}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Btn size="sm" variant="ghost" onClick={() => openEdit(p)}><Edit className="h-3.5 w-3.5" /> Modifier</Btn>
                    <Btn size="sm" variant={p.status === 'PUBLISHED' ? 'accent' : 'accent'} onClick={() => toggle(p)}>
                      {p.status === 'PUBLISHED' ? <><EyeOff className="h-3.5 w-3.5" /> Dépublier</> : <><Eye className="h-3.5 w-3.5" /> Publier</>}
                    </Btn>
                    <Btn size="sm" variant="danger" onClick={() => remove(p)}><Trash2 className="h-3.5 w-3.5" /> Supprimer</Btn>
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? 'Modifier la publication' : 'Nouvelle publication'}
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
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Catégorie">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Statut">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PubStatus })}>
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publié</option>
              </Select>
            </Field>
          </div>
          <Field label="Chapô / extrait">
            <Textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          </Field>
          <Field label="Contenu (≥ 10 caractères)">
            <Textarea required rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
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
        </form>
      </Modal>

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
