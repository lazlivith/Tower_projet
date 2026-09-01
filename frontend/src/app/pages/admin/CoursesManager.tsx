import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, FileText, Layers, Eye, EyeOff, UploadCloud, Save } from 'lucide-react';
import api from '../../services/api';
import { uploadFile } from '../../services/upload';
import {
  PageHeader, Panel, PanelTitle, Btn, Chip, Field, Input, Select, Textarea,
  Modal, EmptyState, ToastHost, type Toast,
} from '../../components/admin/ui';

type CourseRow = {
  id: string; title: string; level: string | null; price: number; priceLabel: string | null;
  durationHours: number | null; imageUrl: string | null; isPublished: boolean;
  objectives: string[]; counts: { students: number; lessons: number; classrooms: number; videos: number };
};
type CourseDetail = CourseRow & {
  description?: string; audience?: string | null; prerequisites?: string | null; format?: string | null;
};

const emptyForm = {
  title: '', description: '', price: '', classroomName: '', imageUrl: '', level: 'Débutant', durationHours: '',
  audience: '', prerequisites: '', format: '', priceLabel: '', objectives: '',
};
type Form = typeof emptyForm;

function FicheFields({ form, set }: { form: Form; set: (patch: Partial<Form>) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Public visé"><Textarea rows={2} value={form.audience} onChange={(e) => set({ audience: e.target.value })} /></Field>
      <Field label="Prérequis"><Textarea rows={2} value={form.prerequisites} onChange={(e) => set({ prerequisites: e.target.value })} /></Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Modalités / format"><Input value={form.format} onChange={(e) => set({ format: e.target.value })} placeholder="35 h (5 j) — présentiel ou classe virtuelle" /></Field>
        <Field label="Tarif (libellé affiché)"><Input value={form.priceLabel} onChange={(e) => set({ priceLabel: e.target.value })} placeholder="6 500 MAD HT / participant" /></Field>
      </div>
      <Field label="Objectifs pédagogiques — un par ligne">
        <Textarea rows={4} value={form.objectives} onChange={(e) => set({ objectives: e.target.value })} placeholder={'Maîtriser…\nModéliser…\nGénérer…'} />
      </Field>
      <p className="text-[11px] text-[color:var(--a-ink-dim)]">
        Le programme détaillé jour par jour (« syllabus ») se gère via <code>npm run seed:formations</code>.
      </p>
    </div>
  );
}

const buildFiche = (f: Form) => {
  const out: Record<string, unknown> = {};
  if (f.audience.trim()) out.audience = f.audience.trim();
  if (f.prerequisites.trim()) out.prerequisites = f.prerequisites.trim();
  if (f.format.trim()) out.format = f.format.trim();
  if (f.priceLabel.trim()) out.priceLabel = f.priceLabel.trim();
  const objs = f.objectives.split('\n').map((s) => s.trim()).filter(Boolean);
  if (objs.length) out.objectives = objs;
  return out;
};

