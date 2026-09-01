/**
 * Aperçu vidéo générique en iframe — YouTube / Vimeo / fichier direct.
 * Lecture dans la page, aucune redirection. (Version sans suivi de progression :
 * pour le suivi côté élève, voir components/learn/VideoPlayer.tsx.)
 */

export type EmbedInfo = { provider: 'youtube' | 'vimeo' | 'file' | 'none'; embedUrl: string | null };

export function resolveEmbed(url?: string | null): EmbedInfo {
  if (!url) return { provider: 'none', embedUrl: null };
  const yt =
    url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/) ||
    url.match(/(?:youtu\.be\/)([\w-]{11})/) ||
    url.match(/(?:youtube\.com\/embed\/)([\w-]{11})/) ||
    url.match(/(?:youtube\.com\/shorts\/)([\w-]{11})/);
  if (yt) return { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1` };
  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vi) return { provider: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vi[1]}` };
  return { provider: 'file', embedUrl: url };
}

export default function MediaEmbed({ url, className = '' }: { url?: string | null; className?: string }) {
  const { provider, embedUrl } = resolveEmbed(url);
  if (provider === 'none' || !embedUrl) {
    return (
      <div className={`grid aspect-video place-items-center rounded-xl border border-[color:var(--a-line)] bg-black/40 text-[12px] text-[color:var(--a-ink-dim)] ${className}`}>
        Aucune vidéo
      </div>
    );
  }
  return (
    <div className={`relative w-full overflow-hidden rounded-xl bg-black ${className}`} style={{ aspectRatio: '16 / 9' }}>
      {provider === 'file' ? (
        <video src={embedUrl} controls className="absolute inset-0 h-full w-full" />
      ) : (
        <iframe
          src={embedUrl}
          title="Aperçu vidéo"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      )}
    </div>
  );
}
