"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { STOCK_DATABASE } from "@/lib/stockData";
import type { StockSignal } from "@/lib/types";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Activity,
  AlertTriangle,
  Star,
  Clock,
  Wallet,
  ArrowRight
} from "lucide-react";
import { CandlestickChart } from "@/components/CandlestickChart";

// NSE trading hours: 9:15 – 15:30 IST
function isWithinTradingHours(): boolean {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const h = ist.getHours(), m = ist.getMinutes();
  const mins = h * 60 + m;
  return mins >= 9 * 60 + 15 && mins < 15 * 60 + 30;
}

type Tab = "Overview" | "Candlestick" | "Signals" | "Rationale" | "History";

// Fallback: Generate OHLCV + Indicators data when real data isn't available
function generateAdvancedMockData(basePrice: number) {
  const points = 100;
  const data = [];
  let currentPrice = basePrice;
  const now = new Date();

  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const open = currentPrice;
    const volatility = basePrice * 0.02;
    const high = open + Math.random() * volatility;
    const low = open - Math.random() * volatility;
    const close = low + Math.random() * (high - low);
    currentPrice = close;
    
    const volume = Math.floor(Math.random() * 10000) + 5000;
    data.push({ time, open, high, low, close, volume });
  }
  return data;
}

const RISK_LEVELS: Record<string, { label: string; color: string; bg: string }> = {
  BUY:  { label: "Low Risk",  color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
  HOLD: { label: "Med Risk",  color: "text-yellow-400",  bg: "bg-yellow-400/10 border-yellow-400/30" },
  SELL: { label: "High Risk", color: "text-red-400",     bg: "bg-red-400/10 border-red-400/30" },
};

const KEY_RISKS: Record<string, string[]> = {
  BUY:  ["Global macro headwinds", "Sector rotation risk", "Earnings surprise risk"],
  HOLD: ["Range-bound market", "Low volume uncertainty", "Sector lagging benchmark"],
  SELL: ["Overbought technicals", "Momentum exhaustion", "Valuation premium risk"],
};

export default function SignalDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const router = useRouter();
  const { accessToken, watchlist: watchlistArr, toggleWatchlist } = useStore();
  const inWatchlist = watchlistArr.includes(symbol);

  const [signal, setSignal] = useState<StockSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [tab, setTab] = useState<Tab>("Overview");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [isTrading, setIsTrading] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [advancedChartData, setAdvancedChartData] = useState<any[]>([]);
  const [ohlcvLoading, setOhlcvLoading] = useState(false);

  // ── Indicator toggles ─────────────────────────────────────
  const [showSMA, setShowSMA] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showTrend, setShowTrend] = useState(false);

  useEffect(() => {
    if (!accessToken) { router.push("/auth/login"); return; }

    // Helper: build a synthetic signal for any stock in the search database
    const makeFallbackSignal = (sym: string): StockSignal => {
      const info = STOCK_DATABASE.find(s => s.symbol === sym.toUpperCase());
      const price = info?.price ?? (1000 + Math.random() * 3000);
      const changePct = info?.changePct ?? (Math.random() - 0.5) * 4;
      const rsi = 40 + Math.random() * 30;          // 40–70 (neutral)
      const macd = (Math.random() - 0.5) * 3;
      const score = Math.round(55 + Math.random() * 25);
      return {
        symbol: sym.toUpperCase(),
        signal: rsi < 35 ? "BUY" : rsi > 65 ? "SELL" : "HOLD",
        suitabilityScore: score,
        suggestedAllocation: Math.round(score * 400),
        rsi: parseFloat(rsi.toFixed(1)),
        macd: parseFloat(macd.toFixed(3)),
        currentPrice: parseFloat(price.toFixed(2)),
        changePercent: parseFloat(changePct.toFixed(2)),
        rationale: info
          ? `${info.name} (${sym}) — live technicals not yet available. Showing estimated signal based on recent price action.`
          : `${sym} — estimated signal based on recent price action.`,
      };
    };

    api.signals.get(symbol, accessToken)
      .then(async (s) => {
        // If backend / mock list has no entry for this symbol, synthesise one
        const resolved: StockSignal = s ?? makeFallbackSignal(symbol);
        setSignal(resolved);
        setTradeType(resolved.signal === "SELL" ? "SELL" : "BUY");

        // Fetch real OHLCV data from AWS S3 via backend
        setOhlcvLoading(true);
        try {
          const realData = await api.signals.ohlcv(symbol, accessToken, 1500);
          const basePrice = resolved.currentPrice;
          if (realData && realData.length > 0) {
            setAdvancedChartData(realData);
            setPriceHistory(
              realData.slice(-30).map((d: any, i: number) => ({
                day: `D${i + 1}`,
                price: parseFloat(Number(d.close).toFixed(2)),
              }))
            );
          } else {
            const mockData = generateAdvancedMockData(basePrice);
            setAdvancedChartData(mockData);
            setPriceHistory(mockData.slice(-30).map((d, i) => ({ day: `D${i + 1}`, price: parseFloat(d.close.toFixed(2)) })));
          }
        } catch {
          const mockData = generateAdvancedMockData(resolved.currentPrice);
          setAdvancedChartData(mockData);
          setPriceHistory(mockData.slice(-30).map((d, i) => ({ day: `D${i + 1}`, price: parseFloat(d.close.toFixed(2)) })));
        } finally {
          setOhlcvLoading(false);
        }
      })
      .catch(() => {
        // Even if api call fails entirely, show a synthesised signal
        const fallback = makeFallbackSignal(symbol);
        setSignal(fallback);
        setTradeType(fallback.signal === "SELL" ? "SELL" : "BUY");
        const mockData = generateAdvancedMockData(fallback.currentPrice);
        setAdvancedChartData(mockData);
        setPriceHistory(mockData.slice(-30).map((d, i) => ({ day: `D${i + 1}`, price: parseFloat(d.close.toFixed(2)) })));
      })
      .finally(() => setLoading(false));
  }, [symbol, accessToken]);

  const handleTrade = async () => {
    if (!accessToken || !signal) return;
    if (!isWithinTradingHours()) {
      setError("Trading is only available between 9:15 AM – 3:30 PM IST.");
      return;
    }
    if (!quantity || quantity < 1) {
      setError("Please enter a valid quantity");
      return;
    }
    setIsTrading(true);
    setError("");
    setInsufficientFunds(false);
    try {
      await api.portfolio.trade({ symbol, type: tradeType, quantity: Number(quantity) }, accessToken);
      setTradeSuccess(true);
      setTimeout(() => { setTradeSuccess(false); router.push("/portfolio"); }, 2000);
    } catch (e: any) {
      const msg: string = e.message ?? "Trade failed";
      const isFunds = msg.toLowerCase().includes("insufficient") || msg.toLowerCase().includes("balance") || msg.toLowerCase().includes("funds");
      if (isFunds) { setInsufficientFunds(true); setError(""); }
      else setError(msg);
    } finally {
      setIsTrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-40 px-4 max-w-6xl mx-auto animate-pulse">
        <div className="h-8 w-32 bg-white/5 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 bg-white/5 rounded-2xl" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
            </div>
          </div>
          <div className="h-96 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="min-h-screen pt-40 flex items-center justify-center">
        <div className="glass-card text-center max-w-sm">
          <p className="text-4xl mb-4 text-white/10">◌</p>
          <p className="text-red-400 mb-2 text-sm">{error || "Signal not found"}</p>
          <button onClick={() => router.back()} className="gold-btn mt-4 flex items-center justify-center gap-2 mx-auto">
            <ArrowLeft size={16} /> Back to signals
          </button>
        </div>
      </div>
    );
  }

  const risk = RISK_LEVELS[signal.signal] ?? RISK_LEVELS.HOLD;
  const risks = KEY_RISKS[signal.signal] ?? KEY_RISKS.HOLD;
  const bullishIndicators = [signal.rsi < 30, signal.macd > 0, signal.suitabilityScore > 75, signal.changePercent > 0].filter(Boolean).length;
  const totalValue = (typeof quantity === "number" ? quantity : 0) * signal.currentPrice;

  return (
    <div className="min-h-screen pt-40 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
      {/* Back */}
      <button onClick={() => router.back()} className="text-white/30 text-sm mb-6 hover:text-white transition-colors flex items-center gap-2">
        <ArrowLeft size={14} /> Back to signals
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-6xl font-bold text-white">{signal.symbol}</h1>
            <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${risk.bg} ${risk.color}`}>
              {signal.signal}
            </span>
            <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${risk.bg} ${risk.color}`}>
              {risk.label}
            </span>
            {/* Watchlist toggle */}
            <button
              onClick={() => toggleWatchlist(symbol)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                inWatchlist
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-white/10 text-white/30 hover:border-gold/30 hover:text-gold"
              }`}
            >
              <Star size={12} fill={inWatchlist ? "currentColor" : "none"} />
              {inWatchlist ? "Added to Watchlist" : "Add to Watchlist"}
            </button>
          </div>
          <p className="text-gold text-3xl font-bold tabular-nums">₹{signal.currentPrice.toLocaleString("en-IN")}</p>
          <p className={`text-sm mt-1 ${signal.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {signal.changePercent >= 0 ? "+" : ""}{signal.changePercent.toFixed(2)}% today
          </p>
        </div>
        {/* Confidence badge */}
        <div className="glass-card text-center min-w-[120px]">
          <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">Confidence</p>
          <p className="text-3xl font-bold text-gold">{signal.suitabilityScore}</p>
          <p className="text-white/30 text-[10px]">/100</p>
          <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gold/40 to-gold rounded-full transition-all" style={{ width: `${signal.suitabilityScore}%` }} />
          </div>
          <p className="text-white/20 text-[10px] mt-2">{bullishIndicators}/4 bullish</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/5">
        {(["Overview", "Candlestick", "Signals", "Rationale", "History"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${tab === t ? "border-gold text-gold" : "border-transparent text-white/30 hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-5">
          <AnimatePresence mode="wait">
            {tab === "Overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* Price chart */}
                <div className="glass-card mb-5">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-4">30-Day Price</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={priceHistory}>
                      <defs>
                        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#cfab67" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#cfab67" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="price" stroke="#cfab67" fill="url(#priceGrad)" strokeWidth={2} dot={false} />
                      <XAxis dataKey="day" hide />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                        formatter={(v: any) => [`₹${Number(v).toFixed(2)}`, "Price"]} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Technical indicator summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "RSI (14)", value: signal.rsi.toFixed(1), sub: signal.rsi < 30 ? "Oversold" : signal.rsi > 70 ? "Overbought" : "Neutral", color: signal.rsi < 30 ? "text-emerald-400" : signal.rsi > 70 ? "text-red-400" : "text-white" },
                    { label: "MACD", value: signal.macd.toFixed(3), sub: signal.macd > 0 ? "Bullish" : "Bearish", color: signal.macd > 0 ? "text-emerald-400" : "text-red-400" },
                    { label: "Suitability", value: `${signal.suitabilityScore}/100`, sub: signal.suitabilityScore > 80 ? "Strong fit" : "Moderate", color: "text-gold" },
                    { label: "Allocation", value: `₹${(signal.suggestedAllocation / 1000).toFixed(0)}k`, sub: "Suggested", color: "text-white" },
                  ].map(({ label, value, sub, color }) => (
                    <div key={label} className="glass-card text-center">
                      <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">{label}</p>
                      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
                      <p className="text-white/30 text-[10px] mt-1">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Key risks */}
                <div className="glass-card mt-5">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-4">Key Risks</p>
                  <div className="space-y-2">
                    {risks.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <AlertTriangle size={14} className="text-red-400/60" />
                        <span className="text-white/60">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "Candlestick" && (
              <motion.div key="candlestick" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* ── Indicator Toggle Controls ──────────────────── */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-white/30 text-[10px] uppercase tracking-wider mr-2">Indicators</span>
                  {([
                    { key: "sma",   label: "SMA 20",  color: "#fbbf24", active: showSMA, toggle: () => setShowSMA(!showSMA) },
                    { key: "bb",    label: "BB 20,2", color: "#38bdf8", active: showBB,  toggle: () => setShowBB(!showBB) },
                    { key: "trend", label: "Trend",   color: "#a78bfa", active: showTrend, toggle: () => setShowTrend(!showTrend) },
                  ] as const).map(ind => (
                    <button
                      key={ind.key}
                      onClick={ind.toggle}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider
                        border transition-all duration-200 cursor-pointer select-none
                        ${ind.active
                          ? "border-white/20 bg-white/5"
                          : "border-white/5 bg-transparent text-white/25 hover:border-white/15 hover:text-white/40"
                        }
                      `}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0 transition-opacity"
                        style={{
                          backgroundColor: ind.color,
                          opacity: ind.active ? 1 : 0.25,
                        }}
                      />
                      <span style={{ color: ind.active ? ind.color : undefined }}>
                        {ind.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Chart */}
                <div className="glass-card mb-5 h-[500px] relative">
                  {ohlcvLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 rounded-2xl">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
                        <p className="text-white/40 text-xs">Loading market data…</p>
                      </div>
                    </div>
                  )}
                  <CandlestickChart
                    data={advancedChartData}
                    height={450}
                    indicators={{
                      sma: showSMA,
                      bollingerBands: showBB,
                      trend: showTrend,
                    }}
                  />
                </div>
              </motion.div>
            )}

            {tab === "Rationale" && (
              <motion.div key="rationale" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="glass-card">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold text-xs font-bold">AI</div>
                    <div>
                      <p className="text-white font-semibold text-sm">AI Rationale Panel</p>
                      <p className="text-white/30 text-xs">Powered by signal analysis engine</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gold/5 border border-gold/20 rounded-xl mb-5">
                    <p className="text-white/80 leading-relaxed italic text-sm">
                      &ldquo;{signal.rationale || `Analysis for ${signal.symbol} indicates ${signal.signal === "BUY" ? "strong accumulation" : signal.signal === "SELL" ? "distribution phase" : "consolidation"}. RSI at ${signal.rsi.toFixed(1)} ${signal.rsi < 30 ? "is deeply oversold — mean reversion likely" : signal.rsi > 70 ? "is overbought — pullback risk elevated" : "is neutral — await breakout catalyst"}. MACD ${signal.macd > 0 ? "showing bullish momentum with positive histogram" : "showing bearish momentum"}.`}&rdquo;
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Hold Period", value: "2–4 weeks" },
                      { label: "Target", value: `₹${(signal.currentPrice * 1.08).toFixed(0)}` },
                      { label: "Stop Loss", value: `₹${(signal.currentPrice * 0.95).toFixed(0)}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-white font-semibold text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "Signals" && (
              <motion.div key="signals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="glass-card space-y-4">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Technical Indicators</p>
                  {[
                    { name: "RSI (14)", value: signal.rsi, max: 100, threshold: [30, 70], verdict: signal.rsi < 30 ? "BUY" : signal.rsi > 70 ? "SELL" : "HOLD" },
                    { name: "Suitability Score", value: signal.suitabilityScore, max: 100, threshold: [40, 75], verdict: signal.suitabilityScore > 75 ? "BUY" : signal.suitabilityScore > 40 ? "HOLD" : "SELL" },
                    { name: "Price Momentum", value: Math.max(0, Math.min(100, 50 + signal.changePercent * 10)), max: 100, threshold: [40, 60], verdict: signal.changePercent > 0 ? "BUY" : "SELL" },
                  ].map(({ name, value, max, verdict }) => (
                    <div key={name}>
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="text-white/60 text-sm">{name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${verdict === "BUY" ? "text-emerald-400 bg-emerald-400/10" : verdict === "SELL" ? "text-red-400 bg-red-400/10" : "text-white/40 bg-white/5"}`}>{verdict}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full rounded-full ${verdict === "BUY" ? "bg-emerald-400" : verdict === "SELL" ? "bg-red-400" : "bg-white/30"}`} />
                      </div>
                      <p className="text-white/30 text-[10px] mt-1 text-right tabular-nums">{value.toFixed(1)} / {max}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === "History" && (
              <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="glass-card">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-4">Signal History</p>
                  <div className="space-y-3">
                    {[
                      { date: "15 May", signal: "BUY", price: (signal.currentPrice * 0.97).toFixed(0), rsi: "28.5" },
                      { date: "10 May", signal: "HOLD", price: (signal.currentPrice * 1.02).toFixed(0), rsi: "52.1" },
                      { date: "5 May",  signal: "SELL", price: (signal.currentPrice * 1.07).toFixed(0), rsi: "74.3" },
                      { date: "28 Apr", signal: "BUY",  price: (signal.currentPrice * 0.94).toFixed(0), rsi: "26.8" },
                    ].map(({ date, signal: sig, price, rsi }, i) => (
                      <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sig === "BUY" ? "text-emerald-400 bg-emerald-400/10" : sig === "SELL" ? "text-red-400 bg-red-400/10" : "text-white/40 bg-white/5"}`}>{sig}</span>
                          <p className="text-white/60 text-sm">{date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm tabular-nums">₹{Number(price).toLocaleString("en-IN")}</p>
                          <p className="text-white/30 text-xs">RSI {rsi}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky trade panel */}
        <div className="glass-card h-fit sticky top-28">
          <h2 className="text-white font-bold text-xl mb-6">Trade Simulation</h2>

          <div className="flex gap-2 mb-5">
            {(["BUY", "SELL"] as const).map(t => (
              <button key={t} onClick={() => setTradeType(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tradeType === t
                  ? t === "BUY" ? "bg-emerald-500/20 border border-emerald-500 text-emerald-400" : "bg-red-500/20 border border-red-500 text-red-400"
                  : "border border-white/10 text-white/30 hover:border-white/20"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-4 mb-5">
            <div>
              <label className="field-label">Quantity</label>
              <input 
                type="number" 
                value={quantity} 
                min={1}
                placeholder="Qty"
                onChange={e => {
                  const val = e.target.value;
                  if (val === "") {
                    setQuantity("");
                  } else {
                    const parsed = parseInt(val);
                    setQuantity(isNaN(parsed) ? "" : Math.max(0, parsed));
                  }
                }}
                className="auth-input" 
              />
            </div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-4">
              <span className="text-white/40">Price per share</span>
              <span className="text-white tabular-nums">₹{signal.currentPrice.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Subtotal</span>
              <span className="text-white tabular-nums">₹{totalValue.toLocaleString("en-IN")}</span>
            </div>
            {totalValue > 0 && (() => {
              const percentFee = totalValue * 0.001;
              const fee = Math.max(percentFee, 20);
              return (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Platform fee</span>
                    <span className="text-white/60 tabular-nums">
                      ₹{fee.toFixed(2)}
                      <span className="text-white/20 ml-1 text-[10px]">
                        ({percentFee >= 20 ? "0.1%" : "min ₹20"})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                    <span className="text-white/60 font-medium">Total</span>
                    <span className="text-gold font-bold tabular-nums">₹{(totalValue + fee).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Trading hours notice */}
          {!isWithinTradingHours() && (
            <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Clock size={13} className="text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-yellow-400 text-xs">NSE is closed. Trading hours: <span className="font-semibold">9:15 AM – 3:30 PM IST</span></p>
            </div>
          )}
          {insufficientFunds && (
            <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm font-medium mb-1">Insufficient wallet balance.</p>
              <Link href="/wallet" className="inline-flex items-center gap-1.5 text-gold text-xs font-semibold hover:underline">
                <Wallet size={12} /> Add funds to Wallet <ArrowRight size={12} className="ml-1 inline-block" />
              </Link>
            </div>
          )}
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          {tradeSuccess && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
              <p className="text-emerald-400 text-sm font-medium flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> Order placed! Redirecting…
              </p>
            </div>
          )}

          <button onClick={handleTrade} disabled={isTrading || tradeSuccess || !isWithinTradingHours()}
            className={`w-full py-3.5 rounded-full font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-40 ${
              tradeType === "BUY" ? "bg-emerald-500 hover:bg-emerald-400 text-black" : "bg-red-500 hover:bg-red-400 text-white"
            }`}>
            {isTrading ? "Executing…" : tradeSuccess ? (
              <span className="flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Done</span>
            ) : !isWithinTradingHours() ? "Market Closed" : `Place ${tradeType} Order`}
          </button>

          <p className="text-[10px] text-white/20 text-center mt-4 uppercase tracking-wider">
            Virtual trade · No real funds
          </p>
        </div>
      </div>
    </div>
  );
}
