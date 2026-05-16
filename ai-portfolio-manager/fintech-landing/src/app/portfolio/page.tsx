"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet as WalletIcon, 
  History, 
  TrendingUp, 
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { useStore } from "@/lib/store";
import * as XLSX from "xlsx";
import { api } from "@/lib/api";
import type { PortfolioSnapshot } from "@/lib/types";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from "recharts";

const SECTOR_COLORS: Record<string, string> = {
  IT: "#cfab67", Banking: "#60a5fa", Energy: "#34d399", FMCG: "#f472b6", Pharma: "#a78bfa", Other: "#ffffff30",
};

const SECTOR_MAP: Record<string, string> = {
  TCS: "IT", INFY: "IT", WIPRO: "IT", HCLTECH: "IT",
  HDFCBANK: "Banking", ICICIBANK: "Banking", AXISBANK: "Banking", SBIN: "Banking",
  RELIANCE: "Energy", ONGC: "Energy",
  HINDUNILVR: "FMCG", ITC: "FMCG",
  SUNPHARMA: "Pharma", DRREDDY: "Pharma",
};

export default function PortfolioPage() {
  const router = useRouter();
  const { accessToken, portfolio, setPortfolio } = useStore();
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [showBuySell, setShowBuySell] = useState<null | "BUY" | "SELL">(null);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [tradePrice, setTradePrice] = useState<number>(0); // holding's avg buy price
  const [tradeQty, setTradeQty] = useState("");
  const [tradeMsg, setTradeMsg] = useState("");
  const [tradeErr, setTradeErr] = useState("");

  useEffect(() => {
    if (!accessToken) { router.push("/auth/login"); return; }
    Promise.allSettled([
      api.portfolio.summary(accessToken).then((d) => setPortfolio(d.summary ?? d)).catch(() => {}),
      api.portfolio.holdings(accessToken).then((d: any) => setHoldings(d.holdings ?? d ?? [])).catch(() => {}),
      api.portfolio.tradeHistory(accessToken).then(setTrades).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [accessToken]);

  const handleTrade = async () => {
    if (!accessToken || !selectedSymbol || !tradeQty) return;
    try {
      await api.portfolio.trade({ symbol: selectedSymbol, action: showBuySell, quantity: Number(tradeQty), price: tradePrice > 0 ? tradePrice : 1 }, accessToken);
      setTradeMsg("Order placed successfully!");
      setTradeErr("");
      // Refresh holdings + summary so table reflects the new position
      setTimeout(async () => {
        setShowBuySell(null);
        setTradeMsg("");
        setTradeErr("");
        const [summaryRes, holdingsRes] = await Promise.allSettled([
          api.portfolio.summary(accessToken),
          api.portfolio.holdings(accessToken),
        ]);
        if (summaryRes.status === "fulfilled") setPortfolio((summaryRes.value as any).summary ?? summaryRes.value);
        if (holdingsRes.status === "fulfilled") setHoldings((holdingsRes.value as any).holdings ?? holdingsRes.value ?? []);
      }, 1500);
    } catch (e: any) {
      const raw: string = e.message ?? "";
      // Map backend errors → friendly messages
      let friendly = raw;
      if (/insufficient holdings|do not hold|tried to sell (\d+)|holds (\d+) shares/i.test(raw)) {
        const match = raw.match(/holds (\d+) shares.*sell (\d+)/i);
        if (match) {
          friendly = `You only hold ${match[1]} share${Number(match[1]) !== 1 ? "s" : ""} of ${selectedSymbol}. Enter a quantity of ${match[1]} or less.`;
        } else {
          friendly = `You don't have enough ${selectedSymbol} shares to sell that quantity.`;
        }
      } else if (/insufficient wallet|wallet balance/i.test(raw)) {
        friendly = "Insufficient wallet balance. Deposit more funds before buying.";
      } else if (/quantity.*positive|quantity.*number/i.test(raw)) {
        friendly = "Please enter a valid quantity (must be a positive whole number).";
      } else if (/symbol/i.test(raw)) {
        friendly = "Invalid stock symbol. Please check the ticker and try again.";
      } else if (/price/i.test(raw)) {
        friendly = "A valid price is required to place this order.";
      }
      setTradeErr(friendly);
      setTradeMsg("");
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (!portfolio) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4 text-white/10">◌</p>
        <p className="text-white/40 mb-4">Portfolio not found</p>
        <button onClick={() => router.push("/signals")} className="gold-btn">Browse signals <ArrowRight className="ml-2 w-4 h-4 inline-block" /></button>
      </div>
    </div>
  );

  // Use real field names from backend summary response
  const totalValue   = portfolio?.currentValue   ?? portfolio?.totalValue   ?? 0;
  const totalPnl     = portfolio?.totalPnl        ?? 0;
  const unrealised   = portfolio?.unrealizedPnl   ?? portfolio?.unrealisedPnl ?? 0;
  const realised     = portfolio?.realizedPnl      ?? portfolio?.realisedPnl   ?? 0;
  const virtualCash  = portfolio?.walletBalance    ?? portfolio?.virtualCash   ?? 0;
  const pnlPositive  = totalPnl >= 0;

  // Build allocation data for pie from fetched holdings
  const sectorAlloc = (holdings ?? []).reduce((acc: any, h: any) => {
    const sector = SECTOR_MAP[h.symbol] ?? "Other";
    const val = Number(h.averageBuyPrice ?? h.currentPrice ?? 0) * Number(h.quantity ?? 0);
    acc[sector] = (acc[sector] ?? 0) + val;
    return acc;
  }, {});
  const pieData = Object.entries(sectorAlloc).map(([name, value]) => ({ name, value: Number(value) }));

  return (
    <div className="min-h-screen pt-40 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-1">Virtual Portfolio</p>
          <h1 className="text-5xl font-bold text-white tabular-nums">
            ₹{totalValue.toLocaleString("en-IN")}
          </h1>
          <p className={`text-base mt-1 tabular-nums ${pnlPositive ? "text-emerald-400" : "text-red-400"}`}>
            {pnlPositive ? "+" : ""}₹{totalPnl.toLocaleString("en-IN")} total P&L
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Value",    value: `₹${totalValue.toLocaleString("en-IN")}`,    color: "text-white" },
          { label: "Unrealised P&L", value: `${unrealised >= 0 ? "+" : ""}₹${unrealised.toLocaleString("en-IN")}`, color: unrealised >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Realised P&L",   value: `${realised >= 0 ? "+" : ""}₹${realised.toLocaleString("en-IN")}`,     color: realised >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Cash Available", value: `₹${virtualCash.toLocaleString("en-IN")}`,   color: "text-gold" },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="glass-card">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{label}</p>
            <p className={`font-bold text-lg tabular-nums ${color}`}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Holdings table + Allocation pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Holdings table */}
        <div className="glass-card overflow-x-auto lg:col-span-2">
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-white/40 text-[10px] uppercase tracking-wider">Holdings ({holdings.length})</p>
            <button onClick={() => router.push("/signals")} className="text-gold text-xs hover:underline">+ Add position</button>
          </div>

          {holdings.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3 text-white/10">◌</p>
              <p className="text-white/30 text-sm mb-3">No open positions yet</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => router.push("/signals")} className="text-gold text-sm hover:underline">Browse AI signals <ArrowRight className="ml-2 w-4 h-4 inline-block" /></button>
              </div>
              {/* Suggestion cards */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="p-3 bg-gold/5 border border-gold/20 rounded-xl">
                  <p className="text-gold text-xs font-medium mb-1">Top buy for your profile</p>
                  <p className="text-white/60 text-xs">RELIANCE — RSI oversold, strong support</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-white/60 text-xs font-medium mb-1">Diversification tip</p>
                  <p className="text-white/40 text-xs">Add a Pharma stock for sector balance</p>
                </div>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Symbol", "Qty", "Avg Buy", "Current", "Invested", "Current Val", "Day Chg", "Total P&L", ""].map(h => (
                    <th key={h} className="text-left py-3 px-2 text-white/30 font-normal text-[10px] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {holdings.map((h: any, i: number) => {
                    const avgBuy = Number(h.averageBuyPrice ?? h.avgBuyPrice ?? 0);
                    const currentVal = avgBuy;
                    const invested = avgBuy * Number(h.quantity);
                    const pnl = currentVal * Number(h.quantity) - invested;
                    return (
                    <motion.tr key={h.symbol} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3 px-2 text-white font-semibold">{h.symbol}</td>
                      <td className="py-3 px-2 text-white/60 tabular-nums">{h.quantity}</td>
                      <td className="py-3 px-2 text-white/60 tabular-nums">₹{avgBuy.toFixed(0)}</td>
                      <td className="py-3 px-2 text-white tabular-nums">₹{avgBuy.toFixed(0)}</td>
                      <td className="py-3 px-2 text-white/60 tabular-nums">₹{invested.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-2 text-white tabular-nums">₹{(currentVal * Number(h.quantity)).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-2 tabular-nums text-white/40">—</td>
                      <td className={`py-3 px-2 tabular-nums font-medium ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {pnl >= 0 ? "+" : ""}₹{pnl.toFixed(0)}
                      </td>
                      {/* ── Per-row Buy / Sell ── */}
                      <td className="py-3 px-2">
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => { setShowBuySell("BUY"); setSelectedSymbol(h.symbol); setTradePrice(avgBuy); setTradeQty(""); setTradeMsg(""); setTradeErr(""); }}
                            className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider hover:bg-emerald-500/20 transition-all"
                          >
                            Buy
                          </button>
                          <button
                            onClick={() => { setShowBuySell("SELL"); setSelectedSymbol(h.symbol); setTradePrice(avgBuy); setTradeQty(""); setTradeMsg(""); setTradeErr(""); }}
                            className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-semibold uppercase tracking-wider hover:bg-red-500/20 transition-all"
                          >
                            Sell
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        {/* Sector allocation pie */}
        <div className="glass-card">
          <p className="text-white/40 text-[10px] uppercase tracking-wider mb-4">Sector Allocation</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={SECTOR_COLORS[entry.name] ?? "#ffffff20"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: SECTOR_COLORS[d.name] ?? "#fff3" }} />
                      <span className="text-white/60">{d.name}</span>
                    </div>
                    <span className="text-white/40 tabular-nums">₹{d.value.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-white/20 text-sm">No positions yet</div>
          )}
        </div>
      </div>

      {/* Trade history */}
      {trades.length > 0 && (
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/40 text-[10px] uppercase tracking-wider">Trade History</p>
            <button
              onClick={() => {
                // Generate XLSX
                const data = trades.map((t: any) => {
                  const price = Number(t.price ?? 0);
                  const qty = Number(t.quantity ?? 0);
                  const value = qty * price;
                  const fee = Math.max(value * 0.001, 20);
                  const tradeType = t.action ?? t.type;
                  const date = new Date(t.tradeDate ?? t.createdAt).toLocaleDateString("en-IN");
                  return {
                    Date: date,
                    Symbol: t.symbol,
                    Action: tradeType,
                    Quantity: qty,
                    "Price (₹)": Number(price.toFixed(2)),
                    "Value (₹)": Number(value.toFixed(2)),
                    "Platform Fee (₹)": Number(fee.toFixed(2)),
                    "Net Total (₹)": Number((value + fee).toFixed(2)),
                  };
                });
                const ws = XLSX.utils.json_to_sheet(data);
                // Set column widths
                ws["!cols"] = [
                  { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 8 },
                  { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
                ];
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Trade Ledger");
                XLSX.writeFile(wb, `trade_ledger_${new Date().toISOString().split("T")[0]}.xlsx`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold/30 bg-gold/10 text-gold text-[10px] font-medium uppercase tracking-wider hover:bg-gold/20 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                {["Date", "Symbol", "Action", "Qty", "Price", "Value", "Fee"].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-white/30 font-normal uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.slice(0, 8).map((t: any, i) => {
                const price = Number(t.price ?? 0);
                const qty   = Number(t.quantity ?? 0);
                const tradeType = t.action ?? t.type;
                return (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-2 px-2 text-white/40">{new Date(t.tradeDate ?? t.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="py-2 px-2 text-white">{t.symbol}</td>
                  <td className={`py-2 px-2 font-medium ${tradeType === "BUY" ? "text-emerald-400" : "text-red-400"}`}>{tradeType}</td>
                  <td className="py-2 px-2 text-white/60 tabular-nums">{qty}</td>
                  <td className="py-2 px-2 text-white/60 tabular-nums">₹{price.toFixed(0)}</td>
                  <td className="py-2 px-2 text-white/60 tabular-nums">₹{(qty * price).toLocaleString("en-IN")}</td>
                  <td className="py-2 px-2 text-white/30 tabular-nums">₹{Math.max(qty * price * 0.001, 20).toFixed(0)}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Buy/Sell Modal */}
      <AnimatePresence>
        {showBuySell && (
          <motion.div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card max-w-sm w-full" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-xl font-bold ${showBuySell === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                  {showBuySell} Order
                </h2>
                <button onClick={() => { setShowBuySell(null); setTradeMsg(""); setTradeErr(""); }} className="text-white/30 hover:text-white text-xl">×</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="field-label">Symbol</label>
                  <input value={selectedSymbol} onChange={e => setSelectedSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. RELIANCE" className="auth-input" />
                </div>
                <div>
                  <label className="field-label">Quantity</label>
                  <input type="number" value={tradeQty} onChange={e => setTradeQty(e.target.value)}
                    placeholder="Number of shares" className="auth-input" />
                </div>
                {tradeMsg && <p className="flex items-center gap-2 text-sm text-emerald-400 font-medium"><CheckCircle2 size={16} /> {tradeMsg}</p>}
                {tradeErr && <p className="text-sm text-red-400">{tradeErr}</p>}
                <button onClick={handleTrade}
                  className={`w-full py-3 rounded-full font-semibold text-sm uppercase tracking-wider transition-all ${showBuySell === "BUY" ? "bg-emerald-500 hover:bg-emerald-400 text-black" : "bg-red-500 hover:bg-red-400 text-white"}`}>
                  Confirm {showBuySell}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen pt-40 px-4 md:px-8 max-w-7xl mx-auto animate-pulse">
      <div className="h-12 w-56 bg-white/5 rounded mb-3" />
      <div className="h-5 w-32 bg-white/5 rounded mb-10" />
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-white/5 rounded-2xl" />
    </div>
  );
}