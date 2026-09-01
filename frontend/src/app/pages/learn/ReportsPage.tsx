import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileBarChart, FileText, CheckCircle2, Clock } from 'lucide-react';
import api, { toAbsoluteUrl } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Report {
  id: string; assignment: string; course: string; fileUrl: string | null;
  grade: number | null; status: string; submittedAt: string; dueDate: string;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'STUDENT') { setLoading(false); return; }
    api.get('/student/reports')
      .then((r) => setRows(r.data ?? []))
      .catch(() => setErr('Impossible de charger vos rapports.'))
      .finally(() => setLoading(false));
  }, [user?.role]);

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-2.5">
        <FileBarChart className="h-6 w-6 text-[#FFC107]" />
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Rapports</h1>
      </div>

      {user?.role !== 'STUDENT' ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Suivi des travaux rendus par les élèves.
          {user?.role === 'INSTRUCTOR' && (
            <> Corrigez-les depuis <Link to="/learn/instructor/assignments" className="font-semibold text-[#1A1A2E] underline">Devoirs</Link>.</>
          )}
        </div>
      ) : loading ? (
        <div className="text-sm text-gray-400">Chargement…</div>
      ) : err ? (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{err}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-400">
          Aucun travail rendu pour l'instant. Vos remises de devoirs et projets apparaîtront ici avec leur note.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-gray-900">{r.assignment}</div>
                {r.status === 'GRADED' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Corrigé — {r.grade}/100
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                    <Clock className="h-3.5 w-3.5" /> En attente de correction
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {r.course} · rendu le {new Date(r.submittedAt).toLocaleDateString('fr-FR')}
              </div>
              {r.fileUrl && (
                <a href={toAbsoluteUrl(r.fileUrl)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1A1A2E] hover:underline">
                  <FileText className="h-3.5 w-3.5" /> Voir ma remise
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
