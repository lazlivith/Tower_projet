import { useEffect, useState, useCallback } from 'react';
import {
  GraduationCap, Users2, PlayCircle, FileText, Plus, Trash2, UserCheck,
  Video, ExternalLink, BookOpen, Layers,
} from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import {
  PageHeader, Panel, PanelTitle, Btn, Chip, Field, Input, Select, Modal,
  EmptyState, Tabs, ToastHost, type Toast,
} from '../../components/ui';

interface Classroom { id: string; name: string; students: number; instructor: { id: string; nom: string; email: string } | null }
interface Lesson { id: string; title: string; videoUrl: string | null; documentUrl: string | null; sequenceOrder: number }
interface CourseRow {
  id: string; title: string; level: string | null; isPublished: boolean;
  counts: { students: number; lessons: number; classrooms: number; videos: number };
  classrooms: Classroom[]; lessons: Lesson[];
}
interface SyllabusDay { label?: string; title: string; points?: string[] }
interface CourseContent {
  id: string; title: string; description: string; level: string | null; durationHours: number | null;
  priceLabel: string | null; audience: string | null; prerequisites: string | null;
  objectives: string[]; syllabus: SyllabusDay[];
  lessons: (Lesson & { quizzes: number })[];
  classrooms: { id: string; name: string; instructor: Classroom['instructor']; students: { id: string; nom: string; email: string; accessStatus: string }[] }[];
}
interface InstructorLite { id: string; nom: string; email: string }

