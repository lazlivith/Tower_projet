import { useEffect, useRef } from 'react';

interface Props {
  accent?: string;
  /** true = plein écran fixe (fond global) · false = absolu, remplit le parent (hero) */
  fixed?: boolean;
  /** multiplicateur de densité de nœuds */
  density?: number;
  /** multiplicateur d'opacité / luminosité */
  intensity?: number;
  className?: string;
}

/**
 * Fond animé « maillage éléments finis » : réseau de nœuds reliés par de fines
 * lignes néon, dérive lente, révélé plus fortement autour du curseur (projecteur).
 */
export default function StructureBackground({
  accent = '#38bdf8',
  fixed = true,
  density = 1,
  intensity = 1,
  className = '',
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    const mouse = { x: -9999, y: -9999 };
    const rgb = hexToRgb(accent);
    const LINK_DIST = 155;
    const SPOTLIGHT = 280;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width || window.innerWidth;
      h = rect.height || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(140, Math.max(24, (w * h) / 20000)) * density);
      nodes = Array.from({ length: target }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
      }));
    };

    const localMouse = () => {
      const rect = canvas.getBoundingClientRect();
      return { x: mouse.x - rect.left, y: mouse.y - rect.top };
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const m = localMouse();

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > LINK_DIST) continue;
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          const spot = Math.max(0, 1 - Math.hypot(mx - m.x, my - m.y) / SPOTLIGHT);
          const base = (1 - d / LINK_DIST) * 0.14 * intensity;
          const alpha = base + spot * 0.4 * (1 - d / LINK_DIST);
          if (alpha < 0.02) continue;
          ctx.strokeStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        const spot = Math.max(0, 1 - Math.hypot(n.x - m.x, n.y - m.y) / SPOTLIGHT);
        const alpha = (0.25 + spot * 0.6) * intensity;
        ctx.fillStyle = `rgba(${rgb},${Math.min(1, alpha).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, spot > 0.5 ? 2.2 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduce) raf = requestAnimationFrame(draw);
    };

    resize();
    if (reduce) draw();
    else raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseout', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseout', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [accent, density, intensity]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`${fixed ? 'fx-canvas' : 'pointer-events-none absolute inset-0 h-full w-full'} ${className}`}
    />
  );
}

function hexToRgb(hex: string): string {
  const m = hex.replace('#', '');
  const n = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
