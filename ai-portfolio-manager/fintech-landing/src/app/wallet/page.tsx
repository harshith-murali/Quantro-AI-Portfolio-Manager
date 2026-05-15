"use client";
import { useEffect, useState, useRef } from "react";
import { 
  Plus, 
  Minus, 
  History, 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/useAuth";
import { api } from "@/lib/api";
import * as XLSX from "xlsx";

// ─── Transaction type badge styles ──────────────────────────────
const TX_META: Record<string, { label: string; color: string; icon: string }> = {
  DEPOSIT:     { label: "Deposit",       color: "text-emerald-400 bg-emerald-400/8 border-emerald-400/20", icon: "↓" },
  WITHDRAWAL:  { label: "Withdrawal",    color: "text-red-400    bg-red-400/8    border-red-400/20",    icon: "↑" },
  TRADE_DEBIT: { label: "Buy",           color: "text-blue-400   bg-blue-400/8   border-blue-400/20",   icon: "◈" },
  TRADE_CREDIT:{ label: "Sell",          color: "text-purple-400 bg-purple-400/8 border-purple-400/20", icon: "◈" },
  PNL_CREDIT:  { label: "P&L Credit",   color: "text-gold       bg-gold/8       border-gold/20",       icon: "✦" },
};

function fmt(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Mini animated counter ────────────────────────────────────────
function BalanceCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    const from = display;
    const to = value;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * ease);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);

  return (
    <span className="tabular-nums">
      ₹{fmt(display)}
    </span>
  );
}

