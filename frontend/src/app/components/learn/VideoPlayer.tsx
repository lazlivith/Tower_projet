import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../services/api';

type Provider = 'youtube' | 'vimeo' | 'file' | 'none';

interface VideoPlayerProps {
  lessonId: string;
  provider: Provider;
  embedUrl: string | null;
  /** % de visionnage au-delà duquel la leçon est considérée achevée (défaut 90). */
  completionThreshold?: number;
  /** Appelé une fois quand le seuil de complétion est atteint. */
  onCompleted?: () => void;
}

// Chargement unique de l'API IFrame YouTube
let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    if ((window as any).YT?.Player) return resolve();
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

/**
 * Lecteur vidéo générique en iFrame — YouTube (avec suivi de progression via l'API IFrame),
 * Vimeo, ou fichier vidéo direct. Aucune redirection : lecture dans la page.
 * Envoie régulièrement la progression à `/lessons/:id/track`.
 */
export default function VideoPlayer({
  lessonId,
  provider,
  embedUrl,
  completionThreshold = 90,
  onCompleted,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const lastSentRef = useRef(0);
  const completedRef = useRef(false);
  const [percent, setPercent] = useState(0);
  const [ready, setReady] = useState(provider !== 'youtube');
  const [manualLoading, setManualLoading] = useState(false);

  const sendTrack = async (seconds: number, videoPercent: number) => {
    try {
      await api.post(`/lessons/${lessonId}/track`, { seconds, videoPercent });
      if (videoPercent >= completionThreshold && !completedRef.current) {
        completedRef.current = true;
        onCompleted?.();
      }
    } catch {
      /* le tracking ne doit jamais casser la lecture */
    }
  };

  // ─── YouTube : IFrame API + polling ───
  useEffect(() => {
    if (provider !== 'youtube' || !embedUrl) return;
    const videoId = embedUrl.split('/embed/')[1]?.split(/[?&]/)[0];
    if (!videoId) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e: any) => {
            // 1 = playing
            if (e.data === 1 && !interval) {
              interval = setInterval(() => {
                const p = ytPlayerRef.current;
                if (!p?.getDuration) return;
                const dur = p.getDuration();
                const cur = p.getCurrentTime();
                if (!dur) return;
                const pc = Math.min(100, Math.round((cur / dur) * 100));
                setPercent(pc);
                const delta = Math.max(0, Math.round(cur - lastSentRef.current));
                if (delta >= 10 || pc >= completionThreshold) {
                  lastSentRef.current = cur;
                  sendTrack(Math.min(delta, 60), pc);
                }
              }, 5000);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      try { ytPlayerRef.current?.destroy?.(); } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, embedUrl, lessonId]);

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    if (!el.duration) return;
    const pc = Math.min(100, Math.round((el.currentTime / el.duration) * 100));
    setPercent(pc);
    const delta = Math.round(el.currentTime - lastSentRef.current);
    if (delta >= 10 || pc >= completionThreshold) {
      lastSentRef.current = el.currentTime;
      sendTrack(Math.min(Math.max(delta, 0), 60), pc);
    }
  };

  const markWatched = async () => {
    setManualLoading(true);
    await sendTrack(0, 100);
    setPercent(100);
    setManualLoading(false);
  };

  if (provider === 'none' || !embedUrl) {
    return <p className="text-sm text-gray-500">Aucune vidéo pour ce chapitre.</p>;
  }

  return (
    <div>
      <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: '16 / 9' }}>
        {provider === 'youtube' && (
          <>
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center text-white/70">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
            {/* Le div est remplacé par l'iFrame par l'API YouTube */}
            <div ref={containerRef} className="absolute inset-0 w-full h-full" />
          </>
        )}

        {provider === 'vimeo' && (
          <iframe
            src={embedUrl}
            title="Lecteur vidéo"
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}

        {provider === 'file' && (
          <video
            src={embedUrl}
            controls
            className="absolute inset-0 w-full h-full"
            onTimeUpdate={handleVideoTimeUpdate}
          />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div className="h-1.5 rounded-full bg-[#FFB300] transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-500">Visionné à {percent}%{percent >= completionThreshold ? ' — chapitre validé' : ''}</p>
        </div>
        {provider === 'vimeo' && percent < completionThreshold && (
          <button
            onClick={markWatched}
            disabled={manualLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A2E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#26264a] disabled:opacity-60"
          >
            {manualLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            J'ai visionné la vidéo
          </button>
        )}
      </div>
    </div>
  );
}
