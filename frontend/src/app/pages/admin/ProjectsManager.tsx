import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Save, X, Loader2, UploadCloud, Eye, EyeOff } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import api, { toAbsoluteUrl } from '../../services/api';

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
}
const empty: ProjectForm = { title: '', category: 'Résidentiel', description: '', imageUrl: '', status: 'COMPLETED', isPublished: true };
type Filter = 'ALL' | 'COMPLETED' | 'ONGOING';

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>({ ...empty });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cms/admin/projects');
      setProjects(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch {
      flash('error', 'Erreur de chargement des projets.');
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
      title: p.title, category: p.category, description: p.description,
      imageUrl: p.imageUrl ?? '', status: p.status, isPublished: p.isPublished,
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
        description: form.description,
        category: form.category,
        imageUrl: form.imageUrl,
        status: form.status,
        isPublished: form.isPublished,
      };
      if (editing) {
        await api.put(`/cms/projects/${editing.id}`, payload);
        flash('success', 'Projet mis à jour.');
      } else {
        await api.post('/cms/projects', payload);
        flash('success', 'Projet créé.');
      }
      setIsOpen(false);
      fetchProjects();
    } catch (err: any) {
      flash('error', err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (p: Project) => {
    try {
      await api.patch(`/cms/projects/${p.id}/toggle-publish`);
      fetchProjects();
    } catch {
      flash('error', 'Erreur lors du changement de visibilité.');
    }
  };

  const remove = async (p: Project) => {
    if (!window.confirm(`Supprimer le projet « ${p.title} » ?`)) return;
    try {
      await api.delete(`/cms/projects/${p.id}`);
      flash('success', 'Projet supprimé.');
      fetchProjects();
    } catch {
      flash('error', 'Erreur lors de la suppression.');
    }
  };

  const shown = projects.filter((p) => filter === 'ALL' || p.status === filter);

  return (
    <div className="p-6">
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {feedback.msg}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Projets</h2>
          <p className="text-sm text-gray-500 mt-1">{loading ? '…' : `${projects.length} projet(s)`}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
            {([['ALL', 'Tous'], ['COMPLETED', 'Réalisés'], ['ONGOING', 'En cours']] as const).map(([v, label]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-3 py-1.5 font-medium ${filter === v ? 'bg-[#1A1A2E] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={openCreate} className="px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-xl font-semibold text-sm hover:bg-yellow-400 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouveau projet
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 animate-pulse">Chargement…</div>
      ) : shown.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16 text-gray-400">
          Aucun projet dans cette catégorie.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shown.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative">
                <img
                  src={p.imageUrl || 'https://placehold.co/600x400/e2e8f0/64748b?text=Projet'}
                  alt=""
                  className="w-full h-44 object-cover bg-gray-100"
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Projet'; }}
                />
                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${p.status === 'ONGOING' ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'}`}>
                  {p.status === 'ONGOING' ? 'En cours' : 'Réalisé'}
                </span>
                {!p.isPublished && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-800/80 text-white">Masqué</span>
                )}
              </div>
              <div className="p-4">
                <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{p.category}</span>
                <h4 className="mt-2 font-bold text-gray-900">{p.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{p.description}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(p)} className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1">
                    <Edit className="w-3.5 h-3.5" /> Modifier
                  </button>
                  <button onClick={() => togglePublish(p)} className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 ${p.isPublished ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                    {p.isPublished ? <><EyeOff className="w-3.5 h-3.5" /> Masquer</> : <><Eye className="w-3.5 h-3.5" /> Publier</>}
                  </button>
                  <button onClick={() => remove(p)} className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Modifier le projet' : 'Nouveau projet'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Titre *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] outline-none" placeholder="Ex : Tour Yasmine — Casablanca" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Catégorie *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] outline-none">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">État</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'ONGOING' | 'COMPLETED' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] outline-none">
                <option value="COMPLETED">Projet réalisé</option>
                <option value="ONGOING">Projet en cours</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Description * (≥ 10 caractères)</label>
            <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
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
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="accent-[#FFB300]" />
            Visible sur le site public
          </label>
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