export default function AcademyManager() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [instructors, setInstructors] = useState<InstructorLite[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [content, setContent] = useState<CourseContent | null>(null);
  const [tab, setTab] = useState<'classes' | 'content'>('classes');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [newClassModal, setNewClassModal] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', instructorId: '' });
  const [busy, setBusy] = useState(false);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, iRes] = await Promise.all([
        api.get('/admin/academy/courses'),
        api.get('/admin/instructors'),
      ]);
      const list: CourseRow[] = cRes.data ?? [];
      setCourses(list);
      setInstructors((iRes.data ?? []).map((i: any) => ({ id: i.id, nom: i.nom, email: i.email })));
      setSelId((prev) => prev ?? list[0]?.id ?? null);
    } catch {
      setToast({ kind: 'err', msg: 'Erreur de chargement des formations.' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadContent = useCallback(async (id: string) => {
    setContent(null);
    try {
      const res = await api.get(`/admin/academy/courses/${id}/content`);
      setContent(res.data);
    } catch {
      setToast({ kind: 'err', msg: 'Erreur de chargement du contenu.' });
    }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { if (selId) loadContent(selId); }, [selId, loadContent]);

  const selected = courses.find((c) => c.id === selId) ?? null;
  const refresh = () => { loadCourses(); if (selId) loadContent(selId); };

  const assignInstructor = async (classroomId: string, instructorId: string) => {
    try {
      await api.patch(`/admin/classrooms/${classroomId}`, { instructorId: instructorId || null });
      setToast({ kind: 'ok', msg: instructorId ? 'Formateur assigné.' : 'Formateur retiré.' });
      refresh();
    } catch (e: any) {
      setToast({ kind: 'err', msg: e?.response?.data?.message ?? "Échec de l'assignation." });
    }
  };

  const deleteClass = async (c: Classroom) => {
    if (!window.confirm(`Supprimer la classe « ${c.name} » ?`)) return;
    try {
      await api.delete(`/admin/classrooms/${c.id}`);
      setToast({ kind: 'ok', msg: 'Classe supprimée.' });
      refresh();
    } catch (e: any) {
      setToast({ kind: 'err', msg: e?.response?.data?.message ?? 'Suppression impossible.' });
    }
  };

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selId) return;
    setBusy(true);
    try {
      await api.post('/admin/classrooms', {
        courseId: selId,
        name: newClass.name.trim(),
        instructorId: newClass.instructorId || undefined,
      });
      setToast({ kind: 'ok', msg: 'Classe créée.' });
      setNewClassModal(false);
      setNewClass({ name: '', instructorId: '' });
      refresh();
    } catch (e: any) {
      setToast({ kind: 'err', msg: e?.response?.data?.message ?? 'Création impossible.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Académie"
        title="Classes & contenus"
        description="Assignez les formateurs aux classes en ligne et visualisez les programmes, cours et vidéos téléversés."
      />

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : courses.length === 0 ? (
        <EmptyState>Aucune formation. Créez-en une depuis « Formations ».</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Liste des formations */}
          <div className="a-scroll flex max-h-[calc(100vh-200px)] flex-col gap-2 overflow-y-auto pr-1">
            {courses.map((c) => {
              const active = c.id === selId;
              const orphanClasses = c.classrooms.filter((cl) => !cl.instructor).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelId(c.id)}
                  className={`a-card a-card-hover w-full p-3.5 text-left ${active ? '!border-[color:var(--a-accent)] shadow-[0_0_0_1px_var(--a-accent)]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[13.5px] leading-snug text-[color:var(--a-ink)]">{c.title}</h3>
                    {c.isPublished ? <Chip tone="green">Publié</Chip> : <Chip tone="gray">Brouillon</Chip>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-[color:var(--a-ink-dim)]">
                    <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" /> {c.counts.classrooms} classes</span>
                    <span className="inline-flex items-center gap-1"><Users2 className="h-3 w-3" /> {c.counts.students}</span>
                    <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" /> {c.counts.videos}/{c.counts.lessons}</span>
                  </div>
                  {orphanClasses > 0 && (
                    <div className="mt-1.5 text-[11px] text-[color:var(--a-accent-2)]">{orphanClasses} classe(s) sans prof</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Détail */}
          <div>
            {!selected ? (
              <EmptyState>Sélectionnez une formation.</EmptyState>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[1.15rem] text-[color:var(--a-ink)]">{selected.title}</h2>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selected.level && <Chip tone="blue">{selected.level}</Chip>}
                      <Chip tone="gray"><GraduationCap className="h-3 w-3" /> {selected.counts.students} élèves</Chip>
                      <Chip tone="gray"><PlayCircle className="h-3 w-3" /> {selected.counts.lessons} leçons</Chip>
                    </div>
                  </div>
                  <Tabs
                    active={tab}
                    onChange={setTab}
                    tabs={[{ id: 'classes', label: 'Classes' }, { id: 'content', label: 'Programme & vidéos' }]}
                  />
                </div>

                {tab === 'classes' && (
                  <Panel>
                    <PanelTitle right={<Btn size="sm" variant="primary" onClick={() => setNewClassModal(true)}><Plus className="h-3.5 w-3.5" /> Nouvelle classe</Btn>}>
                      Classes en ligne ({selected.classrooms.length})
                    </PanelTitle>
                    {selected.classrooms.length === 0 ? (
                      <EmptyState>Aucune classe. Créez-en une pour accueillir des élèves.</EmptyState>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {selected.classrooms.map((cl) => (
                          <div key={cl.id} className="a-card flex flex-wrap items-center gap-3 p-3.5">
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-[color:var(--a-ink)]">{cl.name}</div>
                              <div className="text-[11px] text-[color:var(--a-ink-dim)]">{cl.students} élève(s)</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <UserCheck className={`h-4 w-4 ${cl.instructor ? 'text-[color:var(--a-ok)]' : 'text-[color:var(--a-ink-dim)]'}`} />
                              <Select
                                value={cl.instructor?.id ?? ''}
                                onChange={(e) => assignInstructor(cl.id, e.target.value)}
                                className="!w-[210px] !py-1.5 !text-[12.5px]"
                              >
                                <option value="">— Sans formateur —</option>
                                {instructors.map((i) => <option key={i.id} value={i.id}>{i.nom}</option>)}
                              </Select>
                            </div>
                            <Btn size="sm" variant="danger" onClick={() => deleteClass(cl)} disabled={cl.students > 0} title={cl.students > 0 ? 'Déplacez les élèves avant de supprimer' : undefined}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Btn>
                          </div>
                        ))}
                      </div>
                    )}
                  </Panel>
                )}

                {tab === 'content' && (
                  <div className="flex flex-col gap-4">
                    {!content ? (
                      <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement du contenu…</div>
                    ) : (
                      <>
                        {/* Programme pédagogique */}
                        <Panel>
                          <PanelTitle>Programme pédagogique</PanelTitle>
                          {content.objectives.length > 0 && (
                            <div className="mb-4">
                              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--a-ink-dim)]">Objectifs</div>
                              <ul className="flex flex-col gap-1 text-[13px]">
                                {content.objectives.map((o, i) => (
                                  <li key={i} className="flex gap-2"><span className="text-[color:var(--a-accent)]">•</span>{o}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {content.syllabus.length > 0 ? (
                            <ol className="flex flex-col gap-2">
                              {content.syllabus.map((d, i) => (
                                <li key={i} className="a-card p-3">
                                  <div className="flex items-center gap-2">
                                    {d.label && <Chip tone="amber">{d.label}</Chip>}
                                    <span className="font-semibold text-[color:var(--a-ink)]">{d.title}</span>
                                  </div>
                                  {d.points && d.points.length > 0 && (
                                    <ul className="mt-1.5 flex flex-col gap-0.5 pl-1 text-[12.5px] text-[color:var(--a-ink-soft)]">
                                      {d.points.map((p, j) => <li key={j} className="flex gap-2"><span className="text-[color:var(--a-ink-dim)]">–</span>{p}</li>)}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p className="text-[12.5px] text-[color:var(--a-ink-dim)]">Programme non renseigné (voir « Formations » → fiche pédagogique).</p>
                          )}
                        </Panel>

                        {/* Leçons & vidéos téléversées */}
                        <Panel>
                          <PanelTitle right={<span className="text-[12px] text-[color:var(--a-ink-dim)]">{content.lessons.filter((l) => l.videoUrl).length} vidéo(s) · {content.lessons.length} leçon(s)</span>}>
                            Cours & vidéos (téléversés par les formateurs)
                          </PanelTitle>
                          {content.lessons.length === 0 ? (
                            <EmptyState>Aucune leçon publiée par les formateurs pour l'instant.</EmptyState>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {content.lessons.map((l) => (
                                <div key={l.id} className="a-card flex items-center gap-3 p-3">
                                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md bg-white/5 text-[12px] font-bold text-[color:var(--a-ink-soft)]">
                                    {l.sequenceOrder}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium text-[color:var(--a-ink)]">{l.title}</div>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[color:var(--a-ink-dim)]">
                                      {l.videoUrl ? <Chip tone="blue"><Video className="h-3 w-3" /> Vidéo</Chip> : <Chip tone="gray">Sans vidéo</Chip>}
                                      {l.documentUrl && <Chip tone="gray"><FileText className="h-3 w-3" /> Doc</Chip>}
                                      {l.quizzes > 0 && <Chip tone="amber">{l.quizzes} quiz</Chip>}
                                    </div>
                                  </div>
                                  <div className="flex flex-shrink-0 gap-1.5">
                                    {l.videoUrl && (
                                      <a href={toAbsoluteUrl(l.videoUrl)} target="_blank" rel="noreferrer" className="a-btn a-btn-ghost a-btn-sm">
                                        <ExternalLink className="h-3.5 w-3.5" /> Vidéo
                                      </a>
                                    )}
                                    {l.documentUrl && (
                                      <a href={toAbsoluteUrl(l.documentUrl)} target="_blank" rel="noreferrer" className="a-btn a-btn-ghost a-btn-sm">
                                        <FileText className="h-3.5 w-3.5" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Panel>

                        {/* Répartition élèves par classe */}
                        <Panel>
                          <PanelTitle>Élèves par classe</PanelTitle>
                          {content.classrooms.every((c) => c.students.length === 0) ? (
                            <EmptyState>Aucun élève inscrit.</EmptyState>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {content.classrooms.map((cl) => (
                                <div key={cl.id}>
                                  <div className="mb-1.5 flex items-center gap-2 text-[12.5px]">
                                    <BookOpen className="h-3.5 w-3.5 text-[color:var(--a-accent)]" />
                                    <span className="font-semibold text-[color:var(--a-ink)]">{cl.name}</span>
                                    <span className="text-[color:var(--a-ink-dim)]">· {cl.instructor?.nom ?? 'sans prof'}</span>
                                  </div>
                                  {cl.students.length === 0 ? (
                                    <div className="pl-5 text-[12px] text-[color:var(--a-ink-dim)]">Aucun élève.</div>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5 pl-5">
                                      {cl.students.map((s) => (
                                        <span key={s.id} className={`a-chip ${s.accessStatus === 'ACTIVE' ? 'a-chip-green' : 'a-chip-red'}`} title={s.email}>
                                          {s.nom}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </Panel>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <Modal
        open={newClassModal}
        onClose={() => setNewClassModal(false)}
        title={`Nouvelle classe — ${selected?.title ?? ''}`}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setNewClassModal(false)}>Annuler</Btn>
            <Btn variant="primary" onClick={createClass} disabled={busy || !newClass.name.trim()}>{busy ? 'Création…' : 'Créer la classe'}</Btn>
          </>
        }
      >
        <form onSubmit={createClass} className="flex flex-col gap-4">
          <Field label="Nom de la classe" hint="Ex. « Promotion Janvier 2026 », « Groupe entreprise X »">
            <Input value={newClass.name} onChange={(e) => setNewClass({ ...newClass, name: e.target.value })} placeholder="Promotion…" required />
          </Field>
          <Field label="Formateur (optionnel)">
            <Select value={newClass.instructorId} onChange={(e) => setNewClass({ ...newClass, instructorId: e.target.value })}>
              <option value="">— À assigner plus tard —</option>
              {instructors.map((i) => <option key={i.id} value={i.id}>{i.nom}</option>)}
            </Select>
          </Field>
        </form>
      </Modal>

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
