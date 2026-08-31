import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, ShieldCheck, Video } from 'lucide-react';
import api from '../../services/api';

interface JoinInfo {
  title: string;
  url: string;
  moderator: boolean;
  authEnabled: boolean;
  scheduledAt: string;
}

/**
 * Salle de visioconférence Jitsi intégrée en iFrame — /learn/session/:id
 * L'URL (avec jeton JWT si configuré) est fournie par GET /api/sessions/:id/join.
 */
export default function SessionRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState<JoinInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/sessions/${id}/join`)
      .then((res) => setInfo(res.data))
      .catch((err) => setError(err.response?.data?.message || "Impossible de rejoindre cette session."));
  }, [id]);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#1A1A2E] text-white">
        <p className="text-red-300">{error}</p>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1A1A2E] text-white/70">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#1A1A2E]">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Quitter
        </button>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Video className="w-4 h-4 text-red-400" /> {info.title}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/60">
          {info.moderator && <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-300">Modérateur</span>}
          {info.authEnabled && <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> JWT</span>}
        </div>
      </div>
      <iframe
        title={`Session ${info.title}`}
        src={info.url}
        className="flex-1 w-full border-0"
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
      />
    </div>
  );
}
