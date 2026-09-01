import { useEffect, useRef } from 'react';

/**
 * Fond dynamique « maillage éléments finis » : réseau de nœuds reliés par de
 * fines lignes néon, en dérive lente, révélé plus fortement autour du curseur
 * (effet projecteur). Rendu en <canvas>, une seule instance montée dans le layout.
 */
export default function StructureBackground({ accent = '#38bdf8' }: { accent?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    const mouse = { x: -9999, y: -9999 };

    const rgb = hexToRgb(accent);
    const LINK_DIST = 150;
    const SPOTLIGHT = 260;

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.round(Math.min(90, Math.max(28, (w * h) / 22000)));
      nodes = Array.from({ length: target }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      // Liaisons (arêtes du maillage)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > LINK_DIST) continue;
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          const md = Math.hypot(mx - mouse.x, my - mouse.y);
          const spot = Math.max(0, 1 - md / SPOTLIGHT);
          const base = (1 - d / LINK_DIST) * 0.09;
          const alpha = base + spot * 0.35 * (1 - d / LINK_DIST);
          if (alpha < 0.015) continue;
          ctx.strokeStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Nœuds
      for (const n of nodes) {
        const md = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        const spot = Math.max(0, 1 - md / SPOTLIGHT);
        const alpha = 0.18 + spot * 0.6;
        ctx.fillStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, spot > 0.5 ? 2 : 1.4, 0, Math.PI * 2);
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
    if (reduce) {
      draw(); // rendu statique unique
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }
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
  }, [accent]);

  return <canvas ref={ref} className="fx-canvas" aria-hidden="true" />;
}

function hexToRgb(hex: string): string {
  const m = hex.replace('#', '');
  const n = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
