import { useEffect, useRef } from 'react';
import { SectorId } from '../../types/portfolio';
import { seededRandom } from '../canvas/neuralGeometry';
interface WebGLFallbackProps {
  activeSector: SectorId;
  onSelectSector: (sector: SectorId) => void;
  reducedMotion?: boolean;
  isLoading?: boolean;
}
export function WebGLFallback({ reducedMotion = false, isLoading = false }: WebGLFallbackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let frame = 0;
    let time = 0;
    let last = 0;
    const random = seededRandom(42);
    const stars = Array.from({ length: 100 }, () => [random(), random(), random()]);
    const render = (now = 0) => {
      if (!reducedMotion && last) time += Math.min((now - last) / 1000, .05) * .06;
      last = now;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#03060c'; ctx.fillRect(0, 0, w, h);
      for (const [x, y, alpha] of stars) {
        ctx.fillStyle = `rgba(111,155,184,${alpha * .35})`;
        ctx.fillRect(x * w, y * h, 1, 1);
      }
      const x = w < 768 ? w * .5 : w * .63;
      const y = w < 768 ? h * .34 : h * .47;
      const r = Math.min(w * .25, h * .21);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 1.4);
      glow.addColorStop(0, 'rgba(103,204,242,.24)'); glow.addColorStop(1, 'rgba(10,33,64,0)');
      ctx.fillStyle = glow; ctx.fillRect(x - r * 1.4, y - r * 1.4, r * 2.8, r * 2.8);
      const projected = Array.from({ length: 260 }, (_, i) => {
        const sy = 1 - (i + .5) / 260 * 2, a = i * 2.399963 + time;
        const sx = Math.cos(a) * Math.sqrt(1 - sy * sy), z = Math.sin(a) * Math.sqrt(1 - sy * sy);
        return [x + sx * r, y + sy * r, z];
      });
      projected.forEach((p, i) => {
        ctx.fillStyle = `rgba(126,202,221,${.3 + (p[2] + 1) * .25})`;
        ctx.beginPath(); ctx.arc(p[0], p[1], 1.1, 0, Math.PI * 2); ctx.fill();
        for (const j of [i + 8, i + 13]) {
          const q = projected[j]; if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > r * .28) continue;
          ctx.strokeStyle = 'rgba(71,126,157,.16)'; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        }
      });
      if (!reducedMotion && !document.hidden) frame = requestAnimationFrame(render);
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reducedMotion) render();
    };
    resize(); render();
    const visibility = () => {
      cancelAnimationFrame(frame);
      last = 0;
      if (!document.hidden) render();
    };
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', visibility);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', visibility); };
  }, [reducedMotion]);
  return <div className="absolute inset-0"><canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />{!isLoading && <span className="fallback-caption">Lightweight view · All portfolio sections available</span>}</div>;
}
