"use client";
import Link from "next/link";

import { Bot, Activity, Play, PieChart, ArrowRight } from "lucide-react";

interface Signal { symbol: string; signal: string; changePercent?: number; rsi?: number; }
interface Mover { symbol: string; pnlPercent: number; }

interface Props {
  signals: Signal[];
  gainers: Mover[];
  losers: Mover[];
}

export function MarketMoversPanel({ signals, gainers, losers }: Props) {
  const bestSignal = signals.find(s => s.signal === "BUY");
  const sellSignal = signals.find(s => s.signal === "SELL");
  const topGainer = gainers[0] ?? null;
  const topLoser = losers[0] ?? null;

  const items = [
    bestSignal && {
      label: "Best Signal",
      symbol: bestSignal.symbol,
      value: bestSignal.changePercent != null ? `${bestSignal.changePercent > 0 ? "+" : ""}${bestSignal.changePercent.toFixed(1)}%` : "BUY",
      positive: true,
      tag: "BUY",
    },
    sellSignal && {
      label: "Watch Out",
      symbol: sellSignal.symbol,
      value: sellSignal.changePercent != null ? `${sellSignal.changePercent.toFixed(1)}%` : "SELL",
      positive: false,
      tag: "SELL",
    },
    topGainer && {
      label: "Top Gainer",
      symbol: topGainer.symbol,
      value: `+${topGainer.pnlPercent.toFixed(2)}%`,
      positive: true,
      tag: null,
    },
    topLoser && {
      label: "Top Loser",
      symbol: topLoser.symbol,
      value: `${topLoser.pnlPercent.toFixed(2)}%`,
      positive: false,
      tag: null,
    },
  ].filter(Boolean) as Array<{ label: string; symbol: string; value: string; positive: boolean; tag: string | null }>;

  return (
    <div className="flex flex-col gap-4 h-full">
      <p className="text-white/40 text-[10px] uppercase tracking-wider">Market Movers</p>

      {items.length === 0 ? (
        <p className="text-white/20 text-sm">No signals available.</p>
      ) : (
        <div className="space-y-2.5 flex-1">
          {items.map(item => (
            <div
              key={item.label + item.symbol}
              className={`flex justify-between items-center p-3 rounded-xl border ${
                item.positive
                  ? "bg-emerald-400/[0.04] border-emerald-400/15"
                  : "bg-red-400/[0.04] border-red-400/15"
              }`}
            >
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">{item.label}</p>
                <p className="text-white text-sm font-semibold">{item.symbol}</p>
                {item.tag && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    item.positive ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                  }`}>
                    {item.tag}
                  </span>
                )}
              </div>
              <span className={`text-sm font-bold tabular-nums ${item.positive ? "text-emerald-400" : "text-red-400"}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-white/5 pt-4 flex flex-col gap-2.5 mt-auto">
        <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Quick Actions</p>
        {[
          { href: "/ai",        label: "AI Advisor",    icon: <Bot size={14} /> },
          { href: "/signals",   label: "View Signals",   icon: <Activity size={14} /> },
          { href: "/backtest",  label: "Run Backtest",   icon: <Play size={14} /> },
          { href: "/portfolio", label: "My Portfolio",  icon: <PieChart size={14} /> },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className="flex items-center justify-between text-xs text-white/40 hover:text-gold transition-colors group px-1">
            <div className="flex items-center gap-2.5">
              <span className="text-white/20 group-hover:text-gold/50 transition-colors">{a.icon}</span>
              <span>{a.label}</span>
            </div>
            <ArrowRight size={12} className="text-white/10 group-hover:text-gold transition-all group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
