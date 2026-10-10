import { useEffect, useRef } from 'react';
import { SectorId } from '../../types/portfolio';
import { SECTORS, PERSONAL_INFO } from '../../data/portfolioData';

interface WebGLFallbackProps {
  activeSector: SectorId;
  onSelectSector: (sector: SectorId) => void;
}

export function WebGLFallback({ activeSector, onSelectSector }: WebGLFallbackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 2D neural node simulation
    const points = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2.5 + 1.5,
    }));

    const render = () => {
      ctx.fillStyle = '#02040a';
      ctx.fillRect(0, 0, width, height);

      // Draw connection lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw points
      ctx.fillStyle = '#00f0ff';
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Central 2D Hologram Silhouette */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-48 h-48 rounded-full border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(0,240,255,0.4)] overflow-hidden flex items-center justify-center bg-black/60 backdrop-blur-md">
          <img
            src={PERSONAL_INFO.avatarUrl}
            alt={PERSONAL_INFO.name}
            className="w-full h-full object-cover filter contrast-125 brightness-95 opacity-85"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/70 via-transparent to-cyan-500/20" />
        </div>
      </div>
    </div>
  );
}
