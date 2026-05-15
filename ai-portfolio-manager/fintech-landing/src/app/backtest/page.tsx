"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, BarChart, Bar, Cell, LineChart, Line,
} from "recharts";
import { 
  AlertTriangle, 
  ArrowRight, 
  BarChart3, 
  History, 
  TrendingUp, 
  TrendingDown,
  Info,
  Play,
  Settings2,
  Lock
} from "lucide-react";
import { backtestSchema, type BacktestInput } from "@/lib/validations";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { NSE_SYMBOLS } from "@/lib/constants";
import { TradeTable } from "@/components/backtest/TradeTable";
import { InterpretationPanel } from "@/components/backtest/InterpretationPanel";
import { BenchmarkComparison } from "@/components/backtest/BenchmarkComparison";
import { AdvancedMetrics } from "@/components/backtest/AdvancedMetrics";

const STRATEGIES = [
  { value: "SMA_CROSSOVER", label: "SMA Crossover", desc: "Short vs Long SMA" },
] as const;

// ── Helper: compute drawdown series from equity curve ────────────────
function computeDrawdownSeries(curve: { value: number }[]): { dd: number }[] {
  let peak = curve[0]?.value ?? 0;
  return curve.map(pt => {
    if (pt.value > peak) peak = pt.value;
    const dd = peak > 0 ? -((peak - pt.value) / peak) * 100 : 0;
    return { dd };
  });
}

