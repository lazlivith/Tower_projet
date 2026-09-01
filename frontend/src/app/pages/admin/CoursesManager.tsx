import { useState, useEffect } from 'react';
import { Users, Plus, BookOpen, CheckCircle, X, Loader, FileText } from 'lucide-react';
import api from '../../services/api';

type Instructor = { id: string; nom: string; email: string };
type Course = {
  id: string; title: string; description?: string; price: number; level: string; durationHours: number; imageUrl?: string;
  audience?: string | null; prerequisites?: string | null; format?: string | null; priceLabel?: string | null;
  objectives?: string[] | null;
};

const emptyForm = {
  title: '', description: '', price: '', classroomName: '', imageUrl: '', level: 'Débutant', durationHours: '',
  audience: '', prerequisites: '', format: '', priceLabel: '', objectives: '',
};

type Form = typeof emptyForm;

function FicheFields({ form, set }: { form: Form; set: (patch: Partial<Form>) => void }) {
  const cls = 'w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none';
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Public visé</label>
        <textarea rows={2} className={cls} value={form.audience} onChange={(e) => set({ audience: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Prérequis</label>
        <textarea rows={2} className={cls} value={form.prerequisites} onChange={(e) => set({ prerequisites: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Modalités / format</label>
          <input className={cls} value={form.format} onChange={(e) => set({ format: e.target.value })} placeholder="35 h (5 j) — présentiel ou classe virtuelle" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tarif (libellé affiché)</label>
          <input className={cls} value={form.priceLabel} onChange={(e) => set({ priceLabel: e.target.value })} placeholder="6 500 MAD HT / participant" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Objectifs pédagogiques — un par ligne</label>
        <textarea rows={4} className={cls} value={form.objectives} onChange={(e) => set({ objectives: e.target.value })} placeholder={'Maîtriser…\nModéliser…\nGénérer…'} />
      </div>
      <p className="text-[11px] text-gray-400">
        Le programme détaillé jour par jour (« syllabus ») se gère via <code>npm run seed:formations</code>.
      </p>
    </>
  );
}

export default function CoursesManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{ courseId: string; title: string } | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [courseForm, setCourseForm] = useState({ ...emptyForm });
  const [editTarget, setEditTarget] = useState<Course | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [savingEdit, setSavingEdit] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const buildFicheFields = (f: typeof emptyForm) => {
    const out: Record<string, unknown> = {};
    if (f.audience.trim()) out.audience = f.audience.trim();
    if (f.prerequisites.trim()) out.prerequisites = f.prerequisites.trim();
    if (f.format.trim()) out.format = f.format.trim();
    if (f.priceLabel.trim()) out.priceLabel = f.priceLabel.trim();
    const objs = f.objectives.split('\n').map((s) => s.trim()).filter(Boolean);
    if (objs.length) out.objectives = objs;
    return out;
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, usersRes] = await Promise.all([
        api.get('/courses'),
        api.get('/admin/users')
      ]);
      setCourses(coursesRes.data?.data || coursesRes.data || []);
      const allUsers = usersRes.data?.data || usersRes.data || [];
      setInstructors(allUsers.filter((u: any) => u.role === 'INSTRUCTOR'));
    } catch (err) {
      showFeedback('error', 'Erreur de chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        title: courseForm.title,
        description: courseForm.description,
        price: Number(courseForm.price),
        level: courseForm.level,
      };
      if (courseForm.classroomName.trim()) payload.classroomName = courseForm.classroomName.trim();
      if (courseForm.imageUrl.trim()) payload.imageUrl = courseForm.imageUrl.trim();
      if (courseForm.durationHours) payload.durationHours = Number(courseForm.durationHours);
      Object.assign(payload, buildFicheFields(courseForm));

      await api.post('/admin/courses', payload);
      showFeedback('success', `Formation "${courseForm.title}" créée avec succès !`);
      setCourseForm({ ...emptyForm });
      fetchData();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (c: Course) => {
    setEditTarget(c);
    setEditForm({
      ...emptyForm,
      title: c.title, description: c.description || '', price: String(c.price ?? ''),
      imageUrl: c.imageUrl || '', level: c.level || 'Débutant', durationHours: String(c.durationHours ?? ''),
      audience: c.audience || '', prerequisites: c.prerequisites || '', format: c.format || '',
      priceLabel: c.priceLabel || '',
      objectives: Array.isArray(c.objectives) ? c.objectives.join('\n') : '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSavingEdit(true);
    try {
      const payload: Record<string, unknown> = {
        title: editForm.title,
        description: editForm.description,
        price: Number(editForm.price),
        level: editForm.level,
        imageUrl: editForm.imageUrl.trim(),
        ...buildFicheFields(editForm),
      };
      if (editForm.durationHours) payload.durationHours = Number(editForm.durationHours);
      await api.put(`/admin/courses/${editTarget.id}`, payload);
      showFeedback('success', 'Formation mise à jour.');
      setEditTarget(null);
      fetchData();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAssignInstructor = async () => {
    if (!assignTarget || !selectedInstructor) return;
    try {
      await api.patch(`/admin/courses/${assignTarget.courseId}/assign-instructor`, { instructorId: selectedInstructor });
      showFeedback('success', `Instructeur assigné à "${assignTarget.title}" avec succès !`);
      setAssignTarget(null);
      setSelectedInstructor('');
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || "Erreur lors de l'assignation.");
    }
  };

  const levelLabels: Record<string, string> = {
    'Débutant': 'Débutant', 'Intermédiaire': 'Intermédiaire', 'Avancé': 'Avancé',
    DEBUTANT: 'Débutant', INTERMEDIAIRE: 'Intermédiaire', AVANCE: 'Avancé',
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Chargement des formations...</div>;

  return (
    <div className="p-6 space-y-8">
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium flex items-center gap-3 transition-all ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {feedback.message}
        </div>
      )}

      {/* Modal édition formation */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-start justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl my-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Éditer la formation</h3>
              <button type="button" onClick={() => setEditTarget(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-700" /></button>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre *</label>
              <input required className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#FFC107] outline-none" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
              <textarea required rows={3} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#FFC107] outline-none resize-none" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prix (DH) *</label>
                <input required type="number" min="0" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#FFC107] outline-none" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Durée (h)</label>
                <input type="number" min="0" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#FFC107] outline-none" value={editForm.durationHours} onChange={(e) => setEditForm({ ...editForm, durationHours: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Niveau</label>
                <select className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#FFC107] outline-none" value={editForm.level} onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}>
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Avancé">Avancé</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image (URL)</label>
              <input type="url" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#FFC107] outline-none" value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} />
            </div>
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="text-sm font-semibold text-gray-700">Fiche pédagogique vitrine</div>
              <FicheFields form={editForm} set={(patch) => setEditForm({ ...editForm, ...patch })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditTarget(null)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium">Annuler</button>
              <button type="submit" disabled={savingEdit} className="flex-1 px-4 py-2.5 bg-[#FFC107] text-[#1A1A2E] rounded-xl font-bold hover:bg-yellow-400 disabled:opacity-60 flex items-center justify-center gap-2">
                {savingEdit ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal assignation */}
      {assignTarget && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Assigner un instructeur</h3>
            <p className="text-gray-500 text-sm mb-6">Formation : <span className="font-semibold text-gray-800">{assignTarget.title}</span></p>
            <select
              value={selectedInstructor}
              onChange={e => setSelectedInstructor(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 mb-6 focus:ring-2 focus:ring-[#FFC107] focus:border-[#FFC107] outline-none"
            >
              <option value="">-- Choisir un instructeur --</option>
              {instructors.map(i => (
                <option key={i.id} value={i.id}>{i.nom} ({i.email})</option>
              ))}
            </select>
            {instructors.length === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">⚠️ Aucun instructeur créé. Créez d'abord un instructeur dans "Utilisateurs".</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setAssignTarget(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium">Annuler</button>
              <button onClick={handleAssignInstructor} disabled={!selectedInstructor} className="flex-1 px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-xl font-bold hover:bg-yellow-400 transition-colors text-sm disabled:opacity-50">Assigner</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Formulaire de création */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#FFC107]" /> Créer une Formation
          </h2>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre *</label>
              <input required type="text" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#FFC107] outline-none" value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="Ex: BIM & Eurocodes - Niveau 1" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
              <textarea required rows={3} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#FFC107] outline-none resize-none" value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="Décrivez le contenu de la formation..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prix (DH) *</label>
                <input required type="number" min="0" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#FFC107] outline-none" value={courseForm.price} onChange={e => setCourseForm({ ...courseForm, price: e.target.value })} placeholder="2500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Durée (h) *</label>
                <input required type="number" min="1" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#FFC107] outline-none" value={courseForm.durationHours} onChange={e => setCourseForm({ ...courseForm, durationHours: e.target.value })} placeholder="40" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Niveau</label>
                <select className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#FFC107] outline-none" value={courseForm.level} onChange={e => setCourseForm({ ...courseForm, level: e.target.value })}>
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Avancé">Avancé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom de classe</label>
                <input type="text" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#FFC107] outline-none" value={courseForm.classroomName} onChange={e => setCourseForm({ ...courseForm, classroomName: e.target.value })} placeholder="Promo 2026" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image (URL)</label>
              <input type="url" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#FFC107] outline-none" value={courseForm.imageUrl} onChange={e => setCourseForm({ ...courseForm, imageUrl: e.target.value })} placeholder="https://..." />
            </div>

            <details className="rounded-xl border border-gray-200 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-gray-700">Fiche pédagogique vitrine (optionnel)</summary>
              <div className="mt-4 space-y-3">
                <FicheFields form={courseForm} set={(patch) => setCourseForm({ ...courseForm, ...patch })} />
              </div>
            </details>

            <button type="submit" disabled={creating} className="w-full bg-[#FFC107] text-[#1A1A2E] font-bold py-3.5 rounded-xl hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {creating ? <Loader className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {creating ? 'Création en cours...' : 'Créer la formation'}
            </button>
          </form>
        </div>

        {/* Liste des formations */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#1A1A2E]" /> Formations existantes ({courses.length})
          </h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {courses.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aucune formation créée</p>
                <p className="text-sm mt-1">Utilisez le formulaire ci-contre pour créer votre première formation.</p>
              </div>
            ) : courses.map(course => (
              <div key={course.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{course.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">{levelLabels[course.level] || course.level}</span>
                      <span>{course.durationHours}h</span>
                      <span className="font-semibold text-green-600">{course.price?.toLocaleString()} DH</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openEdit(course)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
                  >
                    <FileText className="w-4 h-4" /> Éditer la fiche
                  </button>
                  <button
                    onClick={() => setAssignTarget({ courseId: course.id, title: course.title })}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
                  >
                    <Users className="w-4 h-4" /> Instructeur
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
