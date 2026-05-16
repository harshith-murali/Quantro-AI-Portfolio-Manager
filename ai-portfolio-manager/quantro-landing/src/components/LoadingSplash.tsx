'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function LoadingSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.6, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-4"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(207,171,103,0.65)] bg-[rgba(207,171,103,0.08)] text-[12px] uppercase tracking-[0.35em] text-gold shadow-[0_0_40px_rgba(207,171,103,0.35)]">
          Q
        </div>
        <div className="text-xs uppercase tracking-[0.35em] text-muted">quantro</div>
        <motion.div
          className="h-px w-40 bg-[linear-gradient(90deg,transparent,rgba(207,171,103,0.85),transparent)]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="mt-2 font-serifDisplay text-2xl tracking-[0.15em] text-text">
          defy market gravity
        </div>
      </motion.div>
    </motion.div>
  );
}