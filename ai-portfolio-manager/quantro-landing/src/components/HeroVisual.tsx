'use client';

import { motion, useScroll, useTransform } from 'framer-motion';

export function HeroVisual() {
  const { scrollY } = useScroll();
  const cardOffset1 = useTransform(scrollY, [0, 600], [0, -60]);
  const cardOffset2 = useTransform(scrollY, [0, 600], [0, -120]);

  return (
    <div className="relative min-h-[720px]">

      {/* Left stat card */}
      <motion.div
        style={{ y: cardOffset1 }}
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-0 top-20 hidden w-44 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl md:block"
      >
        <div className="text-[10px] uppercase tracking-[0.25em] text-faint">AI confidence</div>
        <div className="mt-3 flex items-end gap-1">
          <div className="h-10 w-2 rounded-full bg-[rgba(207,171,103,0.25)]" />
          <div className="h-14 w-2 rounded-full bg-[rgba(207,171,103,0.42)]" />
          <div className="h-18 w-2 rounded-full bg-[rgba(207,171,103,0.65)]" />
          <div className="h-24 w-2 rounded-full bg-gold" />
        </div>
        <div className="mt-4 text-2xl text-text">
          94<span className="text-sm text-gold">%</span>
        </div>
      </motion.div>

      {/* Right stat card */}
      <motion.div
        style={{ y: cardOffset2 }}
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-0 top-8 hidden w-48 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl md:block"
      >
        <div className="text-[10px] uppercase tracking-[0.28em] text-faint">Portfolio gain</div>
        <div className="mt-2 font-serifDisplay text-3xl tracking-[-0.04em] text-text">+18.4%</div>
        <div className="mt-2 text-sm text-muted">quarterly projection</div>
      </motion.div>

      {/* Phone */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto w-[300px] sm:w-[360px] lg:w-[420px]"
      >
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="phone-shell relative mx-auto aspect-[0.5] w-full rounded-[3rem] p-3"
        >
          <div className="glass-panel relative flex h-full flex-col rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02))] p-5">
            <div className="mx-auto mb-4 h-1.5 w-20 rounded-full bg-white/10" />

            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-faint">
              <span>Portfolio</span>
              <span>Live AI</span>
            </div>

            <div className="mt-6">
              <div className="text-[11px] uppercase tracking-[0.28em] text-faint">Net worth</div>
              <div className="mt-2 font-serifDisplay text-5xl tracking-[-0.05em] text-text">$248k</div>
              <div className="mt-2 text-sm text-gold">+12.84% this cycle</div>
            </div>

            <div className="mt-8 rounded-[26px] border border-white/10 bg-black/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.24em] text-faint">Momentum</span>
                <span className="text-xs text-gold">Bullish</span>
              </div>
              <svg viewBox="0 0 300 130" className="w-full overflow-visible">
                <defs>
                  <linearGradient id="goldStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(207,171,103,0.15)" />
                    <stop offset="45%" stopColor="#cfab67" />
                    <stop offset="100%" stopColor="#f3dfb7" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M0 115 C35 108, 55 94, 78 96 C104 98, 115 80, 138 74 C160 69, 182 72, 210 51 C232 36, 248 43, 271 22 C283 11, 292 14, 300 8"
                  fill="none"
                  stroke="url(#goldStroke)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
                <path
                  d="M0 120 C35 113, 55 99, 78 101 C104 103, 115 85, 138 79 C160 74, 182 77, 210 56 C232 41, 248 48, 271 27 C283 16, 292 19, 300 13 L300 130 L0 130 Z"
                  fill="url(#goldStroke)"
                  opacity="0.08"
                />
              </svg>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-[0.25em] text-faint">Confidence</div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '82%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.7 }}
                    className="h-full rounded-full bg-[linear-gradient(90deg,#8c6a33,#cfab67,#f1ddb5)]"
                  />
                </div>
                <div className="mt-3 text-sm text-text">82 / 100</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-[0.25em] text-faint">Risk</div>
                <div className="mt-3 font-serifDisplay text-2xl text-text">Low</div>
                <div className="mt-2 text-xs text-muted">well diversified</div>
              </div>
            </div>

            <div className="mt-auto rounded-[24px] border border-[rgba(207,171,103,0.18)] bg-[rgba(207,171,103,0.06)] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-faint">AI directive</div>
                  <div className="mt-1 text-sm text-text">Increase quality tech by 4%</div>
                </div>
                <button className="rounded-full border border-[rgba(207,171,103,0.25)] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-gold transition hover:bg-[rgba(207,171,103,0.08)]">
                  Approve
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}