export default function CoursesManager() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [courseForm, setCourseForm] = useState<Form>({ ...emptyForm });
  const [editTarget, setEditTarget] = useState<CourseDetail | null>(null);
  const [editForm, setEditForm] = useState<Form>({ ...emptyForm });
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (kind: Toast['kind'], msg: string) => setToast({ kind, msg });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/academy/courses');
      setCourses(res.data ?? []);
    } catch {
      flash('err', 'Erreur de chargement des formations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const upload = async (file: File, apply: (url: string) => void) => {
    setUploading(true);
    try {
      const { url } = await uploadFile(file, 'image', 'courses');
      if (url) apply(url);
    } catch {
      flash('err', "Échec de l'upload de l'image.");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        title: courseForm.title, description: courseForm.description,
        price: Number(courseForm.price), level: courseForm.level,
      };
      if (courseForm.classroomName.trim()) payload.classroomName = courseForm.classroomName.trim();
      if (courseForm.imageUrl.trim()) payload.imageUrl = courseForm.imageUrl.trim();
      if (courseForm.durationHours) payload.durationHours = Number(courseForm.durationHours);
      Object.assign(payload, buildFiche(courseForm));
      await api.post('/admin/courses', payload);
      flash('ok', `Formation « ${courseForm.title} » créée.`);
      setCourseForm({ ...emptyForm });
      fetchData();
    } catch (err: any) {
      flash('err', err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = async (c: CourseRow) => {
    // récupère les champs texte complets via le endpoint contenu
    let full: any = c;
    try {
      const res = await api.get(`/admin/academy/courses/${c.id}/content`);
      full = { ...c, ...res.data };
    } catch { /* fallback sur la ligne */ }
    setEditTarget(full);
    setEditForm({
      ...emptyForm,
      title: full.title ?? c.title, description: full.description ?? '', price: String(c.price ?? ''),
      imageUrl: c.imageUrl ?? '', level: c.level ?? 'Débutant', durationHours: String(c.durationHours ?? ''),
      audience: full.audience ?? '', prerequisites: full.prerequisites ?? '', format: full.format ?? '',
      priceLabel: c.priceLabel ?? '',
      objectives: Array.isArray(full.objectives) ? full.objectives.join('\n') : '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSavingEdit(true);
    try {
      const payload: Record<string, unknown> = {
        title: editForm.title, description: editForm.description,
        price: Number(editForm.price), level: editForm.level,
        imageUrl: editForm.imageUrl.trim(), ...buildFiche(editForm),
      };
      if (editForm.durationHours) payload.durationHours = Number(editForm.durationHours);
      await api.put(`/admin/courses/${editTarget.id}`, payload);
      flash('ok', 'Formation mise à jour.');
      setEditTarget(null);
      fetchData();
    } catch (err: any) {
      flash('err', err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSavingEdit(false);
    }
  };

  const togglePublish = async (c: CourseRow) => {
    try {
      await api.put(`/admin/courses/${c.id}`, { isPublished: !c.isPublished });
      flash('ok', c.isPublished ? 'Formation retirée du site.' : 'Formation publiée sur le site.');
      fetchData();
    } catch {
      flash('err', 'Erreur lors du changement de visibilité.');
    }
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        eyebrow="Académie"
        title="Formations"
        description="Créez les formations et leur fiche pédagogique vitrine. Les classes et l'affectation des formateurs se gèrent dans « Classes & contenus »."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        {/* Création */}
        <Panel>
          <PanelTitle>Créer une formation</PanelTitle>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <Field label="Titre"><Input required value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="Ex : BIM & Eurocodes — Niveau 1" /></Field>
            <Field label="Description"><Textarea required rows={3} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prix (MAD)"><Input required type="number" min="0" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} placeholder="6500" /></Field>
              <Field label="Durée (h)"><Input required type="number" min="1" value={courseForm.durationHours} onChange={(e) => setCourseForm({ ...courseForm, durationHours: e.target.value })} placeholder="35" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Niveau">
                <Select value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}>
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Avancé">Avancé</option>
                </Select>
              </Field>
              <Field label="1ʳᵉ classe"><Input value={courseForm.classroomName} onChange={(e) => setCourseForm({ ...courseForm, classroomName: e.target.value })} placeholder="Promotion 2026" /></Field>
            </div>
            <Field label="Image de couverture">
              <div className="flex gap-2">
                <Input value={courseForm.imageUrl} onChange={(e) => setCourseForm({ ...courseForm, imageUrl: e.target.value })} placeholder="https://…" />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="a-btn a-btn-ghost">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], (url) => setCourseForm((f) => ({ ...f, imageUrl: url })))} />
              </div>
            </Field>

            <details className="a-card rounded-xl p-4">
              <summary className="cursor-pointer text-[13px] font-semibold text-[color:var(--a-ink)]">Fiche pédagogique vitrine (optionnel)</summary>
              <div className="mt-4"><FicheFields form={courseForm} set={(patch) => setCourseForm({ ...courseForm, ...patch })} /></div>
            </details>

            <Btn variant="primary" type="submit" disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {creating ? 'Création…' : 'Créer la formation'}
            </Btn>
          </form>
        </Panel>

        {/* Liste */}
        <Panel>
          <PanelTitle right={<span className="text-[12px] text-[color:var(--a-ink-dim)]">{courses.length} formation(s)</span>}>
            Formations existantes
          </PanelTitle>
          {loading ? (
            <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
          ) : courses.length === 0 ? (
            <EmptyState>Aucune formation. Utilisez le formulaire pour créer la première.</EmptyState>
          ) : (
            <div className="a-scroll flex max-h-[calc(100vh-230px)] flex-col gap-3 overflow-y-auto pr-1">
              {courses.map((c) => (
                <div key={c.id} className="a-card p-4">
                  <div className="flex items-start gap-3">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt="" className="h-14 w-20 flex-shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="grid h-14 w-20 flex-shrink-0 place-items-center rounded-lg bg-white/5 text-[color:var(--a-ink-dim)]"><FileText className="h-5 w-5" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-[13.5px] text-[color:var(--a-ink)]">{c.title}</h4>
                        {c.isPublished ? <Chip tone="green">Publié</Chip> : <Chip tone="gray">Brouillon</Chip>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-[color:var(--a-ink-dim)]">
                        {c.level && <Chip tone="blue">{c.level}</Chip>}
                        <span>{c.durationHours ?? '—'} h</span>
                        <span className="text-[color:var(--a-accent-2)]">{c.priceLabel || `${c.price?.toLocaleString('fr-FR')} MAD`}</span>
                        <span>· {c.counts.classrooms} classes · {c.counts.students} élèves · {c.counts.videos}/{c.counts.lessons} vidéos</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Btn size="sm" variant="ghost" onClick={() => openEdit(c)}><FileText className="h-3.5 w-3.5" /> Éditer la fiche</Btn>
                    <Btn size="sm" variant="accent" onClick={() => togglePublish(c)}>
                      {c.isPublished ? <><EyeOff className="h-3.5 w-3.5" /> Retirer du site</> : <><Eye className="h-3.5 w-3.5" /> Publier</>}
                    </Btn>
                    <Link to="/learn/admin/academy" className="a-btn a-btn-ghost a-btn-sm"><Layers className="h-3.5 w-3.5" /> Classes & contenu</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Éditer — ${editTarget?.title ?? ''}`}
        maxWidth={720}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setEditTarget(null)}>Annuler</Btn>
            <Btn variant="primary" onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
            </Btn>
          </>
        }
      >
        <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
          <Field label="Titre"><Input required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></Field>
          <Field label="Description"><Textarea required rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Prix (MAD)"><Input required type="number" min="0" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} /></Field>
            <Field label="Durée (h)"><Input type="number" min="0" value={editForm.durationHours} onChange={(e) => setEditForm({ ...editForm, durationHours: e.target.value })} /></Field>
            <Field label="Niveau">
              <Select value={editForm.level} onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}>
                <option value="Débutant">Débutant</option>
                <option value="Intermédiaire">Intermédiaire</option>
                <option value="Avancé">Avancé</option>
              </Select>
            </Field>
          </div>
          <Field label="Image (URL)"><Input value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} /></Field>
          <div className="a-card rounded-xl p-4">
            <div className="mb-3 text-[13px] font-semibold text-[color:var(--a-ink)]">Fiche pédagogique vitrine</div>
            <FicheFields form={editForm} set={(patch) => setEditForm({ ...editForm, ...patch })} />
          </div>
        </form>
      </Modal>

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
