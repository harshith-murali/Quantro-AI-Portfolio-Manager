"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/useAuth";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine,
} from "recharts";

const MARKET_OPEN_HOUR = 9, MARKET_CLOSE_HOUR = 15, MARKET_CLOSE_MIN = 30;

function isMarketOpen() {
  const now = new Date();
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  const h = now.getHours(), m = now.getMinutes();
  return (h > MARKET_OPEN_HOUR || (h === MARKET_OPEN_HOUR && m >= 15)) &&
    (h < MARKET_CLOSE_HOUR || (h === MARKET_CLOSE_HOUR && m < MARKET_CLOSE_MIN));
}

// Mock performance chart data (14 days)
const PERF_DATA = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  portfolio: 100000 + Math.sin(i * 0.8) * 3000 + i * 200,
  nifty: 100000 + Math.sin(i * 0.6) * 2000 + i * 150,
}));

const NIFTY_VALUE = 23689;
const NIFTY_CHANGE = +1.18;

export default function DashboardPage() {
  const { user, portfolio, setPortfolio, setUser } = useStore();
  const accessToken = useAuth();
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState<any[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) return;
    Promise.allSettled([
      api.profile.get(accessToken).then((d) => setUser(d.profile ?? d)).catch(() => {}),
      api.portfolio.summary(accessToken).then((d) => setPortfolio(d.summary ?? d)).catch(() => {}),
      api.portfolio.holdings(accessToken).then((d: any) => setHoldings(d.holdings ?? d ?? [])).catch(() => {}),
      api.signals.list(accessToken).then((data) => setSignals(data ?? [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="min-h-screen pt-40 px-4 max-w-7xl mx-auto animate-pulse">
        <div className="h-12 w-56 bg-white/5 rounded mb-3" />
        <div className="h-5 w-32 bg-white/5 rounded mb-10" />
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-white/5 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // Real backend field names from /portfolio/summary
  const totalValue    = Number(portfolio?.currentValue   ?? portfolio?.totalValue   ?? 0);
  const unrealised    = Number((portfolio as any)?.unrealizedPnl ?? (portfolio as any)?.unrealisedPnl ?? 0);
  const realised      = Number((portfolio as any)?.realizedPnl   ?? (portfolio as any)?.realisedPnl   ?? 0);
  const totalPnl      = Number((portfolio as any)?.totalPnl ?? (unrealised + realised));
  const marketOpen    = isMarketOpen();
  const pendingBuySignals = signals.filter(s => s.signal === "BUY").length;
  const bestPerformer  = signals[0] ?? null;
  const worstPerformer = signals.find(s => s.signal === "SELL") ?? null;

  return (
    <div className="min-h-screen pt-40 pb-20 px-4 md:px-8 max-w-7xl mx-auto">

      {/* Header row */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-1">Overview</p>
          <h1 className="text-5xl text-white font-bold">
            Welcome, <span className="text-gold">{user?.name || "Investor"}</span>
          </h1>
        </div>
        {/* Market Status Badge */}
        <div className={`flex items-center gap-2 mt-3 px-4 py-2 rounded-full border ${marketOpen ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
          <span className={`w-2 h-2 rounded-full ${marketOpen ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
          <span className={`text-xs font-medium ${marketOpen ? "text-emerald-400" : "text-white/40"}`}>
            Market {marketOpen ? "Open" : "Closed"}
          </span>
        </div>
      </div>

      {/* Today's Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Portfolio Value",
            value: `₹${totalValue.toLocaleString("en-IN")}`,
            sub: `${totalPnl >= 0 ? "+" : ""}₹${totalPnl.toLocaleString("en-IN")} total P&L`,
            subColor: totalPnl >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Today's Change",
            value: `${unrealised >= 0 ? "+" : ""}₹${unrealised.toLocaleString("en-IN")}`,
            sub: unrealised !== 0 ? `${((unrealised / (totalValue - unrealised || 1)) * 100).toFixed(2)}% unrealised` : "No open positions",
            subColor: unrealised >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Nifty 50", value: NIFTY_VALUE.toLocaleString("en-IN"), sub: `${NIFTY_CHANGE >= 0 ? "+" : ""}${NIFTY_CHANGE}%`, subColor: NIFTY_CHANGE >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Pending Signals", value: pendingBuySignals.toString(), sub: "buy opportunities", subColor: "text-gold" },
        ].map(({ label, value, sub, subColor }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="glass-card">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">{label}</p>
            <p className="text-2xl text-white font-bold tabular-nums">{value}</p>
            <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Main grid: Chart + Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Portfolio chart */}
        <motion.div className="glass-card lg:col-span-2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex justify-between items-center mb-4">
            <p className="text-white/40 text-[10px] uppercase tracking-wider">Portfolio vs Nifty 50 (14d)</p>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-gold inline-block rounded" /> Portfolio</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-400/60 inline-block rounded" /> Nifty 50</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={PERF_DATA}>
              <XAxis dataKey="day" hide />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, ""]}
              />
              <Line type="monotone" dataKey="portfolio" stroke="#cfab67" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="nifty" stroke="rgba(96,165,250,0.5)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Best / Worst + Quick Actions */}
        <motion.div className="glass-card flex flex-col gap-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-white/40 text-[10px] uppercase tracking-wider">Market Movers</p>
          <div className="space-y-3">
            {bestPerformer && (
              <div className="flex justify-between items-center p-3 bg-emerald-400/5 border border-emerald-400/15 rounded-xl">
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Best Signal</p>
                  <p className="text-white font-semibold">{bestPerformer.symbol}</p>
                </div>
                <span className="text-emerald-400 text-sm font-bold">+{bestPerformer.changePercent?.toFixed(1)}%</span>
              </div>
            )}
            {worstPerformer && (
              <div className="flex justify-between items-center p-3 bg-red-400/5 border border-red-400/15 rounded-xl">
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Watch Out</p>
                  <p className="text-white font-semibold">{worstPerformer.symbol}</p>
                </div>
                <span className="text-red-400 text-sm font-bold">{worstPerformer.changePercent?.toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="mt-auto border-t border-white/5 pt-4 flex flex-col gap-2">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Quick Actions</p>
            <Link href="/ai"      className="text-gold hover:underline text-sm font-semibold">🤖 AI Advisor →</Link>
            <Link href="/signals" className="text-gold hover:underline text-sm">View AI Signals →</Link>
            <Link href="/backtest" className="text-gold hover:underline text-sm">Run Backtest →</Link>
            <Link href="/portfolio" className="text-gold hover:underline text-sm">My Portfolio →</Link>
          </div>
        </motion.div>
      </div>

      {/* Holdings + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg text-white font-semibold">Recent Holdings</h2>
            <Link href="/portfolio" className="text-gold text-xs hover:underline">View All</Link>
          </div>
          {holdings.length > 0 ? (
            <div className="space-y-3">
              {holdings.slice(0, 4).map((h: any) => {
                const avgBuy = Number(h.averageBuyPrice ?? h.avgBuyPrice ?? 0);
                const qty    = Number(h.quantity ?? 0);
                const value  = avgBuy * qty;
                const pnl    = Number(h.pnl ?? 0);
                return (
                  <div key={h.symbol} className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div>
                      <p className="text-white font-medium">{h.symbol}</p>
                      <p className="text-white/40 text-xs">{qty} shares · avg ₹{avgBuy.toFixed(0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white tabular-nums text-sm">₹{value.toLocaleString("en-IN")}</p>
                      <p className={`text-xs ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {pnl >= 0 ? "+" : ""}₹{pnl.toFixed(0)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-white/20">
              <p className="text-4xl mb-3">◌</p>
              <p className="text-sm mb-3">No holdings found.</p>
              <Link href="/signals" className="text-gold text-sm hover:underline">Find opportunities</Link>
            </div>
          )}
        </motion.div>

        {/* AI Market Strategy */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-lg text-white font-semibold mb-6">Market Strategy</h2>
          <div className="space-y-4 text-sm text-white/60">
            <p>Your strategy is based on a <span className="text-gold">{user?.riskAppetite || "MODERATE"}</span> risk profile.</p>
            <div className="p-4 bg-gold/5 rounded-xl border border-gold/20">
              <p className="text-gold font-medium mb-2 text-[10px] uppercase tracking-widest">AI Suggestion</p>
              <p className="text-white/70 leading-relaxed">
                Consider diversifying into more defensive sectors given current market volatility. 
                RSI signals indicate mean reversion opportunities in IT and Pharma.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Risk Score", value: user?.riskAppetite === "AGGRESSIVE" ? "High" : user?.riskAppetite === "CONSERVATIVE" ? "Low" : "Med" },
                { label: "Active Signals", value: signals.length.toString() },
                { label: "Buy Calls", value: pendingBuySignals.toString() },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/5 rounded-lg p-3">
                  <p className="text-white font-semibold text-lg">{value}</p>
                  <p className="text-white/30 text-[10px] uppercase tracking-wider mt-1">{label}</p>
                </div>
              ))}
            </div>
            <Link href="/ai" className="gold-btn block text-center mt-2">Get AI Recommendations →</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}