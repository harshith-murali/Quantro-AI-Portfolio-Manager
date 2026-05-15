'use client';

import { motion } from 'framer-motion';
import FeatureShowcaseImage from './FeatureShowcaseImage';
import Link from 'next/link';

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
  return (
    <div className="flex flex-col gap-32 py-16 lg:gap-48 lg:py-32">
      {SHOWCASE_FEATURES.map((feature, i) => {
        return (
          <div
            key={feature.tag}
            id={feature.tag.toLowerCase()}
            className="flex flex-col items-center gap-16 lg:flex-row lg:items-center scroll-mt-32"
          >
            {/* Text Side */}
            <div className="flex-1 w-full max-w-xl lg:pr-16 xl:pr-24">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
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
                  {feature.linkText} ↗
                </Link>
              </motion.div>
            </div>

            {/* Image Side - allowing it to be huge */}
            <div className="flex-[1.5] flex justify-end w-full relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex justify-end"
              >
                <FeatureShowcaseImage 
                  src={feature.image}
                  alt={feature.title}
                  priority={i === 0}
                  className="w-[110%] md:w-full !max-w-[900px] xl:!max-w-[1100px]"
                />
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
