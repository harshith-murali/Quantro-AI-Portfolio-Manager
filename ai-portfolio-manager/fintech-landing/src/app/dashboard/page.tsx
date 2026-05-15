"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/useAuth";
import { api } from "@/lib/api";
import { RecentHoldings } from "@/components/dashboard/RecentHoldings";
import { MarketMoversPanel } from "@/components/dashboard/MarketMoversPanel";
import { PortfolioVsBenchmarkChart } from "@/components/dashboard/PortfolioVsBenchmarkChart";
import { StrategyInsightCard } from "@/components/dashboard/StrategyInsightCard";

// ── Market open logic (IST 9:15 – 15:30, Mon–Fri) ─────────────────
function isMarketOpen() {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = ist.getDay();
  if (day === 0 || day === 6) return false;
  const h = ist.getHours(), m = ist.getMinutes();
  return (h > 9 || (h === 9 && m >= 15)) && (h < 15 || (h === 15 && m < 30));
}

// ── Skeleton ───────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen pt-40 px-4 md:px-8 max-w-7xl mx-auto animate-pulse space-y-8">
      <div className="h-12 w-64 bg-white/5 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-white/5 rounded-2xl" />
        <div className="h-64 bg-white/5 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-56 bg-white/5 rounded-2xl" />
        <div className="h-56 bg-white/5 rounded-2xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, setUser } = useStore();
  const accessToken = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary]           = useState<any>(null);
  const [growth, setGrowth]             = useState<{ date: string; portfolio: number }[]>([]);
  const [movers, setMovers]             = useState<{ gainers: any[]; losers: any[] }>({ gainers: [], losers: [] });
  const [holdings, setHoldings]         = useState<any[]>([]);
  const [signals, setSignals]           = useState<any[]>([]);
  const [nifty, setNifty]               = useState<any>(null);

  useEffect(() => {
    if (!accessToken) return;

    Promise.allSettled([
      api.profile.get(accessToken).then((d: any) => setUser(d.profile ?? d)).catch(() => {}),

      api.dashboard.summary(accessToken)
        .then((d: any) => setSummary(d.data ?? d))
        .catch(() => {}),

      api.dashboard.portfolioGrowth(accessToken)
        .then((d: any) => setGrowth(d.data?.data ?? d.data ?? []))
        .catch(() => {}),

      api.dashboard.topMovers(accessToken)
        .then((d: any) => setMovers({ gainers: d.data?.gainers ?? [], losers: d.data?.losers ?? [] }))
        .catch(() => {}),

      api.dashboard.holdingsTable(accessToken)
        .then((d: any) => setHoldings(d.data?.data ?? d.data ?? []))
        .catch(() => {}),

      api.signals.list(accessToken)
        .then((d: any) => setSignals(Array.isArray(d) ? d : d?.signals ?? d?.data ?? []))
        .catch(() => {}),

      api.market.nifty()
        .then((d: any) => setNifty(d.data ?? d))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) return <Skeleton />;

  const marketOpen     = isMarketOpen();
  const totalValue     = Number(summary?.currentValue ?? 0);
  const totalPnl       = Number(summary?.totalPnL ?? 0);
  const totalPnlPct    = Number(summary?.totalPnLPercent ?? 0);
  const totalInvested  = Number(summary?.totalInvested ?? 0);
  const unrealised     = totalPnl; // backend computes vs live value
  const buyCalls       = signals.filter((s: any) => s.signal === "BUY").length;
  const riskAppetite   = summary?.riskAppetite ?? user?.riskAppetite ?? "NOT_SET";

  const niftyClose     = nifty?.close ?? 0;
  const niftyChange    = nifty?.changePct ?? 0;

  // AI summary — pull from first available signal with a description, else null
  const aiSummary = signals.find((s: any) => s.summary || s.description)?.summary
    ?? signals.find((s: any) => s.summary || s.description)?.description
    ?? null;

  const summaryCards = [
    {
      label: "Portfolio Value",
      value: totalValue > 0 ? `₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—",
      sub: totalPnl !== 0 ? `${totalPnl >= 0 ? "+" : ""}₹${totalPnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })} P&L` : "No open positions",
      subColor: totalPnl >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "Unrealised P&L",
      value: totalInvested > 0 ? `${unrealised >= 0 ? "+" : ""}₹${unrealised.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—",
      sub: totalPnlPct !== 0 ? `${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}% on invested` : "No unrealised P&L",
      subColor: unrealised >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "NIFTY 50",
      value: niftyClose > 0 ? niftyClose.toLocaleString("en-IN") : "Live",
      sub: niftyClose > 0 ? `${niftyChange >= 0 ? "+" : ""}${niftyChange.toFixed(2)}% today` : "Fetching data...",
      subColor: niftyChange >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "Pending Signals",
      value: String(buyCalls || signals.length || 0),
      sub: buyCalls > 0 ? `${buyCalls} buy opportunit${buyCalls > 1 ? "ies" : "y"}` : signals.length > 0 ? `${signals.length} active signals` : "No active signals",
      subColor: "text-gold",
    },
  ];

  // Merge NIFTY history into growth chart if available
  const chartData = growth.map((g: any) => {
    const niftyPt = nifty?.history?.find((n: any) => n.date === g.date);
    return {
      date: g.date,
      portfolio: Number(g.value || g.portfolio || 0),
      nifty50: niftyPt?.close
    };
  });

  return (
    <div className="min-h-screen pt-40 pb-20 px-4 md:px-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-1">Overview</p>
          <h1 className="text-4xl md:text-5xl text-white font-bold">
            Welcome back,{" "}
            <span className="text-gold">{user?.name?.split(" ")[0] || "Investor"}</span>
          </h1>
          {summary?.totalStocks != null && (
            <p className="text-white/30 text-sm mt-1">{summary.totalStocks} holding{summary.totalStocks !== 1 ? "s" : ""} · wallet ₹{Number(summary.walletBalance ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
          )}
        </div>
        <div className={`flex items-center gap-2 mt-2 px-4 py-2 rounded-full border ${marketOpen ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
          <span className={`w-2 h-2 rounded-full ${marketOpen ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
          <span className={`text-xs font-medium ${marketOpen ? "text-emerald-400" : "text-white/40"}`}>
            Market {marketOpen ? "Open" : "Closed"}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {summaryCards.map(({ label, value, sub, subColor }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card"
          >
            <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">{label}</p>
            <p className="text-2xl text-white font-bold tabular-nums">{value}</p>
            <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart + Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          className="glass-card lg:col-span-2"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          <div className="flex justify-between items-center mb-4">
            <p className="text-white/40 text-[10px] uppercase tracking-wider">
              Portfolio vs NIFTY 50 {growth.length > 0 ? `(${growth.length}d)` : ""}
            </p>
            <div className="flex gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-gold inline-block rounded" /> Portfolio</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-400/60 inline-block rounded" /> NIFTY 50</span>
            </div>
          </div>
          <PortfolioVsBenchmarkChart
            data={chartData}
            initialPortfolioValue={totalInvested || 100000}
          />
          {growth.length === 0 && (
            <p className="text-white/20 text-xs text-center mt-2">Chart populates as your portfolio builds trade history.</p>
          )}
        </motion.div>

        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <MarketMoversPanel
            signals={signals}
            gainers={movers.gainers}
            losers={movers.losers}
          />
        </motion.div>
      </div>

      {/* Holdings + Strategy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <RecentHoldings holdings={holdings} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StrategyInsightCard
            riskAppetite={riskAppetite}
            activeSignals={signals.length}
            buyCalls={buyCalls}
            aiSummary={aiSummary}
          />
        </motion.div>
      </div>
    </div>
  );
}