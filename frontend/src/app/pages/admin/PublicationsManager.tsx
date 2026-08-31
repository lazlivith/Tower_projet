import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Save, X, Loader2, UploadCloud, Eye, EyeOff } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import api, { toAbsoluteUrl } from '../../services/api';

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

export default function PublicationsManager() {
  const [posts, setPosts] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Publication | null>(null);
  const [form, setForm] = useState<PubForm>({ ...empty });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cms/admin/publications');
      setPosts(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch {
      flash('error', 'Erreur de chargement des publications.');
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
      flash('error', "Échec de l'upload de l'image.");
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
        content: form.content,
        excerpt: form.excerpt,
        category: form.category,
        imageUrl: form.imageUrl,
        status: form.status,
      };
      if (editing) {
        await api.put(`/cms/publications/${editing.id}`, payload);
        flash('success', 'Publication mise à jour.');
      } else {
        await api.post('/cms/publications', payload);
        flash('success', 'Publication créée.');
      }
      setIsOpen(false);
      fetchPosts();
    } catch (err: any) {
      flash('error', err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (p: Publication) => {
    try {
      await api.patch(`/cms/publications/${p.id}/toggle-publish`);
      fetchPosts();
    } catch {
      flash('error', 'Erreur lors du changement de statut.');
    }
  };

  const remove = async (p: Publication) => {
    if (!window.confirm(`Supprimer la publication « ${p.title} » ?`)) return;
    try {
      await api.delete(`/cms/publications/${p.id}`);
      flash('success', 'Publication supprimée.');
      fetchPosts();
    } catch {
      flash('error', 'Erreur lors de la suppression.');
    }
  };

  const publishedCount = posts.filter((p) => p.status === 'PUBLISHED').length;

  return (
    <div className="p-6">
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {feedback.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Blog / Publications</h2>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '…' : `${posts.length} publication(s) · ${publishedCount} en ligne`}
          </p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-xl font-semibold text-sm hover:bg-yellow-400 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle publication
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 animate-pulse">Chargement…</div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16 text-gray-400">
          Aucune publication. Créez-en une pour alimenter la page Blog du site.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4">
              <img
                src={p.imageUrl || 'https://placehold.co/160x120/e2e8f0/64748b?text=Article'}
                alt=""
                className="w-32 h-24 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/160x120/e2e8f0/64748b?text=Article'; }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 truncate">{p.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${p.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {p.status === 'PUBLISHED' ? 'En ligne' : 'Brouillon'}
                  </span>
                  {p.category && <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700">{p.category}</span>}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{p.excerpt || p.content}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(p)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1">
                    <Edit className="w-3.5 h-3.5" /> Modifier
                  </button>
                  <button onClick={() => toggle(p)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 ${p.status === 'PUBLISHED' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                    {p.status === 'PUBLISHED' ? <><EyeOff className="w-3.5 h-3.5" /> Dépublier</> : <><Eye className="w-3.5 h-3.5" /> Publier</>}
                  </button>
                  <button onClick={() => remove(p)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Modifier la publication' : 'Nouvelle publication'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Titre *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Catégorie</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] outline-none">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Statut</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'DRAFT' | 'PUBLISHED' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] outline-none">
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publié</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Chapô / extrait</label>
            <textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Contenu * (≥ 10 caractères)</label>
            <textarea required rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Image</label>
            <div className="flex gap-2">
              <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] outline-none" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-60">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} Upload
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </div>
            {form.imageUrl && <img src={form.imageUrl} alt="" className="mt-2 h-40 w-full object-cover rounded-lg" />}
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-[#FFC107] text-[#1A1A2E] font-bold rounded-lg hover:bg-yellow-400 flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editing ? 'Mettre à jour' : 'Créer'}
            </button>
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <X className="w-4 h-4" /> Annuler
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
