import { useEffect, useState } from 'react';
import { Award, Download, Loader2, Clock, HelpCircle } from 'lucide-react';
import api from '../../services/api';

interface Certificate {
  id: string;
  courseTitle: string;
  score: number;
  issuedAt: string;
  downloadUrl: string;
}
interface Pending {
  courseTitle: string;
  hoursSpent: number;
  hoursRequired: number;
  hoursOk: boolean;
  quizzesOk: boolean;
  quizzesPassed: number;
  quizzesTotal: number;
}

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/certificates')
      .then((res) => {
        setCertificates(res.data.certificates || []);
        setPending(res.data.pending || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 flex items-center gap-2 text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /> Chargement…</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-1">Mes Certificats</h2>
        <p className="text-gray-500 text-sm">
          Délivrés automatiquement dès {pending[0]?.hoursRequired ?? 85} h de présence et tous les quiz validés.
        </p>
      </div>

      {certificates.length === 0 && pending.length === 0 && (
        <p className="text-gray-400">Aucune formation en cours.</p>
      )}

      {certificates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-2xl shadow-sm border-2 border-[#FFC107] overflow-hidden">
              <div className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] text-white p-6 text-center">
                <Award className="w-14 h-14 mx-auto mb-3 text-[#FFC107]" />
                <h3 className="text-white font-bold">Certificat de Réussite</h3>
                <div className="text-xs opacity-70">Tower Structure E-Learning</div>
              </div>
              <div className="p-6">
                <p className="text-center font-bold text-lg text-gray-900 mb-4">{cert.courseTitle}</p>
                <div className="grid grid-cols-2 gap-4 text-center text-sm mb-6">
                  <div>
                    <div className="text-gray-500">Obtenu le</div>
                    <div className="font-semibold">{new Date(cert.issuedAt).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Score</div>
                    <div className="font-semibold text-[#FFB300]">{cert.score}%</div>
                  </div>
                </div>
                <a
                  href={cert.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFC107] px-4 py-2.5 font-bold text-[#1A1A2E] hover:bg-yellow-400"
                >
                  <Download className="w-4 h-4" /> Télécharger le PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">En cours d'obtention</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map((p, i) => {
              const hoursPct = Math.min(100, Math.round((p.hoursSpent / p.hoursRequired) * 100));
              return (
                <div key={i} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-6 h-6 text-gray-300" />
                    <h4 className="text-sm font-semibold text-gray-800">{p.courseTitle}</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-gray-500 mb-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Présence</span>
                        <span className={p.hoursOk ? 'text-green-600 font-semibold' : ''}>
                          {p.hoursSpent} / {p.hoursRequired} h
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-200">
                        <div className="h-1.5 rounded-full bg-[#FFB300]" style={{ width: `${hoursPct}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Quiz validés</span>
                      <span className={p.quizzesOk ? 'text-green-600 font-semibold' : ''}>
                        {p.quizzesPassed} / {p.quizzesTotal}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
