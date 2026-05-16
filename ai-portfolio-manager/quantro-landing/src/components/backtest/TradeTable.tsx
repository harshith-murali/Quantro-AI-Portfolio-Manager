"use client";
import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

interface Trade {
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  shares: number;
  pnl: number;
  pnlPct: number;
}

function holdingDays(entry: string, exit: string): number {
  return Math.round((new Date(exit).getTime() - new Date(entry).getTime()) / 86400000);
}

const PAGE_SIZE = 10;

export function TradeTable({ trades }: { trades: Trade[] }) {
  const [page, setPage] = useState(0);

  const sorted = [...trades].sort(
    (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const totalPnl = sorted.reduce((s, t) => s + t.pnl, 0);
  const avgReturn = sorted.length ? sorted.reduce((s, t) => s + t.pnlPct, 0) / sorted.length : 0;
  const avgHolding = sorted.length
    ? sorted.reduce((s, t) => s + holdingDays(t.entryDate, t.exitDate), 0) / sorted.length
    : 0;

  const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

  return (
    <div className="glass-card mb-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/40 text-[10px] uppercase tracking-wider">Trade Executions</p>
        {trades.length <= 2 && trades.length > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">
            <AlertTriangle size={10} /> Low trade count — results may not be statistically reliable
          </span>
        )}
      </div>

      {trades.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-6">No trades executed.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {["#", "Entry Date", "Entry ₹", "Exit Date", "Exit ₹", "Shares", "P&L ₹", "P&L %", "Days"].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-white/25 font-normal uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((t, i) => {
                  const idx = page * PAGE_SIZE + i + 1;
                  const days = holdingDays(t.entryDate, t.exitDate);
                  const win = t.pnl >= 0;
                  return (
                    <tr key={idx} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-2 text-white/30">{idx}</td>
                      <td className="py-2.5 px-2 text-white/50 whitespace-nowrap">{t.entryDate}</td>
                      <td className="py-2.5 px-2 text-white tabular-nums">₹{fmt(t.entryPrice)}</td>
                      <td className="py-2.5 px-2 text-white/50 whitespace-nowrap">{t.exitDate}</td>
                      <td className="py-2.5 px-2 text-white tabular-nums">₹{fmt(t.exitPrice)}</td>
                      <td className="py-2.5 px-2 text-white/50 tabular-nums">{t.shares}</td>
                      <td className={`py-2.5 px-2 font-medium tabular-nums ${win ? "text-emerald-400" : "text-red-400"}`}>
                        {win ? "+" : ""}₹{fmt(t.pnl)}
                      </td>
                      <td className={`py-2.5 px-2 tabular-nums ${win ? "text-emerald-400" : "text-red-400"}`}>
                        {win ? "+" : ""}{t.pnlPct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-2 text-white/30 tabular-nums">{days}d</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10">
                  <td colSpan={6} className="py-2.5 px-2 text-white/25 text-[10px] uppercase tracking-wider">Summary</td>
                  <td className={`py-2.5 px-2 font-semibold tabular-nums ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {totalPnl >= 0 ? "+" : ""}₹{fmt(totalPnl)}
                  </td>
                  <td className={`py-2.5 px-2 tabular-nums ${avgReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    avg {avgReturn >= 0 ? "+" : ""}{avgReturn.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-2 text-white/30 tabular-nums">{avgHolding.toFixed(0)}d avg</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
              <span className="text-white/25 text-[10px]">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-1 text-[10px] border border-white/10 rounded text-white/40 disabled:opacity-30 hover:border-white/20 hover:text-white/60 transition-all"
                >
                  <ChevronLeft size={10} /> Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="flex items-center gap-1 px-3 py-1 text-[10px] border border-white/10 rounded text-white/40 disabled:opacity-30 hover:border-white/20 hover:text-white/60 transition-all"
                >
                  Next <ChevronRight size={10} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
