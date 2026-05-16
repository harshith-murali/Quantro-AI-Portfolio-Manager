'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FeatureShowcaseImage from './FeatureShowcaseImage';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const SHOWCASE_FEATURES = [
  {
    tag: 'WATCHLIST',
    title: 'Multi-asset watchlist with market alerts',
    description:
      'Track stocks, crypto, and commodities in one unified view. Set price alerts that fire the instant a threshold is crossed — never miss a breakout or a breakdown again.',
    image: '/features/watchlist.png',
    link: '/signals',
    linkText: 'Explore Signals',
  },
  {
    tag: 'HEATMAP',
    title: 'Portfolio heatmap and allocation drilldown',
    description:
      'See your entire portfolio as a living heatmap — green for gains, red for losses, sized by allocation weight. Drill into sector breakdowns and spot concentration risk instantly.',
    image: '/features/heatmap.png',
    link: '/portfolio',
    linkText: 'View Portfolio',
  },
  {
    tag: 'COMPARE',
    title: 'Market compare mode',
    description:
      'Overlay any two stocks against a benchmark index. Compare returns, volatility, Sharpe ratio, and beta side by side across configurable time windows from 1 month to 3 years.',
    image: '/features/compare.png',
    link: '/backtest',
    linkText: 'Run Backtest',
  },
  {
    tag: 'JOURNAL',
    title: 'Trade journal and decision log',
    description:
      'Every trade is automatically logged with your rationale, entry/exit prices, and P&L outcome. Review your decision patterns, identify biases, and refine your strategy over time.',
    image: '/features/journal.png',
    link: '/dashboard',
    linkText: 'Open Dashboard',
  },
];

const TOTAL = SHOWCASE_FEATURES.length;

export function FeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const setRef = useCallback((el: HTMLDivElement | null, i: number) => {
    sectionRefs.current[i] = el;
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((section, index) => {
      if (!section) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveIndex(index);
            }
          });
        },
        {
          rootMargin: '-40% 0px -40% 0px',
          threshold: 0,
        }
      );

      observer.observe(section);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  return (
    <div className="relative">
      {/* ── Desktop: sticky-scroll layout ── */}
      <div className="hidden lg:flex relative">
        {/* Left: scrollable text panels */}
        <div className="w-[45%] xl:w-[42%]">
          {SHOWCASE_FEATURES.map((feature, i) => (
            <div
              key={feature.tag}
              ref={(el) => setRef(el, i)}
              className="h-screen flex items-center"
            >
              {/* Pure CSS transition — no Framer re-renders */}
              <div
                className="pr-12 xl:pr-20 transition-all duration-700 ease-out"
                style={{
                  opacity: activeIndex === i ? 1 : 0.08,
                  transform: activeIndex === i ? 'translateY(0)' : 'translateY(12px)',
                }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="h-px w-8 bg-gold/50" />
                  <span className="text-gold text-[11px] uppercase tracking-[0.35em]">
                    {feature.tag}
                  </span>
                  <span className="text-white/10 text-[11px] tracking-widest ml-auto tabular-nums">
                    {String(i + 1).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="font-serifDisplay text-4xl sm:text-[3rem] tracking-[-0.04em] text-text leading-[1.12] mb-5">
                  {feature.title}
                </h3>

                <p className="text-muted text-[16px] leading-[1.85] mb-8">
                  {feature.description}
                </p>

                <Link
                  href={feature.link}
                  className="inline-flex mt-2 items-center justify-center rounded-full border border-[rgba(207,171,103,0.3)] bg-[rgba(207,171,103,0.05)] px-6 py-3 text-[10px] uppercase tracking-[0.25em] text-gold transition-all hover:bg-[rgba(207,171,103,0.15)] hover:text-white hover:border-gold/50 hover:-translate-y-0.5"
                >
                  {feature.linkText} <ArrowUpRight className="ml-2 w-3 h-3" />
                </Link>

                {/* Progress bar */}
                <div className="flex gap-2 mt-10">
                  {SHOWCASE_FEATURES.map((_, di) => (
                    <div
                      key={di}
                      className="h-[3px] rounded-full transition-all duration-500"
                      style={{
                        width: di === i && activeIndex === i ? '32px' : '12px',
                        backgroundColor:
                          di === i && activeIndex === i
                            ? 'rgba(207,171,103,0.8)'
                            : 'rgba(255,255,255,0.06)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: sticky image pinned to viewport center */}
        <div className="w-[55%] xl:w-[58%]">
          <div className="sticky top-0 h-screen flex items-center justify-end">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
                className="w-full flex justify-end"
              >
                <FeatureShowcaseImage
                  src={SHOWCASE_FEATURES[activeIndex].image}
                  alt={SHOWCASE_FEATURES[activeIndex].title}
                  priority={activeIndex === 0}
                  className="w-full !max-w-[900px] xl:!max-w-[1100px]"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Mobile: simple stacked layout ── */}
      <div className="flex flex-col gap-24 py-16 lg:hidden">
        {SHOWCASE_FEATURES.map((feature, i) => (
          <div
            key={feature.tag}
            className="flex flex-col items-center gap-10 scroll-mt-32"
          >
            <div className="w-full max-w-xl px-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="h-px w-8 bg-gold/50" />
                  <span className="text-gold text-[11px] uppercase tracking-[0.35em]">
                    {feature.tag}
                  </span>
                  <span className="text-white/10 text-[11px] tracking-widest ml-auto tabular-nums">
                    {String(i + 1).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="font-serifDisplay text-3xl sm:text-4xl tracking-[-0.04em] text-text leading-[1.12] mb-5">
                  {feature.title}
                </h3>

                <p className="text-muted text-[15px] leading-[1.85] mb-8">
                  {feature.description}
                </p>

                <Link
                  href={feature.link}
                  className="inline-flex mt-2 items-center justify-center rounded-full border border-[rgba(207,171,103,0.3)] bg-[rgba(207,171,103,0.05)] px-6 py-3 text-[10px] uppercase tracking-[0.25em] text-gold transition-all hover:bg-[rgba(207,171,103,0.15)] hover:text-white hover:border-gold/50"
                >
                  {feature.linkText} <ArrowUpRight className="ml-2 w-3 h-3" />
                </Link>
              </motion.div>
            </div>

            <div className="w-full flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                <FeatureShowcaseImage
                  src={feature.image}
                  alt={feature.title}
                  priority={i === 0}
                  className="w-[92vw] max-w-[600px]"
                />
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
