import { useEffect, useRef } from 'react';

export default function WaveCanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let rafId = 0;
    const startTime = performance.now();

    const updateSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const draw = (now: number) => {
      const t = (now - startTime) / 1000;
      const count = width < 768 ? 24 : 48;
      const barW = width / count;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < count; i++) {
        const p = (i / count) * Math.PI * 2 * 1.5;
        const wave = Math.sin(p + t * 1.1) + 0.5 * Math.sin(p * 0.5 - t * 0.7);
        const norm = Math.max(0, Math.min(1, (wave + 1.5) / 3));
        const barHeight = height * (0.24 + norm * 0.54);
        const y = height - barHeight;

        const x0 = Math.floor(i * barW);
        const x1 = Math.ceil((i + 1) * barW);

        const grad = ctx.createLinearGradient(0, height, 0, y);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
        grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.36)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(x0, y, x1 - x0, barHeight);
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050505]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.06) 10px, rgba(0, 0, 0, 0.45) 20px)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, #050505 0%, rgba(5, 5, 5, 0) 100%)',
        }}
      />
    </div>
  );
}
