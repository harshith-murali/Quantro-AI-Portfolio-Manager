"use client";
import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { 
  ChevronDown, 
  Star, 
  CheckCircle2, 
  X, 
  Clock,
  Activity,
  Wallet,
  ArrowRight
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import type { StockSignal } from "@/lib/types";

// NSE trading hours: 9:15 – 15:30 IST (UTC+5:30)
function isWithinTradingHours(): boolean {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const h = ist.getHours(), m = ist.getMinutes();
  const mins = h * 60 + m;
  return true; // Paper trading is available outside exchange hours in the demo.
}

const SIGNAL_STYLE: Record<string, string> = {
  BUY: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
  SELL: "text-red-400    border-red-400/30    bg-red-400/5",
  HOLD: "text-white/40   border-white/10      bg-white/5",
};

const SECTORS: Record<string, string[]> = {
  IT:      ["TCS", "INFY", "WIPRO", "HCLTECH"],
  Banking: ["HDFCBANK", "ICICIBANK", "AXISBANK", "SBIN"],
  Energy:  ["RELIANCE", "ONGC", "BPCL"],
  FMCG:    ["HINDUNILVR", "ITC", "NESTLEIND"],
  Pharma:  ["SUNPHARMA", "DRREDDY", "CIPLA"],
};

type Filter = "ALL" | "BUY" | "HOLD" | "SELL";
type Sort = "suitability" | "rsi" | "change" | "price";
type SectorFilter = "ALL" | keyof typeof SECTORS;

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: "suitability", label: "Suitability" },
  { value: "rsi",         label: "RSI" },
  { value: "change",      label: "% Change" },
  { value: "price",       label: "Price" },
];

export default function SignalsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-36 pb-24 text-center text-white/50">Loading signals...</div>}>
      <SignalsPageContent />
    </Suspense>
  );
}

function SignalsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { watchlist: watchlistArr } = useStore();
  const accessToken=useAuth();
  const [signals, setSignals] = useState<StockSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("suitability");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [sector, setSector] = useState<SectorFilter>("ALL");

  // Close sort dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  
  // Reactively track search param from URL
  const [search, setSearch] = useState("");
  
  useEffect(() => {
    if (searchParams) {
      setSearch(searchParams.get("search") || "");
    }
  }, [searchParams]);

  const [updatedAt] = useState(() => new Date().toLocaleTimeString("en-IN"));
  const toggleWatchlist = async (symbol: string) => {
    if(!accessToken)return;
    try { const existing=useStore.getState().watchlist.includes(symbol);if(existing)await api.watchlist.remove(symbol,accessToken);else await api.watchlist.add(symbol,accessToken);useStore.getState().toggleWatchlist(symbol); }
    catch(e:any){setError(e.message);}
  };
  useEffect(()=>{if(accessToken)api.watchlist.list(accessToken).then(d=>useStore.setState({watchlist:d.items.map((item:any)=>item.symbol)})).catch(()=>{});},[accessToken]);
  const watchlist = useMemo(() => new Set(watchlistArr), [watchlistArr]);

  // Trade modal state
  const [tradeModal, setTradeModal] = useState<{ symbol: string; price: number; type: "BUY" | "SELL" } | null>(null);
  const [tradeQty, setTradeQty] = useState("");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeResult, setTradeResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    if (!accessToken) return;
    let active=true; setLoading(true); setError("");
    api.signals.list(accessToken).then(data => {if(active){setSignals(data);if(!data.length)setError("No verified signals are available. Try refreshing shortly.");}})
      .catch(e=>{if(active){setSignals([]);setError(e.message||"Signals could not be loaded.");}}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  }, [accessToken, refreshKey]);

  const displayed = useMemo(() => {
    let list = [...signals];
    if (filter !== "ALL") list = list.filter(s => s.signal === filter);
    if (sector !== "ALL") {
      const syms = SECTORS[sector] ?? [];
      list = list.filter(s => syms.includes(s.symbol));
    }
    if (search) list = list.filter(s => s.symbol.toLowerCase().includes(search.toLowerCase()));
    if (sort === "suitability") list.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    if (sort === "rsi")        list.sort((a, b) => a.rsi - b.rsi);
    if (sort === "change")     list.sort((a, b) => b.changePercent - a.changePercent);
    if (sort === "price")      list.sort((a, b) => b.currentPrice - a.currentPrice);
    return list;
  }, [signals, filter, sector, search, sort]);

  // toggleWatchlist comes from store — no local state needed

  const bullishCount = (s: StockSignal) => {
    let count = 0;
    if (s.rsi < 30) count++;
    if (s.macd > 0) count++;
    if (s.suitabilityScore > 75) count++;
    if (s.changePercent > 0) count++;
    return count;
  };

  if (loading) return <Skeleton />;

  return (
    <div className="min-h-screen pt-40 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-1">AI Signal Engine</p>
          <h1 className="text-5xl font-bold text-white">
            {signals.filter(s => s.signal === "BUY").length}{" "}
            <span className="text-gold">buy signals</span> today
          </h1>
        </div>
        <p className="text-white/20 text-xs tabular-nums">Updated {updatedAt}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search symbol…"
            className="auth-input sm:max-w-xs"
          />
          {/* Signal filter */}
          <div className="flex gap-2">
            {(["ALL", "BUY", "HOLD", "SELL"] as Filter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider border transition-all ${filter === f ? "border-gold/40 bg-gold/10 text-gold" : "border-white/10 text-white/40 hover:text-white hover:border-white/20"}`}>
                {f}
              </button>
            ))}
          </div>
          {/* Sort — custom styled dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen(o => !o)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                sortOpen ? "border-gold/40 bg-gold/10 text-gold" : "border-white/10 text-white/40 hover:text-white hover:border-white/20"
              }`}
            >
              Sort: {SORT_OPTIONS.find(o => o.value === sort)?.label}
              <ChevronDown size={14} className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <div className="absolute left-0 top-full mt-2 w-44 rounded-xl border border-white/10 bg-[#0c0c0c]/95 backdrop-blur-xl shadow-2xl z-50 py-1 overflow-hidden">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                      sort === opt.value
                        ? "bg-gold/10 text-gold"
                        : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    Sort: {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Sector filters */}
        <div className="flex gap-2 flex-wrap">
          {(["ALL", ...Object.keys(SECTORS)] as SectorFilter[]).map(s => (
            <button key={s} onClick={() => setSector(s)}
              className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider border transition-all ${sector === s ? "border-gold/40 bg-gold/10 text-gold" : "border-white/10 text-white/30 hover:text-white hover:border-white/20"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-5 text-sm"><p className="text-white/60">Observed market data · Rule-based technical scores, not calibrated probabilities.</p><button className="text-gold border border-gold/30 rounded-lg px-3 py-2" onClick={()=>setRefreshKey(k=>k+1)}>Refresh signals</button></div>{error && <p role="alert" className="text-red-400 mb-6 text-sm">{error}</p>}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayed.map((s, i) => {
          const bc = bullishCount(s);
          const inWatchlist = watchlist.has(s.symbol);
          return (
            <motion.div key={s.symbol} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card group relative">
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-bold text-lg group-hover:text-gold transition-colors">{s.symbol}</p>
                  <p className="text-white/40 text-sm tabular-nums">
                    ₹{s.currentPrice.toLocaleString("en-IN")}
                    <span className={`ml-2 ${s.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {s.changePercent >= 0 ? "+" : ""}{s.changePercent.toFixed(2)}%
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-white/30">{bc}/4 bullish</span>
                </div>
              </div>

              <p className="text-white/50 text-[10px] mb-3">{s.dataSource} · Observed {s.marketDate}</p>
              {/* Rationale */}
              {s.rationale && (
                <p className="text-white/40 text-xs mb-3 leading-relaxed border-l-2 border-gold/30 pl-3">{s.rationale}</p>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <p className="text-white/30 text-[10px] mb-0.5 uppercase">Suitability</p>
                  <p className="text-gold font-semibold tabular-nums">{s.suitabilityScore}/100</p>
                </div>
                <div>
                  <p className="text-white/30 text-[10px] mb-0.5 uppercase">RSI</p>
                  <p className={`tabular-nums font-medium ${s.rsi < 30 ? "text-emerald-400" : s.rsi > 70 ? "text-red-400" : "text-white/70"}`}>{s.rsi.toFixed(1)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/30 text-[10px] mb-0.5 uppercase">Allocation</p>
                  <p className="text-white tabular-nums text-xs">₹{s.suggestedAllocation.toLocaleString("en-IN")}</p>
                </div>
              </div>

              {/* Suitability bar */}
              <div className="h-0.5 bg-white/5 rounded-full overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.suitabilityScore}%` }}
                  transition={{ delay: i * 0.035 + 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-gradient-to-r from-gold/40 to-gold rounded-full" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setTradeModal({ symbol: s.symbol, price: s.currentPrice, type: "BUY" }); setTradeQty(""); setTradeResult(null); }}
                  className="flex-1 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all"
                >
                  Buy
                </button>
                <button
                  onClick={() => { setTradeModal({ symbol: s.symbol, price: s.currentPrice, type: "SELL" }); setTradeQty(""); setTradeResult(null); }}
                  className="flex-1 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
                >
                  Sell
                </button>
                <button
                  onClick={() => router.push(`/signals/${s.symbol}`)}
                  className="px-3 py-2 rounded-xl border border-gold/30 bg-gold/10 text-gold text-xs font-medium hover:bg-gold/20 transition-all"
                >
                  Details
                </button>
                <button
                  onClick={() => toggleWatchlist(s.symbol)}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${inWatchlist ? "border-gold/40 bg-gold/10 text-gold" : "border-white/10 text-white/30 hover:border-white/20 hover:text-white"}`}
                >
                  {inWatchlist ? <Star size={14} fill="currentColor" /> : <Star size={14} />}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {displayed.length === 0 && !loading && (
        <div className="py-24 text-center text-white/20">
          <p className="text-5xl mb-4">◌</p>
          <p>No signals match your filter.</p>
        </div>
      )}

      {/* ── Trade Modal ── */}
      <AnimatePresence>
        {tradeModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setTradeModal(null)}
          >
            <motion.div
              className="glass-card max-w-sm w-full"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className={`text-xl font-bold ${tradeModal.type === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                    {tradeModal.type} {tradeModal.symbol}
                  </h2>
                  <p className="text-white/40 text-xs mt-1">₹{tradeModal.price.toLocaleString("en-IN")} per share</p>
                </div>
                <button onClick={() => setTradeModal(null)} className="text-white/30 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="field-label">Quantity</label>
                  <input
                    type="number"
                    value={tradeQty}
                    onChange={e => setTradeQty(e.target.value)}
                    placeholder="Number of shares"
                    className="auth-input"
                    min={1}
                    autoFocus
                  />
                </div>

                {tradeQty && Number(tradeQty) > 0 && (() => {
                  const subtotal = Number(tradeQty) * tradeModal.price;
                  const percentFee = subtotal * 0.001;
                  const fee = 0; // Paper trades have no fee; backtests model costs separately.
                  const total = subtotal + fee;
                  return (
                    <div className="border-t border-white/5 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">Subtotal</span>
                        <span className="text-white tabular-nums">₹{subtotal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">Platform fee</span>
                        <span className="text-white/60 tabular-nums">
                          ₹{fee.toFixed(2)}
                          <span className="text-white/20 ml-1 text-[10px]">
                            (paper simulation)
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                        <span className="text-white/60 font-medium">Total</span>
                        <span className="text-gold font-bold tabular-nums">₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  );
                })()}

                {tradeResult && (
                  tradeResult.msg === "__FUNDS__" ? (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-red-400 text-sm font-medium mb-1">Insufficient funds in your wallet.</p>
                      <Link href="/wallet" className="inline-flex items-center gap-1.5 text-gold text-xs font-semibold hover:underline">
                        <Wallet size={12} /> Add funds to Wallet <ArrowRight size={12} className="ml-1 inline-block" />
                      </Link>
                    </div>
                  ) : (
                    <p className={`flex items-center gap-2 text-sm font-medium ${tradeResult.ok ? "text-emerald-400" : "text-red-400"}`}>
                      {tradeResult.ok ? <CheckCircle2 size={16} /> : null}{tradeResult.msg}
                    </p>
                  )
                )}

                {/* Trading hours banner */}
                {!isWithinTradingHours() && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <Clock size={14} className="text-yellow-400 shrink-0" />
                    <p className="text-yellow-400 text-xs">NSE is closed. Trading hours: <span className="font-semibold">9:15 AM – 3:30 PM IST</span></p>
                  </div>
                )}

                <button
                  disabled={tradeLoading || !tradeQty || Number(tradeQty) < 1 || !isWithinTradingHours()}
                  onClick={async () => {
                    if (!accessToken || !tradeModal) return;
                    setTradeLoading(true);
                    setTradeResult(null);
                    try {
                      await api.portfolio.trade(
                        { symbol: tradeModal.symbol, type: tradeModal.type, quantity: Number(tradeQty) },
                        accessToken
                      );
                      setTradeResult({ ok: true, msg: `${tradeModal.type} order placed! Redirecting…` });
                      setTimeout(() => { setTradeModal(null); router.push("/portfolio"); }, 1500);
                    } catch (e: any) {
                      const msg: string = e.message ?? "Trade failed";
                      const isInsufficientFunds = msg.toLowerCase().includes("insufficient") || msg.toLowerCase().includes("balance") || msg.toLowerCase().includes("funds");
                      if (isInsufficientFunds) {
                        setTradeResult({ ok: false, msg: "__FUNDS__" });
                      } else {
                        setTradeResult({ ok: false, msg });
                      }
                    } finally {
                      setTradeLoading(false);
                    }
                  }}
                  className={`w-full py-3 rounded-full font-semibold text-sm uppercase tracking-wider transition-all disabled:opacity-30 ${
                    tradeModal.type === "BUY"
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                      : "bg-red-500 hover:bg-red-400 text-white"
                  }`}
                >
                  {tradeLoading ? "Executing…" : `Confirm ${tradeModal.type}`}
                </button>

                <p className="text-[10px] text-white/20 text-center uppercase tracking-wider">
                  Virtual trade · No real funds
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="min-h-screen pt-40 px-4 md:px-8 max-w-7xl mx-auto animate-pulse">
      <div className="h-10 w-64 bg-white/5 rounded mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="glass-card">
            <div className="h-5 w-24 bg-white/5 rounded mb-3" />
            <div className="h-4 w-16 bg-white/5 rounded mb-6" />
            <div className="h-0.5 w-full bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
