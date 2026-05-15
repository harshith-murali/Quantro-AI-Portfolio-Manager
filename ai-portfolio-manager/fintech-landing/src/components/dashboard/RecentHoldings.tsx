"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, ArrowRight, Clock } from "lucide-react";

interface Holding {
  symbol: string;
  quantity: number;
  averageBuyPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

export function RecentHoldings({ holdings }: { holdings: Holding[] }) {
  if (!holdings.length) {
    return (
      <div className="glass-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg text-white font-semibold">Recent Holdings</h2>
          <Link href="/portfolio" className="text-gold text-xs hover:underline">View All</Link>
        </div>
        <div className="text-center py-10">
          <p className="text-4xl mb-3 text-white/10">◌</p>
          <p className="text-white/30 text-sm mb-3">No holdings yet.</p>
          <Link href="/signals" className="flex items-center justify-center gap-2 text-gold text-sm hover:underline">
            Browse signals <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg text-white font-semibold">Recent Holdings</h2>
        <Link href="/portfolio" className="flex items-center gap-1 text-gold text-xs hover:underline">
          View All <ChevronRight size={12} />
        </Link>
      </div>
      <div className="space-y-0">
        {holdings.slice(0, 5).map((h, i) => (
          <div
            key={h.symbol}
            className="flex justify-between items-center py-3 border-b border-white/[0.05] last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/50">
                {h.symbol.slice(0, 2)}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{h.symbol}</p>
                <p className="text-white/30 text-xs">{h.quantity} shares · avg ₹{h.averageBuyPrice.toFixed(0)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white text-sm tabular-nums">₹{h.currentValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
              <p className={`text-xs tabular-nums ${h.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {h.pnl >= 0 ? "+" : ""}₹{h.pnl.toFixed(0)} ({h.pnlPercent >= 0 ? "+" : ""}{h.pnlPercent.toFixed(2)}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
