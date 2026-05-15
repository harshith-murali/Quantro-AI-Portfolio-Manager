'use client';

import { useEffect, useRef } from 'react';

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let x = -300, y = -300;
    let cx = -300, cy = -300;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      x = e.clientX - 140;
      y = e.clientY - 140;
    };

    // Simple lerp loop — much lighter than Framer spring
    const tick = () => {
      cx += (x - cx) * 0.12;
      cy += (y - cy) * 0.12;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 z-10 h-[280px] w-[280px] rounded-full opacity-40"
      style={{
        background:
          'radial-gradient(circle, rgba(207,171,103,0.15) 0%, rgba(207,171,103,0.04) 35%, transparent 65%)',
        willChange: 'transform',
      }}
    />
  );
}