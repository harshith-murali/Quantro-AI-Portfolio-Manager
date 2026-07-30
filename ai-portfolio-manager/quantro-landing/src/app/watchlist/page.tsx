"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  X 
} from "lucide-react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { searchStocks, STOCK_DATABASE, type StockInfo } from "@/lib/stockData";

interface WatchlistStock {
  symbol: string;
  addedAt: string;
  currentPrice: number | null;
  changePercent: number | null;
  aiStatus: "OK" | "WARNING" | "ALERT";
  aiNote: string;
  sector: string;
}

const STATUS_STYLES = {
  OK: {
    label: "All Clear",
    dot: "bg-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    text: "text-emerald-400",
    icon: <CheckCircle2 size={12} />,
  },
  WARNING: {
    label: "Watch",
    dot: "bg-yellow-400 animate-pulse",
    border: "border-yellow-500/20",
    bg: "bg-yellow-500/5",
    text: "text-yellow-400",
    icon: <AlertTriangle size={12} />,
  },
  ALERT: {
    label: "Action Needed",
    dot: "bg-red-400 animate-pulse",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    text: "text-red-400",
    icon: <Activity size={12} />,
  },
};

export default function WatchlistPage() {
  const router = useRouter();
  const { accessToken } = useStore();
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addSymbol, setAddSymbol] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "OK" | "WARNING" | "ALERT">("ALL");

  useEffect(() => {
    if (!accessToken) { router.push("/auth/login"); return; }
    fetchWatchlist(accessToken);
  }, [accessToken]);

  const mapItem = (item: any): WatchlistStock => {
    const info = STOCK_DATABASE.find((s) => s.symbol === item.symbol);
    const signal = item.signal;
    const status: WatchlistStock["aiStatus"] =
      signal?.signal === "SELL" ? "ALERT" : signal?.signal === "HOLD" ? "WARNING" : "OK";
    return {
      symbol: item.symbol,
      addedAt: item.createdAt?.split("T")[0] ?? "",
      currentPrice: signal?.currentPrice ?? null,
      changePercent: signal?.changePercent ?? null,
      aiStatus: status,
      aiNote: signal?.rationale ?? "Market data is not available for this symbol yet.",
      sector: info?.sector ?? "Other",
    };
  };

  const fetchWatchlist = async (token: string) => {
    setError("");
    setLoading(true);
    try {
      const result = await api.watchlist.list(token);
      setWatchlist((result.items ?? []).map(mapItem));
    } catch (e: any) {
      setError(e?.message ?? "Unable to load watchlist.");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    if (!accessToken) return;
    await api.watchlist.remove(symbol, accessToken);
    setWatchlist((prev) => prev.filter((s) => s.symbol !== symbol));
  };

  const addToWatchlist = async (sym?: string) => {
    if (!accessToken) return;
    const symbol = (typeof sym === "string" ? sym : addSymbol).trim().toUpperCase();
    if (!symbol) return;
    if (watchlist.find((w) => w.symbol === symbol)) {
      setAddSymbol("");
      setShowAdd(false);
      return;
    }
    try {
      const result = await api.watchlist.add(symbol, accessToken);
      setWatchlist((prev) => [mapItem(result.item), ...prev]);
      setAddSymbol("");
      setShowAdd(false);
      setError("");
    } catch (e: any) {
      setError(e?.message ?? "Unable to add symbol.");
    }
  };

  // Stock suggestions for add modal
  const addSuggestions = useMemo(() => {
    if (!addSymbol.trim()) return [];
    return searchStocks(addSymbol).filter(s => !watchlist.find(w => w.symbol === s.symbol));
  }, [addSymbol, watchlist]);

  const filtered = filter === "ALL" ? watchlist : watchlist.filter((w) => w.aiStatus === filter);

  const alertCount = watchlist.filter((w) => w.aiStatus === "ALERT").length;
  const warningCount = watchlist.filter((w) => w.aiStatus === "WARNING").length;

  if (loading) {
    return (
      <div className="min-h-screen pt-40 px-4 md:px-8 max-w-7xl mx-auto animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-40 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-1">AI Watchlist</p>
          <h1 className="text-5xl font-bold text-white">
            <span className="text-gold">{watchlist.length}</span> stocks monitored
          </h1>
          <p className="text-white/30 text-sm mt-2">
            {alertCount > 0 && (
              <span className="text-red-400 mr-3">{alertCount} alert{alertCount > 1 ? "s" : ""}</span>
            )}
            {warningCount > 0 && (
              <span className="text-yellow-400">{warningCount} warning{warningCount > 1 ? "s" : ""}</span>
            )}
            {alertCount === 0 && warningCount === 0 && (
              <span className="text-emerald-400">All stocks looking healthy</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold hover:bg-gold/20 transition-all"
        >
          <Plus size={14} /> Add Stock
        </button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(["OK", "WARNING", "ALERT"] as const).map((status) => {
          const style = STATUS_STYLES[status];
          const count = watchlist.filter((w) => w.aiStatus === status).length;
          return (
            <motion.button
              key={status}
              onClick={() => setFilter(filter === status ? "ALL" : status)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-card text-left transition-all ${
                filter === status ? `${style.border} ${style.bg}` : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span className={`text-[10px] uppercase tracking-wider ${style.text}`}>{style.label}</span>
              </div>
              <p className={`text-2xl font-bold ${style.text}`}>{count}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Watchlist cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {filtered.map((stock, i) => {
            const style = STATUS_STYLES[stock.aiStatus];
            return (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`glass-card group relative border ${style.border}`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-bold text-lg">{stock.symbol}</p>
                      <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${style.bg} ${style.text} font-medium border ${style.border}`}>
                        {style.icon} {style.label}
                      </span>
                    </div>
                    <p className="text-white/30 text-xs">{stock.sector} · Added {stock.addedAt}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold tabular-nums">
                      {stock.currentPrice === null ? "No data" : `₹${stock.currentPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                    </p>
                    <p className={`flex items-center justify-end gap-1 text-xs tabular-nums ${(stock.changePercent ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {(stock.changePercent ?? 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {stock.changePercent === null ? "—" : `${Math.abs(stock.changePercent).toFixed(2)}%`}
                    </p>
                  </div>
                </div>

                {/* AI Note */}
                <div className={`p-3 rounded-xl ${style.bg} border ${style.border} mb-4`}>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shrink-0">
                      <Bot size={10} />
                    </div>
                    <p className="text-white/70 text-xs leading-relaxed">{stock.aiNote}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/signals/${stock.symbol}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gold/30 bg-gold/10 text-gold text-xs font-medium hover:bg-gold/20 transition-all"
                  >
                    <ExternalLink size={12} /> View Details
                  </button>
                  <button
                    onClick={() => removeFromWatchlist(stock.symbol)}
                    title="Remove from watchlist"
                    className="px-3 py-2 rounded-xl border border-white/10 text-white/30 text-xs font-medium hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="py-24 text-center text-white/20">
          <Activity size={48} className="mx-auto mb-4 opacity-20" />
          <p>{filter === "ALL" ? "Your watchlist is empty. Add stocks to monitor." : "No stocks match this filter."}</p>
        </div>
      )}

      {/* Add Stock Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              className="glass-card max-w-sm w-full"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gold">Add to Watchlist</h2>
                  <p className="text-white/40 text-xs mt-1">AI will continuously monitor this stock</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <label className="field-label">Stock Symbol</label>
                  <input
                    type="text"
                    value={addSymbol}
                    onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && addToWatchlist()}
                    placeholder="e.g. RELIANCE, TCS, INFY"
                    className="auth-input"
                    autoFocus
                  />
                  {/* Suggestions dropdown */}
                  {addSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-white/10 bg-[#0c0c0c]/95 backdrop-blur-xl shadow-2xl z-50 py-1 max-h-[200px] overflow-y-auto">
                      {addSuggestions.map((stock) => (
                        <button
                          key={stock.symbol}
                          onClick={() => addToWatchlist(stock.symbol)}
                          className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-white/[0.04] transition-colors group/item"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[9px] font-bold text-gold/80 shrink-0">
                              {stock.symbol.slice(0, 2)}
                            </div>
                            <div className="text-left">
                              <p className="text-white text-xs font-medium group-hover/item:text-gold transition-colors">{stock.name}</p>
                              <p className="text-white/30 text-[10px]">{stock.symbol} · {stock.sector}</p>
                            </div>
                          </div>
                          <span className={`flex items-center gap-1 text-[11px] font-medium tabular-nums ${stock.changePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {stock.changePct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {Math.abs(stock.changePct).toFixed(2)}%
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-gold/5 border border-gold/20 rounded-xl">
                  <p className="text-white/60 text-xs leading-relaxed">
                    <span className="text-gold font-medium">AI Monitoring includes:</span>
                    <br />
                    • RSI & MACD anomaly detection
                    <br />
                    • Support/resistance breach alerts
                    <br />
                    • Volume spike detection
                    <br />
                    • Daily AI summary of technicals
                  </p>
                </div>

                <button
                  onClick={() => addToWatchlist()}
                  disabled={!addSymbol.trim()}
                  className="w-full py-3 rounded-full bg-gold hover:bg-gold/90 text-black font-semibold text-sm uppercase tracking-wider transition-all disabled:opacity-30"
                >
                  Add & Start Monitoring
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
