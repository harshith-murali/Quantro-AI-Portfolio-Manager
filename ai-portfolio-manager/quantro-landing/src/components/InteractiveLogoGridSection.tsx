import React, { useMemo, useState } from 'react';
import styles from './InteractiveLogoGridSection.module.css';
import { TICKERS, getIconUrl } from './logoData';

export interface InteractiveLogoGridSectionProps {
  children?: React.ReactNode;
  cellCount?: number;
}

function StockIcon({ symbol, slug }: { symbol: string, slug: string }) {
  const [error, setError] = useState(false);
  const iconUrl = getIconUrl(slug, symbol);

  return (
    <div className="flex flex-col items-center gap-2 group cursor-default">
      <div className="relative w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-gold/50 group-hover:bg-gold/10 group-hover:scale-110">
        {!error ? (
          <img 
            src={iconUrl} 
            alt={symbol} 
            className="w-6 h-6 object-contain opacity-20 group-hover:opacity-100 transition-opacity duration-500 filter grayscale group-hover:grayscale-0"
            onError={() => setError(true)}
          />
        ) : (
          <span className="text-[10px] font-bold text-white/20 group-hover:text-gold transition-colors">
            {symbol.slice(0, 2)}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <span className="text-[8px] font-mono font-bold tracking-tighter text-white/10 uppercase group-hover:text-gold/60 transition-colors duration-500">
        {symbol}
      </span>
    </div>
  );
}

export function InteractiveLogoGridSection({ 
  children,
  cellCount = 200
}: InteractiveLogoGridSectionProps) {
  
  const cells = useMemo(() => {
    // Pseudo-random hash to prevent repeating diagonal patterns
    // while maintaining deterministic SSR hydration
    const hash = (x: number) => {
      let h = x * 374761393 + 1374523;
      h = (h ^ (h >> 13)) * 3266489917;
      return (h ^ (h >> 16)) >>> 0;
    };
    
    return Array.from({ length: cellCount }).map((_, i) => ({
      ...TICKERS[hash(i) % TICKERS.length],
    }));
  }, [cellCount]);

  return (
    <section className={styles.container}>
      {/* Background Interactive Layer */}
      <div className={styles.grid}>
        {cells.map((cell, i) => (
          <div key={i} className={styles.cell}>
            <StockIcon symbol={cell.symbol} slug={cell.slug} />
          </div>
        ))}
      </div>

      {/* Edge Vignette */}
      <div className={styles.vignette} />

      {/* Foreground Content */}
      <div className={styles.foreground}>
        {children}
      </div>
    </section>
  );
}
