'use client';

import { Navbar } from '@/components/Navbar';
import { CursorGlow } from '@/components/CursorGlow';
import { LoadingSplash } from '@/components/LoadingSplash';
import { HeroAmbient } from '@/components/HeroAmbient';
import { TickerBar } from '@/components/TickerBar';
import { TradeNotifications } from '@/components/TradeNotifications';

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LoadingSplash />
      <CursorGlow />
      <TickerBar />
      <Navbar />
      <TradeNotifications />

      {/* Persistent ambient background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <HeroAmbient />
      </div>

      <div className="relative z-0">
        {children}
      </div>
    </>
  );
}

