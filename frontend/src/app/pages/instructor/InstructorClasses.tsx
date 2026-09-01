import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users2, PlayCircle, MessagesSquare, Mail } from 'lucide-react';
import api from '../../services/api';
import { PageHeader, Panel, PanelTitle, Btn, Chip, EmptyState, DataTable, ToastHost, type Toast } from '../../components/admin/ui';

interface Classroom {
  id: string; name: string; courseId: string; courseTitle: string;
  studentsCount: number; quizzesCount: number; lessons: { id: string }[];
}
interface StudentRow {
  id: string; nom: string; email: string; enrollmentId: string;
  paymentPlan: string; accessStatus: string; progressRate: number;
}

export default function InstructorClasses() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/instructor/classrooms');
      setClasses(r.data ?? []);
      setSelId((p) => p ?? r.data?.[0]?.id ?? null);
    } catch {
      setToast({ kind: 'err', msg: 'Erreur de chargement des classes.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = classes.find((c) => c.id === selId) ?? null;

  useEffect(() => {
    if (!selected) return;
    setLoadingStudents(true);
    api
      .get(`/instructor/courses/${selected.courseId}/students`)
      .then((r) => setStudents(r.data ?? []))
      .catch(() => setToast({ kind: 'err', msg: 'Erreur de chargement des élèves.' }))
      .finally(() => setLoadingStudents(false));
  }, [selected]);

  const avg = students.length ? Math.round(students.reduce((a, s) => a + s.progressRate, 0) / students.length) : 0;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader eyebrow="Formateur" title="Mes classes" description="Suivez la progression de vos élèves, classe par classe." />

      {loading ? (
        <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement…</div>
      ) : classes.length === 0 ? (
        <EmptyState>Aucune classe ne vous est assignée. Contactez l'administration.</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="a-scroll flex max-h-[calc(100vh-190px)] flex-col gap-2 overflow-y-auto pr-1">
            {classes.map((c) => {
              const active = c.id === selId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelId(c.id)}
                  className={`a-card a-card-hover w-full p-3.5 text-left ${active ? '!border-[color:var(--a-accent)] shadow-[0_0_0_1px_var(--a-accent)]' : ''}`}
                >
                  <div className="text-[11px] uppercase tracking-wide text-[color:var(--a-ink-dim)]">{c.courseTitle}</div>
                  <div className="mt-0.5 font-semibold text-[color:var(--a-ink)]">{c.name}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-[color:var(--a-ink-dim)]">
                    <span className="inline-flex items-center gap-1"><Users2 className="h-3 w-3" /> {c.studentsCount}</span>
                    <span className="inline-flex items-center gap-1"><PlayCircle className="h-3 w-3" /> {c.lessons.length}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            {selected && (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[1.1rem] text-[color:var(--a-ink)]">{selected.name}</h2>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Chip tone="blue">{selected.courseTitle}</Chip>
                      <Chip tone="gray">{students.length} élève(s)</Chip>
                      <Chip tone="green">Progression moy. {avg}%</Chip>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/learn/instructor/content"><Btn size="sm" variant="ghost"><PlayCircle className="h-3.5 w-3.5" /> Contenu</Btn></Link>
                    <Link to={`/learn/instructor/board?class=${selected.id}`}><Btn size="sm" variant="primary"><MessagesSquare className="h-3.5 w-3.5" /> Espace de classe</Btn></Link>
                  </div>
                </div>

                {loadingStudents ? (
                  <div className="text-[13px] text-[color:var(--a-ink-dim)]">Chargement des élèves…</div>
                ) : students.length === 0 ? (
                  <EmptyState>Aucun élève inscrit dans cette classe pour l'instant.</EmptyState>
                ) : (
                  <DataTable columns={['Élève', 'Accès', 'Progression', '']}>
                    {students.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="a-td-strong">{s.nom}</div>
                          <div className="flex items-center gap-1 text-[11px] text-[color:var(--a-ink-dim)]"><Mail className="h-3 w-3" /> {s.email}</div>
                        </td>
                        <td>{s.accessStatus === 'ACTIVE' ? <Chip tone="green">Actif</Chip> : <Chip tone="red">{s.accessStatus}</Chip>}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-[color:var(--a-accent)]" style={{ width: `${s.progressRate}%` }} />
                            </div>
                            <span className="text-[12px] text-[color:var(--a-ink-soft)]">{s.progressRate}%</span>
                          </div>
                        </td>
                        <td className="text-right">
                          <a href={`mailto:${s.email}`} className="a-btn a-btn-ghost a-btn-sm"><Mail className="h-3.5 w-3.5" /></a>
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <ToastHost toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
