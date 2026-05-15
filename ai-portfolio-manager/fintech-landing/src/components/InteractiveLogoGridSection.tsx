import React, { useMemo } from 'react';
import styles from './InteractiveLogoGridSection.module.css';
import { LOGOS } from './logoData';

export interface InteractiveLogoGridSectionProps {
  children?: React.ReactNode;
  cellCount?: number;
}

export function InteractiveLogoGridSection({ 
  children,
  cellCount = 240
}: InteractiveLogoGridSectionProps) {
  
  // Use a coprime step so every cell gets a different logo in a non-repeating pattern
  const cells = useMemo(() => {
    const step = 11; // coprime with most array lengths for even distribution
    return Array.from({ length: cellCount }).map((_, i) => ({
      src: LOGOS[(i * step) % LOGOS.length],
    }));
  }, [cellCount]);

  return (
    <section className={styles.container}>
      {/* Background Interactive Layer */}
      <div className={styles.grid}>
        {cells.map((cell, i) => (
          <div key={i} className={styles.cell}>
            <img 
              src={cell.src}
              alt="company logo"
              className={styles.logo}
              loading="lazy"
              decoding="async"
            />
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
