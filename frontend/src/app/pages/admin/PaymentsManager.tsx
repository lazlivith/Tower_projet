import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Clock, User, BookOpen, X, Loader, Ban, Plus } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import api from '../../services/api';

interface Enrollment {
  id: string;
  student: { id: string; nom: string; email: string };
  course: { id: string; title: string; price: number };
  createdAt: string;
  accessStatus: string;
  paymentPlan: string;
  payments?: { amount: number; paymentMethod: string; paymentStatus: string }[];
}

type Tab = 'SUSPENDED' | 'ACTIVE';

export default function PaymentsManager() {
  const [tab, setTab] = useState<Tab>('SUSPENDED');
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Modal "Donner accès"
  const [grantOpen, setGrantOpen] = useState(false);
  const [students, setStudents] = useState<{ id: string; nom: string; email: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [grant, setGrant] = useState({ studentId: '', courseId: '', paymentPlan: 'FULL' });
  const [granting, setGranting] = useState(false);

  const flash = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4500);
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/enrollments/pending?status=${tab}`);
      setRows(res.data || []);
    } catch {
      flash('error', 'Erreur lors du chargement des inscriptions.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const setAccess = async (e: Enrollment, status: 'ACTIVE' | 'SUSPENDED') => {
    const verb = status === 'ACTIVE' ? "Activer l'accès" : "Suspendre l'accès";
    if (!window.confirm(`${verb} de « ${e.student.nom} » pour « ${e.course.title} » ?`)) return;
    setBusy(e.id);
    try {
      await api.patch(`/admin/enrollments/${e.id}/validate-access`, { status });
      flash('success', status === 'ACTIVE' ? `Accès de ${e.student.nom} activé.` : `Accès de ${e.student.nom} suspendu.`);
      setRows((prev) => prev.filter((r) => r.id !== e.id));
    } catch (err: any) {
      flash('error', err.response?.data?.message || 'Erreur.');
    } finally {
      setBusy(null);
    }
  };

  const openGrant = async () => {
    setGrant({ studentId: '', courseId: '', paymentPlan: 'FULL' });
    setGrantOpen(true);
    try {
      const [u, c] = await Promise.all([api.get('/admin/users'), api.get('/courses')]);
      const all = u.data?.data ?? u.data ?? [];
      setStudents(all.filter((x: any) => x.role === 'STUDENT'));
      setCourses(c.data?.data ?? c.data ?? []);
    } catch {
      flash('error', 'Erreur de chargement des listes.');
    }
  };

  const submitGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grant.studentId || !grant.courseId) return;
    setGranting(true);
    try {
      await api.post('/admin/enrollments/assign', grant);
      flash('success', 'Accès accordé et activé.');
      setGrantOpen(false);
      if (tab === 'ACTIVE') fetchRows();
    } catch (err: any) {
      flash('error', err.response?.data?.message || "Erreur lors de l'attribution de l'accès.");
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="p-6">
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium flex items-center gap-3 max-w-sm ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span className="text-sm">{feedback.msg}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Paiements & Accès</h2>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '…' : `${rows.length} ${tab === 'SUSPENDED' ? 'en attente de paiement/validation' : 'accès actifs'}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
            <button onClick={() => setTab('SUSPENDED')} className={`px-4 py-1.5 font-medium ${tab === 'SUSPENDED' ? 'bg-[#1A1A2E] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              En attente
            </button>
            <button onClick={() => setTab('ACTIVE')} className={`px-4 py-1.5 font-medium ${tab === 'ACTIVE' ? 'bg-[#1A1A2E] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Accès actifs
            </button>
          </div>
          <button onClick={openGrant} className="px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-xl font-semibold text-sm hover:bg-yellow-400 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Donner accès
          </button>
          <button onClick={fetchRows} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Actualiser</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 animate-pulse">Chargement…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
          <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">Rien à afficher</h3>
          <p className="text-gray-400 text-sm">
            {tab === 'SUSPENDED' ? 'Aucune inscription en attente.' : 'Aucun accès actif.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tab === 'SUSPENDED' ? 'bg-amber-100' : 'bg-green-100'}`}>
                  <User className={`w-6 h-6 ${tab === 'SUSPENDED' ? 'text-amber-600' : 'text-green-600'}`} />
                </div>
                <div>
                  <div className="font-bold text-gray-900">{e.student.nom}</div>
                  <div className="text-sm text-gray-500">{e.student.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-semibold text-sm text-gray-800">{e.course.title}</div>
                  <div className="text-xs text-gray-400">
                    {e.course.price?.toLocaleString()} DH · {e.paymentPlan === 'THREE_INSTALLMENTS' ? '3× ' : 'comptant'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock className="w-4 h-4" />
                {new Date(e.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>

              {tab === 'SUSPENDED' ? (
                <button
                  onClick={() => setAccess(e, 'ACTIVE')}
                  disabled={busy === e.id}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-60"
                >
                  {busy === e.id ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Débloquer l'accès
                </button>
              ) : (
                <button
                  onClick={() => setAccess(e, 'SUSPENDED')}
                  disabled={busy === e.id}
                  className="flex items-center gap-2 px-5 py-2 bg-red-50 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-100 disabled:opacity-60"
                >
                  {busy === e.id ? <Loader className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  Suspendre
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={grantOpen} onClose={() => setGrantOpen(false)} title="Donner accès à une formation" size="md">
        <form onSubmit={submitGrant} className="space-y-4">
          <p className="text-sm text-gray-500">
            Inscrit et active immédiatement l'accès d'un étudiant, sans paiement préalable.
          </p>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Étudiant *</label>
            <select required value={grant.studentId} onChange={(e) => setGrant({ ...grant, studentId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] outline-none">
              <option value="">— Choisir —</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.nom} · {s.email}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Formation *</label>
            <select required value={grant.courseId} onChange={(e) => setGrant({ ...grant, courseId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] outline-none">
              <option value="">— Choisir —</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Plan de paiement</label>
            <select value={grant.paymentPlan} onChange={(e) => setGrant({ ...grant, paymentPlan: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] outline-none">
              <option value="FULL">Comptant</option>
              <option value="THREE_INSTALLMENTS">Échéancier 3×</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={granting} className="flex-1 px-4 py-2.5 bg-[#FFC107] text-[#1A1A2E] font-bold rounded-lg hover:bg-yellow-400 flex items-center justify-center gap-2 disabled:opacity-60">
              {granting ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Accorder l'accès
            </button>
            <button type="button" onClick={() => setGrantOpen(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
