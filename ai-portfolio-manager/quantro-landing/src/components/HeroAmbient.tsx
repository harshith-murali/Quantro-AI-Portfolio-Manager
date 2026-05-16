'use client';

import { useEffect, useMemo, useState } from 'react';

/* ─── Timing ──────────────────────────────────────────────────────── */
const STAGGER   = 0.08;
const FALL_DUR  = 2.8;
const HOLD_DUR  = 2.6;
const CLOSE_DUR = 2.2;
const PAUSE     = 1.4;

const DESKTOP_N = 14;   // reduced from 20
const MOBILE_N  = 6;    // reduced from 8

/* ─── Pure CSS keyframes approach (no per-frame JS) ─────────────── */

function buildCSS(n: number): string {
  const center    = (n - 1) / 2;
  const maxDist   = Math.ceil(n / 2);
  const lastDelay = maxDist * STAGGER;
  const cycle     = lastDelay + FALL_DUR + HOLD_DUR + CLOSE_DUR + PAUSE;

  let rules = '';

  for (let i = 0; i < n; i++) {
    const dist    = Math.abs(i - center);
    const delay   = dist * STAGGER;
    const isRight = i > center;
    const target  = isRight ? 82 : -82;

    const t1 = ((delay / cycle) * 100).toFixed(2);
    const t2 = (((delay + FALL_DUR) / cycle) * 100).toFixed(2);
    const t3 = (((delay + FALL_DUR + HOLD_DUR) / cycle) * 100).toFixed(2);
    const t4 = (Math.min((delay + FALL_DUR + HOLD_DUR + CLOSE_DUR) / cycle, 0.998) * 100).toFixed(2);

    rules += `
@keyframes domino-${i} {
  0%, ${t1}%    { transform: rotateY(0deg); opacity: 1; }
  ${t2}%        { transform: rotateY(${target}deg); opacity: 0.22; }
  ${t3}%        { transform: rotateY(${target}deg); opacity: 0.22; }
  ${t4}%, 100%  { transform: rotateY(0deg); opacity: 1; }
}
.domino-panel-${i} {
  animation: domino-${i} ${cycle.toFixed(2)}s ease-in-out infinite;
  transform-origin: ${isRight ? 'left center' : 'right center'};
}
`;
  }
  return rules;
}

export function HeroAmbient() {
  const [n, setN] = useState(DESKTOP_N);

  useEffect(() => {
    const sync = () => setN(window.innerWidth < 768 ? MOBILE_N : DESKTOP_N);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  const cssRules = useMemo(() => buildCSS(n), [n]);
  const panelTones = ['#181818', '#161616', '#1c1a18', '#141414', '#1a1816'];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">

      {/* Inject CSS keyframes — runs on compositor thread, NOT JS */}
      <style dangerouslySetInnerHTML={{ __html: cssRules }} />

      {/* Warm background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 80% at 50% 50%, #1c1508 0%, #0e0d0b 40%, #060606 100%)',
        }}
      >
        {/* Static subtle gold blobs — no animation, just atmosphere */}
        <div
          className="absolute"
          style={{
            top: '22%', left: '18%', width: 380, height: 380,
            transform: 'translate(-50%,-50%)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 60%)',
            opacity: 0.6,
          }}
        />
        <div
          className="absolute"
          style={{
            top: '65%', left: '72%', width: 300, height: 300,
            transform: 'translate(-50%,-50%)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.10) 0%, transparent 60%)',
            opacity: 0.5,
          }}
        />
      </div>

      {/* Domino panel curtain — pure CSS animations */}
      <div
        className="absolute inset-0 flex"
        style={{ perspective: '1000px' }}
      >
        {Array.from({ length: n }, (_, i) => (
          <div
            key={i}
            className={`domino-panel-${i}`}
            style={{
              flex: `0 0 calc(100% / ${n})`,
              height: '100%',
              transformStyle: 'preserve-3d',
              willChange: 'transform',
              background: `linear-gradient(105deg, ${panelTones[i % panelTones.length]} 0%, #1e1b14 48%, ${panelTones[i % panelTones.length]} 100%)`,
              borderLeft:  i > 0     ? '1px solid rgba(255,255,255,0.03)' : 'none',
              borderRight: i < n - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              position: 'relative',
            }}
          >
            {/* Gold edge line — static, no animation */}
            <div
              style={{
                position: 'absolute',
                [i > (n - 1) / 2 ? 'left' : 'right']: 0,
                top: '8%', bottom: '8%', width: '1px',
                background: 'linear-gradient(180deg, transparent 0%, rgba(201,168,76,0.5) 50%, transparent 100%)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 75% at 25% 50%, transparent 18%, rgba(0,0,0,0.38) 50%, rgba(0,0,0,0.78) 80%, #000 100%)',
        }}
      />
    </div>
  );
}