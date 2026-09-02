import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus, Trash2, ArrowUp, ArrowDown, Youtube, FileText, Loader2, Save, Eye, Video, UploadCloud,
} from 'lucide-react';
import api from '../../services/api';
import { uploadFile } from '../../services/upload';
import {
  PageHeader, Panel, PanelTitle, Btn, Chip, Field, Input, Modal, EmptyState,
  ToastHost, type Toast,
} from '../../components/ui';
import MediaEmbed, { resolveEmbed } from '../../components/shell/MediaEmbed';

interface Course { id: string; title: string; students: number; completionRate: number }
interface Lesson {
  id: string; title: string; videoUrl: string | null; documentUrl: string | null;
  sequenceOrder: number; quizzes: number; views: number;
}

const emptyLesson = { title: '', videoUrl: '', documentUrl: '' };

export default function InstructorCourseContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [preview, setPreview] = useState<Lesson | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [form, setForm] = useState({ ...emptyLesson });
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const videoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const flash = (kind: Toast['kind'], msg: string) => setToast({ kind, msg });

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/instructor/my-courses');
      setCourses(r.data ?? []);
      setSelId((p) => p ?? r.data?.[0]?.id ?? null);
    } catch {
      flash('err', 'Erreur de chargement des cours.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLessons = useCallback(async (courseId: string) => {
    setLoadingLessons(true);
    try {
      const r = await api.get(`/instructor/courses/${courseId}/lessons`);
      setLessons(r.data ?? []);
    } catch {
      flash('err', 'Erreur de chargement des leçons.');
    } finally {
      setLoadingLessons(false);
    }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { if (selId) loadLessons(selId); }, [selId, loadLessons]);

  const selected = courses.find((c) => c.id === selId) ?? null;

  const openCreate = () => { setEditing(null); setForm({ ...emptyLesson }); setModalOpen(true); };
  const openEdit = (l: Lesson) => {
    setEditing(l);
    setForm({ title: l.title, videoUrl: l.videoUrl ?? '', documentUrl: l.documentUrl ?? '' });
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/instructor/lessons/${editing.id}`, {
          title: form.title, videoUrl: form.videoUrl, documentUrl: form.documentUrl,
        });
        flash('ok', 'Leçon mise à jour.');
      } else {
        const payload: Record<string, unknown> = { courseId: selId, title: form.title, sequenceOrder: lessons.length + 1 };
        if (form.videoUrl.trim()) payload.videoUrl = form.videoUrl.trim();
        if (form.documentUrl.trim()) payload.documentUrl = form.documentUrl.trim();
        await api.post('/instructor/lessons', payload);
        flash('ok', 'Leçon ajoutée.');
      }
      setModalOpen(false);
      if (selId) loadLessons(selId);
    } catch (err: any) {
      flash('err', err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (l: Lesson) => {
    if (!window.confirm(`Supprimer la leçon « ${l.title} » ?`)) return;
    try {
      await api.delete(`/instructor/lessons/${l.id}`);
      flash('ok', 'Leçon supprimée.');
      if (selId) loadLessons(selId);
    } catch {
      flash('err', 'Suppression impossible.');
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...lessons];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setLessons(next);
    try {
      await api.patch(`/instructor/courses/${selId}/lessons/reorder`, { orderedIds: next.map((l) => l.id) });
    } catch {
      flash('err', 'Réordonnancement impossible.');
      if (selId) loadLessons(selId);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Formateur"
        title="Contenu des cours"
        description="Ajoutez des leçons : lien YouTube ou vidéo téléversée, support PDF. Les élèves lisent la vidéo directement dans la plateforme."
      />

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : courses.length === 0 ? (
        <EmptyState>Aucun cours assigné.</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="flex flex-col gap-2">
            {courses.map((c) => {
              const active = c.id === selId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelId(c.id)}
                  className={`a-card a-card-hover w-full p-3.5 text-left ${active ? '!border-[color:var(--a-accent)] shadow-[0_0_0_1px_var(--a-accent)]' : ''}`}
                >
                  <div className="font-semibold text-[color:var(--a-ink)]">{c.title}</div>
                  <div className="mt-1 text-[11px] text-[color:var(--a-ink-dim)]">{c.students} élève(s) · complétion {c.completionRate}%</div>
                </button>
              );
            })}
          </div>

          <Panel>
            <PanelTitle right={<Btn size="sm" variant="primary" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Nouvelle leçon</Btn>}>
              {selected?.title} — {lessons.length} leçon(s)
            </PanelTitle>

            {loadingLessons ? (
              <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
            ) : lessons.length === 0 ? (
              <EmptyState>Aucune leçon. Ajoutez la première.</EmptyState>
            ) : (
              <div className="flex flex-col gap-2">
                {lessons.map((l, i) => {
                  const emb = resolveEmbed(l.videoUrl);
                  return (
                    <div key={l.id} className="a-card flex items-center gap-3 p-3">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => move(i, -1)} disabled={i === 0} className="text-[color:var(--a-ink-dim)] disabled:opacity-30 hover:text-[color:var(--a-accent)]"><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button onClick={() => move(i, 1)} disabled={i === lessons.length - 1} className="text-[color:var(--a-ink-dim)] disabled:opacity-30 hover:text-[color:var(--a-accent)]"><ArrowDown className="h-3.5 w-3.5" /></button>
                      </div>
                      <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md bg-white/5 text-[12px] font-bold text-[color:var(--a-ink-soft)]">{l.sequenceOrder}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-[color:var(--a-ink)]">{l.title}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                          {emb.provider === 'youtube' && <Chip tone="red"><Youtube className="h-3 w-3" /> YouTube</Chip>}
                          {emb.provider === 'vimeo' && <Chip tone="blue">Vimeo</Chip>}
                          {emb.provider === 'file' && <Chip tone="blue"><Video className="h-3 w-3" /> Vidéo</Chip>}
                          {emb.provider === 'none' && <Chip tone="gray">Sans vidéo</Chip>}
                          {l.documentUrl && <Chip tone="gray"><FileText className="h-3 w-3" /> PDF</Chip>}
                          {l.quizzes > 0 && <Chip tone="amber">{l.quizzes} quiz</Chip>}
                          <span className="text-[color:var(--a-ink-dim)]">· {l.views} vue(s)</span>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 gap-1.5">
                        {emb.provider !== 'none' && <Btn size="sm" variant="ghost" onClick={() => setPreview(l)}><Eye className="h-3.5 w-3.5" /></Btn>}
                        <Btn size="sm" variant="ghost" onClick={() => openEdit(l)}>Éditer</Btn>
                        <Btn size="sm" variant="danger" onClick={() => remove(l)}><Trash2 className="h-3.5 w-3.5" /></Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Modale création / édition */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier la leçon' : 'Nouvelle leçon'}
        maxWidth={620}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Btn>
            <Btn variant="primary" onClick={submit} disabled={saving || !form.title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {editing ? 'Mettre à jour' : 'Ajouter'}
            </Btn>
          </>
        }
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Titre de la leçon">
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex : Introduction au calcul EC2" />
          </Field>

          <Field label="Vidéo — lien YouTube / Vimeo ou fichier téléversé" hint="L'élève regarde la vidéo dans la plateforme, sans quitter la page.">
            <div className="flex gap-2">
              <Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=…" />
              <button
                type="button"
                onClick={() => videoRef.current?.click()}
                disabled={uploadingVideo}
                className="a-btn a-btn-ghost"
                title="Téléverser une vidéo (mp4)"
              >
                {uploadingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              </button>
              <input
                ref={videoRef} type="file" accept="video/*" className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploadingVideo(true);
                  try {
                    const { url } = await uploadFile(f, 'video', 'courses');
                    setForm((s) => ({ ...s, videoUrl: url }));
                    flash('ok', 'Vidéo téléversée.');
                  } catch { flash('err', "Échec du téléversement de la vidéo."); }
                  finally { setUploadingVideo(false); }
                }}
              />
            </div>
            {resolveEmbed(form.videoUrl).provider !== 'none' && (
              <div className="mt-2"><MediaEmbed url={form.videoUrl} /></div>
            )}
          </Field>

          <Field label="Support PDF (optionnel)">
            <div className="flex gap-2">
              <Input value={form.documentUrl} onChange={(e) => setForm({ ...form, documentUrl: e.target.value })} placeholder="https://…/support.pdf" />
              <button
                type="button"
                onClick={() => docRef.current?.click()}
                disabled={uploadingDoc}
                className="a-btn a-btn-ghost"
              >
                {uploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              </button>
              <input
                ref={docRef} type="file" accept="application/pdf" className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploadingDoc(true);
                  try {
                    const { url } = await uploadFile(f, 'document', 'courses');
                    setForm((s) => ({ ...s, documentUrl: url }));
                    flash('ok', 'PDF téléversé.');
                  } catch { flash('err', "Échec du téléversement du PDF."); }
                  finally { setUploadingDoc(false); }
                }}
              />
            </div>
          </Field>
        </form>
      </Modal>

      {/* Aperçu vidéo */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title ?? ''} maxWidth={860}>
        <MediaEmbed url={preview?.videoUrl} />
        {preview?.documentUrl && (
          <a href={preview.documentUrl} target="_blank" rel="noreferrer" className="a-btn a-btn-ghost a-btn-sm mt-3">
            <FileText className="h-3.5 w-3.5" /> Ouvrir le support PDF
          </a>
        )}
      </Modal>

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