export default function WalletPage() {
  const accessToken = useAuth();
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"deposit" | "withdraw" | null>(null);
  const [amount, setAmount] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async (token: string) => {
    await Promise.allSettled([
      api.wallet.balance(token).then((d) => setBalance(Number(d.balance ?? 0))).catch(() => {}),
      api.transactions.summary(token)
        .then((d: any) => setSummary(d.summary ?? d)).catch(() => {}),
      api.transactions.list(token)
        .then((d: any) => setTransactions(d.transactions ?? d ?? [])).catch(() => {}),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchAll(accessToken);
  }, [accessToken]);

  const handleAction = async () => {
    if (!accessToken || !amount || isNaN(Number(amount))) return;
    setSubmitting(true);
    setActionErr("");
    setActionMsg("");
    try {
      const fn = modal === "deposit" ? api.wallet.deposit : api.wallet.withdraw;
      const res = await fn({ amount: Number(amount) }, accessToken);
      const newBal = Number(res.balance ?? res.wallet?.balance ?? 0);
      if (newBal) setBalance(newBal);
      setActionMsg(modal === "deposit" ? `+₹${fmt(Number(amount))} added to wallet` : `₹${fmt(Number(amount))} withdrawn`);
      setAmount("");
      setTimeout(async () => {
        setModal(null);
        setActionMsg("");
        // Refresh all data
        await fetchAll(accessToken);
      }, 1500);
    } catch (e: any) {
      setActionErr(e.message ?? "Action failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton />;

  const netFlow = summary?.netCashFlow ?? 0;
  const invested = summary?.totalInvested ?? 0;
  const proceeds = summary?.totalSaleProceeds ?? 0;
  const pnlSettled = summary?.totalPnlSettled ?? 0;

  return (
    <div className="min-h-screen pt-36 pb-24 px-4 md:px-8 max-w-5xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10"
      >
        <p className="text-white/30 text-[10px] uppercase tracking-[0.35em] mb-2">Virtual Wallet</p>
        <h1 className="text-[11px] text-white/40 uppercase tracking-[0.25em] mb-1">Available Balance</h1>
        <div className="text-[52px] sm:text-[68px] font-bold text-white leading-none mb-3">
          {balance !== null ? <BalanceCounter value={balance} /> : <span className="tabular-nums">₹0.00</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm tabular-nums font-medium ${netFlow >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {netFlow >= 0 ? "+" : ""}₹{fmt(netFlow)} net cash flow
          </span>
          <span className="w-px h-4 bg-white/10" />
          <span className="text-white/30 text-xs">Since inception</span>
        </div>
      </motion.div>

      {/* ── Action buttons ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex gap-3 mb-10"
      >
        <button
          onClick={() => { setModal("deposit"); setAmount(""); setActionErr(""); }}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-[#060606] text-sm font-bold uppercase tracking-[0.15em] hover:bg-[#e8c97a] hover:-translate-y-0.5 transition-all duration-200"
        >
          <span className="text-base">↓</span> Deposit
        </button>
        <button
          onClick={() => { setModal("withdraw"); setAmount(""); setActionErr(""); }}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-white/10 hover:text-white hover:-translate-y-0.5 transition-all duration-200"
        >
          <span className="text-base">↑</span> Withdraw
        </button>
      </motion.div>

      {/* ── Summary KPI strip ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
      >
        {[
          { label: "Total Deposited",    value: summary?.totalDeposited ?? 0,     color: "text-emerald-400" },
          { label: "Total Withdrawn",    value: summary?.totalWithdrawn ?? 0,     color: "text-red-400"     },
          { label: "Invested in Trades", value: invested,                          color: "text-blue-400"    },
          { label: "P&L Settled",        value: pnlSettled,                        color: "text-gold"        },
        ].map(({ label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.06, duration: 0.5 }}
            className="glass-card"
          >
            <p className="text-white/35 text-[10px] uppercase tracking-wider mb-1.5">{label}</p>
            <p className={`text-lg font-bold tabular-nums ${color}`}>₹{fmt(value)}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Transaction history ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card"
      >
        <div className="flex items-center justify-between mb-6">
          <p className="text-white/40 text-[10px] uppercase tracking-[0.25em]">
            Transaction History
            <span className="ml-2 text-white/20">({transactions.length})</span>
          </p>
          <div className="flex items-center gap-3">
            {transactions.length > 0 && (
              <button
                onClick={() => {
                  // Build ledger rows matching the settlement format
                  const rows: any[] = [];
                  // Calculate opening balance: current balance + all debits - all credits (reverse transactions)
                  let runningBalance = balance ?? 0;
                  // Walk transactions in chronological order (oldest first)
                  const sorted = [...transactions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

                  // Calculate opening balance by reversing all transactions
                  let openingBalance = runningBalance;
                  for (const tx of sorted) {
                    const amt = Number(tx.amount ?? 0);
                    const isCredit = ["DEPOSIT", "TRADE_CREDIT", "PNL_CREDIT"].includes(tx.type);
                    if (isCredit) {
                      openingBalance -= amt;
                    } else {
                      openingBalance += amt;
                    }
                  }

                  // Row 1: Opening Balance
                  let ledgerBalance = openingBalance;
                  rows.push({
                    particulars: "Opening Balance",
                    posting_date: "",
                    cost_center: "",
                    voucher_type: "",
                    debit: "",
                    credit: "",
                    net_balance: Number(ledgerBalance.toFixed(2)),
                  });

                  // Transaction rows
                  for (const tx of sorted) {
                    const amt = Number(tx.amount ?? 0);
                    const isCredit = ["DEPOSIT", "TRADE_CREDIT", "PNL_CREDIT"].includes(tx.type);
                    const isTrade = ["TRADE_DEBIT", "TRADE_CREDIT"].includes(tx.type);
                    const date = new Date(tx.createdAt);
                    const dateStr = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;

                    if (isTrade) {
                      // Platform fee entry
                      const feePercent = amt * 0.001;
                      const fee = Math.max(feePercent, 20);
                      ledgerBalance -= fee;
                      rows.push({
                        particulars: `Being platform fee for ${dateStr}`,
                        posting_date: dateStr,
                        cost_center: "NSE-EQ - Z",
                        voucher_type: "Journal Entry",
                        debit: Number(fee.toFixed(2)),
                        credit: 0,
                        net_balance: Number(ledgerBalance.toFixed(2)),
                      });

                      // Net settlement entry
                      const settlementNo = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${Math.floor(Math.random() * 900 + 100)}`;
                      if (isCredit) {
                        ledgerBalance += amt;
                        rows.push({
                          particulars: `Net settlement for Equity with settlement number: ${settlementNo}`,
                          posting_date: dateStr,
                          cost_center: "NSE-EQ - Z",
                          voucher_type: "Book Voucher",
                          debit: 0,
                          credit: Number(amt.toFixed(2)),
                          net_balance: Number(ledgerBalance.toFixed(2)),
                        });
                      } else {
                        ledgerBalance -= amt;
                        rows.push({
                          particulars: `Net settlement for Equity with settlement number: ${settlementNo}`,
                          posting_date: dateStr,
                          cost_center: "NSE-EQ - Z",
                          voucher_type: "Book Voucher",
                          debit: Number(amt.toFixed(2)),
                          credit: 0,
                          net_balance: Number(ledgerBalance.toFixed(2)),
                        });
                      }
                    } else {
                      // Deposit / Withdrawal
                      if (isCredit) {
                        ledgerBalance += amt;
                        rows.push({
                          particulars: tx.description ?? "Fund Deposit",
                          posting_date: dateStr,
                          cost_center: "",
                          voucher_type: "Receipt",
                          debit: 0,
                          credit: Number(amt.toFixed(2)),
                          net_balance: Number(ledgerBalance.toFixed(2)),
                        });
                      } else {
                        ledgerBalance -= amt;
                        rows.push({
                          particulars: tx.description ?? "Fund Withdrawal",
                          posting_date: dateStr,
                          cost_center: "",
                          voucher_type: "Payment",
                          debit: Number(amt.toFixed(2)),
                          credit: 0,
                          net_balance: Number(ledgerBalance.toFixed(2)),
                        });
                      }
                    }
                  }

                  // Closing Balance
                  rows.push({
                    particulars: "Closing Balance",
                    posting_date: "",
                    cost_center: "",
                    voucher_type: "",
                    debit: "",
                    credit: "",
                    net_balance: Number(ledgerBalance.toFixed(2)),
                  });

                  const ws = XLSX.utils.json_to_sheet(rows);
                  ws["!cols"] = [
                    { wch: 52 }, { wch: 12 }, { wch: 12 }, { wch: 16 },
                    { wch: 14 }, { wch: 14 }, { wch: 14 },
                  ];
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Ledger");
                  XLSX.writeFile(wb, `wallet_ledger_${new Date().toISOString().split("T")[0]}.xlsx`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold/30 bg-gold/10 text-gold text-[10px] font-medium uppercase tracking-wider hover:bg-gold/20 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Ledger
              </button>
            )}
            <span className="text-[10px] text-white/20 uppercase tracking-wider">All time</span>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4 text-white/[0.06]">◎</p>
            <p className="text-white/25 text-sm mb-2">No transactions yet</p>
            <p className="text-white/15 text-xs">Deposit virtual cash to start trading</p>
            <button
              onClick={() => { setModal("deposit"); setAmount(""); setActionErr(""); }}
              className="mt-6 px-5 py-2 rounded-full border border-gold/30 text-gold text-xs hover:bg-gold/10 transition-all"
            >
              Make first deposit →
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx: any, i: number) => {
              const meta = TX_META[tx.type] ?? { label: tx.type, color: "text-white/50 bg-white/5 border-white/10", icon: "·" };
              const isCredit = ["DEPOSIT", "TRADE_CREDIT", "PNL_CREDIT"].includes(tx.type);
              return (
                <motion.div
                  key={tx.id ?? i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.4 }}
                  className="flex items-center justify-between py-3.5 px-1 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015] rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Icon badge */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base border ${meta.color} shrink-0`}>
                      {meta.icon}
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-medium leading-tight">
                        {meta.label}
                        {tx.description && (
                          <span className="text-white/25 font-normal ml-1.5 text-xs hidden sm:inline">
                            · {tx.description.slice(0, 50)}{tx.description.length > 50 ? "…" : ""}
                          </span>
                        )}
                      </p>
                      <p className="text-white/25 text-[11px] mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        <span className="mx-1.5">·</span>
                        {new Date(tx.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className={`text-sm font-semibold tabular-nums ${isCredit ? "text-emerald-400" : "text-red-400"}`}>
                      {isCredit ? "+" : "−"}₹{fmt(Number(tx.amount))}
                    </p>
                    <p className={`text-[10px] mt-0.5 px-2 py-0.5 rounded-full border inline-block ${
                      tx.status === "SUCCESS"
                        ? "text-emerald-400/70 border-emerald-400/15 bg-emerald-400/5"
                        : "text-red-400/70 border-red-400/15 bg-red-400/5"
                    }`}>
                      {tx.status?.toLowerCase()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Deposit / Withdraw Modal ────────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
          >
            <motion.div
              className="glass-card w-full max-w-sm sm:rounded-3xl rounded-t-3xl"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 300 }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-[0.25em] mb-0.5">Virtual Wallet</p>
                  <h2 className={`text-2xl font-bold ${modal === "deposit" ? "text-emerald-400" : "text-white"}`}>
                    {modal === "deposit" ? "Add Funds" : "Withdraw Funds"}
                  </h2>
                </div>
                <button
                  onClick={() => setModal(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all text-lg"
                >×</button>
              </div>

              {/* Current balance */}
              <div className="mb-5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] mb-1">Current Balance</p>
                <p className="text-white font-bold text-xl tabular-nums">₹{fmt(balance ?? 0)}</p>
              </div>

              {/* Amount input */}
              <div className="mb-4">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10,000"
                  min={1}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white text-lg font-semibold placeholder-white/15 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all tabular-nums"
                  onKeyDown={(e) => e.key === "Enter" && handleAction()}
                  autoFocus
                />
              </div>

              {/* Quick amount chips */}
              <div className="flex gap-2 mb-5 flex-wrap">
                {[5000, 10000, 25000, 50000, 100000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      amount === String(v)
                        ? "border-gold/50 bg-gold/10 text-gold"
                        : "border-white/10 text-white/40 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    ₹{(v / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>

              {/* Feedback messages */}
              <AnimatePresence>
                {actionMsg && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-emerald-400 text-sm mb-4 text-center font-medium"
                  >
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                      <CheckCircle2 size={16} /> {actionMsg}
                    </div>
                  </motion.p>
                )}
                {actionErr && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-400 text-sm mb-4 text-center"
                  >
                    {actionErr}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Confirm button */}
              <button
                onClick={handleAction}
                disabled={submitting || !amount}
                className={`w-full py-4 rounded-full font-bold text-sm uppercase tracking-[0.15em] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  modal === "deposit"
                    ? "bg-gold text-[#060606] hover:bg-[#e8c97a] hover:-translate-y-0.5"
                    : "bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:-translate-y-0.5"
                }`}
              >
                {submitting ? "Processing…" : modal === "deposit" ? `Deposit ₹${amount ? fmt(Number(amount)) : "—"}` : `Withdraw ₹${amount ? fmt(Number(amount)) : "—"}`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="min-h-screen pt-36 pb-24 px-4 md:px-8 max-w-5xl mx-auto animate-pulse">
      <div className="h-4 w-24 bg-white/5 rounded mb-4" />
      <div className="h-16 w-72 bg-white/5 rounded mb-3" />
      <div className="h-4 w-40 bg-white/5 rounded mb-10" />
      <div className="flex gap-3 mb-10">
        <div className="h-12 w-32 bg-white/5 rounded-full" />
        <div className="h-12 w-32 bg-white/5 rounded-full" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-white/5 rounded-2xl" />
    </div>
  );
}