// ── Helper: compute monthly returns from equity curve ────────────────
function computeMonthlyReturns(rawEq: any[]): { month: string; ret: number }[] {
  if (!rawEq.length) return [];
  const byMonth: Record<string, number[]> = {};
  for (const pt of rawEq) {
    const key = pt.date.slice(0, 7); // "YYYY-MM"
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(pt.equity);
  }
  const months = Object.keys(byMonth).sort();
  const result: { month: string; ret: number }[] = [];
  for (let i = 0; i < months.length; i++) {
    const arr = byMonth[months[i]];
    const open = i === 0 ? arr[0] : byMonth[months[i - 1]].at(-1)!;
    const close = arr.at(-1)!;
    const ret = open > 0 ? ((close - open) / open) * 100 : 0;
    const label = new Date(months[i] + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    result.push({ month: label, ret });
  }
  return result;
}

export default function BacktestPage() {
  const router = useRouter();
  const { accessToken } = useStore();
  const [report, setReport] = useState<any | null>(null);
  const [serverError, setServerError] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  // Track backtest usage count (persisted in localStorage)
  const BACKTEST_FREE_LIMIT = 5;
  const BACKTEST_PRICE = 49;
  const getBacktestCount = () => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("backtest_count") ?? 0);
  };
  const incrementBacktestCount = () => {
    const count = getBacktestCount() + 1;
    localStorage.setItem("backtest_count", String(count));
    return count;
  };
  const [backtestCount, setBacktestCount] = useState(0);

  useEffect(() => {
    setBacktestCount(getBacktestCount());
  }, []);

  useEffect(() => {
    if (!accessToken) router.push("/auth/login");
  }, [accessToken]);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<BacktestInput>({
    resolver: zodResolver(backtestSchema),
    defaultValues: { initialCapital: 100000, positionSize: 10, shortWindow: 20, longWindow: 50, strategy: "SMA_CROSSOVER" },
  });

  const onSubmit = async (data: BacktestInput & { transactionCostPct?: number; slippagePct?: number }) => {
    if (!accessToken) return;

    // Check free limit
    if (backtestCount >= BACKTEST_FREE_LIMIT) {
      setShowPaywall(true);
      return;
    }

    setServerError("");
    setReport(null);
    setRunning(true);
    setProgress(0);

    const timer = setInterval(() => setProgress(p => Math.min(p + 12, 90)), 300);

    try {
      const result = await api.backtest.run(data, accessToken);
      clearInterval(timer);
      setProgress(100);

      const rawEqCurve: any[] = result.equityCurve || [];
      const rawTrades: any[] = result.trades || [];

      // ── Derived metrics ──────────────────────────────────────────
      let buyAndHoldReturnPct = 0;
      let sharpeRatio = 0;

      if (rawEqCurve.length > 0) {
        const firstClose = rawEqCurve[0].close;
        const lastClose = rawEqCurve[rawEqCurve.length - 1].close;
        buyAndHoldReturnPct = ((lastClose - firstClose) / firstClose) * 100;

        const dailyReturns: number[] = [];
        for (let i = 1; i < rawEqCurve.length; i++) {
          const prev = rawEqCurve[i - 1].equity;
          const curr = rawEqCurve[i].equity;
          if (prev > 0) dailyReturns.push((curr - prev) / prev);
        }
        if (dailyReturns.length > 1) {
          const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
          const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyReturns.length;
          const std = Math.sqrt(variance);
          sharpeRatio = std === 0 ? 0 : (mean / std) * Math.sqrt(252);
        }
      }

      // ── Enriched equity curve for chart ─────────────────────────
      const firstClose = rawEqCurve[0]?.close ?? 1;
      const chartEqCurve = rawEqCurve.map((pt: any) => ({
        date: new Date(pt.date).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        value: pt.equity,
        benchmark: data.initialCapital * (pt.close / firstClose),
        close: pt.close,
      }));

      // ── Drawdown series ──────────────────────────────────────────
      const ddSeries = computeDrawdownSeries(chartEqCurve).map((d, i) => ({
        date: chartEqCurve[i]?.date ?? "",
        dd: d.dd,
      }));

      // ── Monthly returns from real equity data ────────────────────
      const monthlyReturns = computeMonthlyReturns(rawEqCurve);

      // ── Normalized trades ────────────────────────────────────────
      const trades = rawTrades.map((t: any) => ({
        entryDate: t.entryDate,
        entryPrice: t.entryPrice,
        exitDate: t.exitDate,
        exitPrice: t.exitPrice,
        shares: t.shares,
        pnl: t.pnl,
        pnlPct: t.entryPrice > 0 ? ((t.exitPrice - t.entryPrice) / t.entryPrice) * 100 : 0,
      }));

      setReport({
        totalReturnPct: result.summary?.totalReturnPct ?? 0,
        annualisedReturnPct: result.summary?.cagr ?? 0,
        maxDrawdownPct: result.summary?.maxDrawdownPct ?? 0,
        winRatePct: result.summary?.winRatePct ?? 0,
        totalTrades: result.summary?.totalTrades ?? 0,
        endingCapital: result.summary?.endingCapital ?? data.initialCapital,
        sharpeRatio,
        buyAndHoldReturnPct,
        equityCurve: chartEqCurve,
        ddSeries,
        monthlyReturns,
        trades,
        rawEquityCurve: rawEqCurve,
        initialCapital: data.initialCapital,
      });

      setTimeout(() => {
        setRunning(false);
        // Increment usage count
        const newCount = incrementBacktestCount();
        setBacktestCount(newCount);
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 400);
    } catch (e: any) {
      clearInterval(timer);
      setProgress(100);
      setServerError(e?.message ?? "Backtest failed. Check your inputs and try again.");
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen pt-40 pb-24 px-4 md:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-1">Testing Engine</p>
        <h1 className="text-5xl font-bold text-white">Backtesting</h1>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-white/30 text-sm">Simulate strategies against historical NSE data</p>
          <span className={`text-[10px] px-3 py-1 rounded-full border font-medium tabular-nums ${
            backtestCount >= BACKTEST_FREE_LIMIT
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}>
            {Math.max(0, BACKTEST_FREE_LIMIT - backtestCount)}/{BACKTEST_FREE_LIMIT} free runs left
          </span>
        </div>
      </div>

      {/* Config form */}
      <form onSubmit={handleSubmit(onSubmit as any)} className="glass-card mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div>
            <label className="field-label">NSE Symbol</label>
            <select {...register("symbol")} className="auth-input">
              <option value="">Select stock…</option>
              {NSE_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Strategy</label>
            <select {...register("strategy")} className="auth-input">
              {STRATEGIES.map(s => <option key={s.value} value={s.value}>{s.label} — {s.desc}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Start Date</label>
            <input {...register("dateFrom")} type="date" className="auth-input" required />
          </div>
          <div>
            <label className="field-label">End Date</label>
            <input {...register("dateTo")} type="date" className="auth-input" required />
          </div>
          <div>
            <label className="field-label">Initial Capital (₹)</label>
            <input {...register("initialCapital", { valueAsNumber: true })} type="number" className="auth-input" placeholder="100000" />
          </div>
          <div>
            <label className="field-label">Position Size (%)</label>
            <input {...register("positionSize", { valueAsNumber: true })} type="number" className="auth-input" placeholder="10" min={1} max={100} />
          </div>
          <div>
            <label className="field-label">Short Window</label>
            <input {...register("shortWindow", { valueAsNumber: true })} type="number" className="auth-input" placeholder="20" min={1} />
          </div>
          <div>
            <label className="field-label">Long Window</label>
            <input {...register("longWindow", { valueAsNumber: true })} type="number" className="auth-input" placeholder="50" min={2} />
          </div>

          {/* Fees & slippage — passed to API for future backend support */}
          <div>
            <label className="field-label">Transaction Cost (%)</label>
            <input type="number" step="0.01" defaultValue={0.10} className="auth-input" placeholder="0.10"
              id="txCostInput" min={0} max={5} />
          </div>
          <div>
            <label className="field-label">Slippage (%)</label>
            <input type="number" step="0.01" defaultValue={0.05} className="auth-input" placeholder="0.05"
              id="slippageInput" min={0} max={5} />
          </div>
        </div>

        <div className="flex gap-2 mb-5 border border-white/5 rounded-lg px-3 py-2">
          <AlertTriangle size={14} className="text-white/20 shrink-0 mt-0.5" />
          <p className="text-white/20 text-[10px]">
            Results may differ materially once transaction costs and slippage are applied. Backend support for these parameters is pending.
          </p>
        </div>

        {serverError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{serverError}</p>
          </div>
        )}

        {running && (
          <div className="mb-5">
            <div className="flex justify-between text-xs text-white/40 mb-2">
              <span>Computing backtest…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-gold/60 to-gold rounded-full" />
            </div>
          </div>
        )}

        <button type="submit" disabled={isSubmitting || running} className="gold-btn w-full flex items-center justify-center gap-2">
          {running ? "Running simulation…" : (
            <>
              Run Backtest <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Results */}
      <AnimatePresence>
        {report && (
          <motion.div id="results" key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-[0.3em]">Backtest Results</p>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  Performance Report
                  {report.totalTrades <= 2 && report.totalTrades > 0 && (
                    <span className="flex items-center gap-1.5 text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-normal">
                      <AlertTriangle size={10} /> Low Sample
                    </span>
                  )}
                </h2>
              </div>
            </div>

            {/* Diagnostic states */}
            {report.totalTrades === 0 && (
              <div className="glass-card mb-6 text-center py-6 border border-yellow-500/30">
                <p className="text-yellow-400 text-sm font-medium">No trades were generated for this date range and parameter set.</p>
                <p className="text-white/30 text-xs mt-1">Try widening the date range or reducing the gap between short and long windows.</p>
              </div>
            )}
            {report.totalTrades === 1 && (
              <div className="glass-card mb-6 text-center py-4 border border-yellow-500/20">
                <p className="text-yellow-400/80 text-sm">Only one trade was generated. This result is not statistically reliable.</p>
              </div>
            )}

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Return", value: `${report.totalReturnPct.toFixed(1)}%`, sub: `vs ${report.buyAndHoldReturnPct?.toFixed(1)}% buy & hold`, color: report.totalReturnPct > 0 ? "text-emerald-400" : report.totalReturnPct < 0 ? "text-red-400" : "text-gold" },
                { label: "CAGR", value: `${report.annualisedReturnPct?.toFixed(1)}%`, sub: "Annualised", color: report.annualisedReturnPct > 0 ? "text-emerald-400" : report.annualisedReturnPct < 0 ? "text-red-400" : "text-gold" },
                { label: "Win Rate", value: `${report.winRatePct.toFixed(1)}%`, sub: `${report.totalTrades ?? 0} trades`, color: "text-white" },
                { label: "Max Drawdown", value: `${report.maxDrawdownPct.toFixed(1)}%`, sub: "Worst dip", color: "text-red-400" },
                { label: "Sharpe Ratio", value: report.totalTrades > 2 ? report.sharpeRatio.toFixed(2) : "N/A", sub: "> 1 is good", color: report.sharpeRatio > 1 ? "text-emerald-400" : "text-yellow-400" },
                { label: "Total Trades", value: report.totalTrades ?? "—", sub: "Executed", color: "text-white" },
                { label: "Ending Capital", value: `₹${report.endingCapital?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, sub: "Final Balance", color: "text-gold" },
                { label: "Buy & Hold", value: `${report.buyAndHoldReturnPct?.toFixed(1) ?? "—"}%`, sub: "Passive return", color: report.buyAndHoldReturnPct > 0 ? "text-emerald-400" : report.buyAndHoldReturnPct < 0 ? "text-red-400" : "text-white/60" },
              ].map(({ label, value, sub, color }) => (
                <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card text-center">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">{label}</p>
                  <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
                  <p className="text-white/20 text-[10px] mt-1">{sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Interpretation */}
            <InterpretationPanel
              totalReturnPct={report.totalReturnPct}
              buyAndHoldReturnPct={report.buyAndHoldReturnPct}
              maxDrawdownPct={report.maxDrawdownPct}
              sharpeRatio={report.sharpeRatio}
              totalTrades={report.totalTrades}
              annualisedReturnPct={report.annualisedReturnPct}
            />

            {/* Strategy vs Benchmark */}
            {report.rawEquityCurve?.length > 0 && (
              <BenchmarkComparison
                strategy={{
                  totalReturnPct: report.totalReturnPct,
                  annualisedReturnPct: report.annualisedReturnPct,
                  maxDrawdownPct: report.maxDrawdownPct,
                  endingCapital: report.endingCapital,
                  sharpeRatio: report.sharpeRatio,
                  totalTrades: report.totalTrades,
                }}
                buyAndHoldReturnPct={report.buyAndHoldReturnPct}
                initialCapital={report.initialCapital}
                rawEquityCurve={report.rawEquityCurve}
              />
            )}

            {/* Advanced metrics */}
            {report.trades?.length > 0 && (
              <AdvancedMetrics trades={report.trades} equityCurve={report.equityCurve} />
            )}

            {/* Equity Curve */}
            <div className="glass-card mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Equity Curve</p>
                <div className="flex gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-gold inline-block rounded" /> Strategy</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-teal-500 inline-block rounded" /> Buy &amp; Hold</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={report.equityCurve}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#cfab67" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#cfab67" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" name="Strategy" stroke="#cfab67" fill="url(#eqGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="benchmark" name="Buy & Hold" stroke="#14b8a6" fill="transparent" strokeWidth={1.5} dot={false} />
                  <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any, name?: any) => [`₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, name ?? ""]}
                  />
                  <ReferenceLine y={report.equityCurve?.[0]?.value || 100000} stroke="#222" strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Drawdown chart */}
            {report.ddSeries?.length > 0 && (
              <div className="glass-card mb-6">
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-4">Drawdown</p>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={report.ddSeries}>
                    <defs>
                      <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="dd" stroke="#f87171" fill="url(#ddGrad)" strokeWidth={1.5} dot={false} />
                    <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis hide domain={["auto", 0]} />
                    <Tooltip
                      contentStyle={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                      formatter={(v: any) => [`${Number(v).toFixed(2)}%`, "Drawdown"]}
                    />
                    <ReferenceLine y={0} stroke="#333" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Monthly Returns from real data */}
            {report.monthlyReturns?.length > 0 && (
              <div className="glass-card mb-6">
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-4">Monthly Returns</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={report.monthlyReturns} barCategoryGap="20%">
                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                      formatter={(v: any) => [`${Number(v).toFixed(2)}%`, "Return"]}
                    />
                    <Bar dataKey="ret" radius={[3, 3, 0, 0]}>
                      {report.monthlyReturns.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.ret >= 0 ? "rgba(52,211,153,0.65)" : "rgba(248,113,113,0.65)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Full trade table */}
            {report.trades !== undefined && (
              <TradeTable trades={report.trades} />
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Paywall Modal */}
      <AnimatePresence>
        {showPaywall && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPaywall(false)}
          >
            <motion.div
              className="glass-card max-w-sm w-full text-center"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-2xl mx-auto mb-4">
                ⚡
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Free Limit Reached</h2>
              <p className="text-white/40 text-sm mb-6">
                You&apos;ve used all {BACKTEST_FREE_LIMIT} free backtests. Unlock unlimited access for just <span className="text-gold font-bold">₹{BACKTEST_PRICE}</span> per run.
              </p>

              <div className="p-3 bg-gold/5 border border-gold/20 rounded-xl mb-6 text-left">
                <p className="text-white/60 text-xs leading-relaxed">
                  <span className="text-gold font-medium">Premium includes:</span><br />
                  • Unlimited backtest runs<br />
                  • Advanced strategy parameters<br />
                  • Downloadable PDF reports<br />
                  • Priority execution queue
                </p>
              </div>

              <button
                onClick={() => {
                  localStorage.setItem("backtest_count", "0");
                  setBacktestCount(0);
                  setShowPaywall(false);
                }}
                className="w-full py-3 rounded-full bg-gold hover:bg-gold/90 text-black font-semibold text-sm uppercase tracking-wider transition-all mb-3"
              >
                Pay ₹{BACKTEST_PRICE} & Continue
              </button>
              <button
                onClick={() => setShowPaywall(false)}
                className="text-white/30 text-xs hover:text-white transition-colors"
              >
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
