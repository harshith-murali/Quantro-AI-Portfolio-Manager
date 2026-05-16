"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Trade {
  entryDate: string;
  exitDate: string;
  pnl: number;
  pnlPct: number;
  shares: number;
  entryPrice: number;
}

interface EqPoint { date: string; equity: number; }

function holdingDays(entry: string, exit: string) {
  return Math.round((new Date(exit).getTime() - new Date(entry).getTime()) / 86400000);
}

export function AdvancedMetrics({ trades, equityCurve }: { trades: Trade[]; equityCurve: EqPoint[] }) {
  const [open, setOpen] = useState(false);
  if (!trades.length) return null;

  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);

  const avgWinPct = wins.length ? wins.reduce((s, t) => s + t.pnlPct, 0) / wins.length : 0;
  const avgLossPct = losses.length ? losses.reduce((s, t) => s + t.pnlPct, 0) / losses.length : 0;

  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;

  const sortedByPct = [...trades].sort((a, b) => b.pnlPct - a.pnlPct);
  const bestTrade = sortedByPct[0];
  const worstTrade = sortedByPct[sortedByPct.length - 1];

  const avgHolding = trades.reduce((s, t) => s + holdingDays(t.entryDate, t.exitDate), 0) / trades.length;

  // Time in market: sum of holding days / total trading days
  const totalDays = equityCurve.length;
  const daysInMarket = trades.reduce((s, t) => s + holdingDays(t.entryDate, t.exitDate), 0);
  const timeInMarketPct = totalDays > 0 ? (daysInMarket / totalDays) * 100 : null;

  const metrics = [
    { label: "Avg Win", value: `+${avgWinPct.toFixed(2)}%`, color: "text-emerald-400", show: wins.length > 0 },
    { label: "Avg Loss", value: `${avgLossPct.toFixed(2)}%`, color: "text-red-400", show: losses.length > 0 },
    { label: "Profit Factor", value: profitFactor !== null ? profitFactor.toFixed(2) : "∞", color: profitFactor !== null && profitFactor >= 1 ? "text-emerald-400" : "text-red-400", show: true },
    { label: "Best Trade", value: `+${bestTrade.pnlPct.toFixed(2)}%`, color: "text-emerald-400", show: true },
    { label: "Worst Trade", value: `${worstTrade.pnlPct.toFixed(2)}%`, color: "text-red-400", show: true },
    { label: "Avg Holding", value: `${avgHolding.toFixed(0)}d`, color: "text-white/60", show: true },
    { label: "Time in Market", value: timeInMarketPct !== null ? `${timeInMarketPct.toFixed(1)}%` : "N/A", color: "text-white/60", show: timeInMarketPct !== null },
  ].filter(m => m.show);

  return (
    <div className="glass-card mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full"
      >
        <p className="text-white/40 text-[10px] uppercase tracking-wider">Advanced Metrics</p>
        <ChevronDown size={14} className={`text-white/30 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/5">
          {metrics.map(m => (
            <div key={m.label} className="text-center">
              <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1">{m.label}</p>
              <p className={`text-xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
