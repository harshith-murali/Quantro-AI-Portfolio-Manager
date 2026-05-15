"use client";
import { CheckCircle2 } from "lucide-react";

interface EqPoint { close: number; equity: number; }

function computeBenchmarkDrawdown(curve: EqPoint[], initialCapital: number): number {
  if (!curve.length) return 0;
  const firstClose = curve[0].close;
  let peak = initialCapital;
  let maxDD = 0;
  for (const pt of curve) {
    const bEq = initialCapital * (pt.close / firstClose);
    if (bEq > peak) peak = bEq;
    const dd = (peak - bEq) / peak * 100;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

interface Props {
  strategy: {
    totalReturnPct: number;
    annualisedReturnPct: number;
    maxDrawdownPct: number;
    endingCapital: number;
    sharpeRatio: number;
    totalTrades: number;
  };
  buyAndHoldReturnPct: number;
  initialCapital: number;
  rawEquityCurve: EqPoint[]; // raw from API (has .close and .equity)
}

export function BenchmarkComparison({ strategy, buyAndHoldReturnPct, initialCapital, rawEquityCurve }: Props) {
  const firstClose = rawEquityCurve[0]?.close ?? 1;
  const lastClose = rawEquityCurve[rawEquityCurve.length - 1]?.close ?? firstClose;
  const benchmarkEndingCapital = initialCapital * (lastClose / firstClose);
  const benchmarkDrawdown = computeBenchmarkDrawdown(rawEquityCurve, initialCapital);
  // Benchmark CAGR — use same duration as strategy
  const days = rawEquityCurve.length;
  const years = days / 252;
  const benchmarkCagr = years > 0
    ? (Math.pow(benchmarkEndingCapital / initialCapital, 1 / years) - 1) * 100
    : 0;

  const rows: Array<{
    label: string;
    strategy: string;
    benchmark: string;
    strategyWins: boolean | null;
    lowerIsBetter?: boolean;
  }> = [
    {
      label: "Total Return",
      strategy: `${strategy.totalReturnPct.toFixed(2)}%`,
      benchmark: `${buyAndHoldReturnPct.toFixed(2)}%`,
      strategyWins: strategy.totalReturnPct > buyAndHoldReturnPct,
    },
    {
      label: "CAGR",
      strategy: `${strategy.annualisedReturnPct.toFixed(2)}%`,
      benchmark: `${benchmarkCagr.toFixed(2)}%`,
      strategyWins: strategy.annualisedReturnPct > benchmarkCagr,
    },
    {
      label: "Max Drawdown",
      strategy: `${strategy.maxDrawdownPct.toFixed(2)}%`,
      benchmark: `${benchmarkDrawdown.toFixed(2)}%`,
      strategyWins: strategy.maxDrawdownPct < benchmarkDrawdown,
      lowerIsBetter: true,
    },
    {
      label: "Ending Capital",
      strategy: `₹${strategy.endingCapital.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      benchmark: `₹${benchmarkEndingCapital.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      strategyWins: strategy.endingCapital > benchmarkEndingCapital,
    },
    {
      label: "Sharpe Ratio",
      strategy: strategy.totalTrades > 2 ? strategy.sharpeRatio.toFixed(2) : "N/A",
      benchmark: "—",
      strategyWins: null, // no benchmark Sharpe available
    },
    {
      label: "Total Trades",
      strategy: String(strategy.totalTrades),
      benchmark: "1 (buy & hold)",
      strategyWins: null,
    },
  ];

  return (
    <div className="glass-card mb-6">
      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-4">Strategy vs. Buy &amp; Hold</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-2 px-3 text-white/25 font-normal uppercase tracking-wider">Metric</th>
              <th className="text-right py-2 px-3 text-white/25 font-normal uppercase tracking-wider">
                <span className="inline-flex items-center gap-1"><span className="w-2 h-0.5 bg-gold inline-block rounded" /> Strategy</span>
              </th>
              <th className="text-right py-2 px-3 text-white/25 font-normal uppercase tracking-wider">
                <span className="inline-flex items-center gap-1"><span className="w-2 h-0.5 bg-teal-500 inline-block rounded" /> Buy &amp; Hold</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label} className="border-b border-white/[0.04]">
                <td className="py-2.5 px-3 text-white/40">{row.label}</td>
                <td className={`py-2.5 px-3 text-right tabular-nums font-medium ${
                  row.strategyWins === true ? "text-emerald-400" : row.strategyWins === false ? "text-red-400/80" : "text-white/60"
                }`}>
                  {row.strategyWins === true && <CheckCircle2 size={10} className="inline-block mr-1 text-emerald-400/50" />}
                  {row.strategy}
                </td>
                <td className={`py-2.5 px-3 text-right tabular-nums font-medium ${
                  row.strategyWins === false ? "text-teal-400" : "text-white/30"
                }`}>
                  {row.strategyWins === false && <CheckCircle2 size={10} className="inline-block mr-1 text-teal-400/50" />}
                  {row.benchmark}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
