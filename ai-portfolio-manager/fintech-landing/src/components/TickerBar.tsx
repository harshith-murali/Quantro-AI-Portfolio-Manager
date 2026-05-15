"use client";

import React from 'react';

const mockTickerData = [
  { symbol: "NIFTY", price: "23,689.60", change: "+1.18%", isPositive: true },
  { symbol: "BANKNIFTY", price: "54,128.95", change: "+1.26%", isPositive: true },
  { symbol: "NIFTYAUTO", price: "26,049.70", change: "+0.62%", isPositive: true },
  { symbol: "RELIANCE", price: "2,987.50", change: "-0.45%", isPositive: false },
  { symbol: "HDFCBANK", price: "1,678.90", change: "+0.85%", isPositive: true },
  { symbol: "TCS", price: "3,890.20", change: "-1.10%", isPositive: false },
  { symbol: "INFY", price: "1,456.75", change: "+0.30%", isPositive: true },
];

export function TickerBar() {
  return (
    <div className="fixed top-0 left-0 w-full overflow-hidden border-b border-white/5 bg-[#0a0a0a] py-1.5 z-[60]">
      <div className="flex w-max animate-ticker">
        {/* Double the data for seamless looping */}
        {[...mockTickerData, ...mockTickerData, ...mockTickerData].map((item, index) => (
          <div key={index} className="flex items-center gap-2 px-6 text-[11px] font-mono tracking-wider">
            <span className="text-muted">{item.symbol}</span>
            <span className="text-white">{item.price}</span>
            <span className={`flex items-center gap-1 ${item.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {item.isPositive ? '↑' : '↓'} {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
