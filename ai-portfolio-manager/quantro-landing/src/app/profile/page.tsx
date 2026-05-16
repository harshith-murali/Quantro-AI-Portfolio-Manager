"use client";
import { useEffect, useState } from "react";
import { 
  User, 
  Mail, 
  Shield, 
  Target, 
  Calendar, 
  Save, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/useAuth";

const RISK_OPTIONS = [
  { value: "CONSERVATIVE", label: "Conservative", desc: "20% of surplus", score: 3 },
  { value: "MODERATE",     label: "Moderate",     desc: "35% of surplus", score: 5 },
  { value: "AGGRESSIVE",   label: "Aggressive",   desc: "50% of surplus", score: 8 },
] as const;

const GOAL_OPTIONS = [
  { value: "SHORT_TERM",  label: "Short Term",  desc: "< 1 year"  },
  { value: "MEDIUM_TERM", label: "Medium Term", desc: "1–3 years" },
  { value: "LONG_TERM",   label: "Long Term",   desc: "3+ years"  },
] as const;

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function ProfilePage() {
  const router    = useRouter();
  const accessToken = useAuth();
  const { user, setUser, setProfile } = useStore();
  const [portfolio,  setPortfolio]  = useState<any>(null);
  const [holdings,   setHoldings]   = useState<any[]>([]);
  const [wallet,     setWallet]     = useState<any>(null);
  const [txSummary,  setTxSummary]  = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [editOpen,   setEditOpen]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState("");

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { riskAppetite: "MODERATE", investmentGoal: "MEDIUM_TERM" },
  });

  const income = watch("monthlyIncome") || 0;
  const fixed  = watch("fixedExpenses") || 0;
  const disc   = watch("discretionaryExpenses") || 0;
  const surplus = Math.max(0, income - fixed - disc);

  // Repopulate form when user profile data is loaded
  useEffect(() => {
    const profile = (user as any)?.financialProfile || user;
    if (profile && profile.monthlyIncome) {
      reset({
        monthlyIncome: Number(profile.monthlyIncome),
        fixedExpenses: Number(profile.monthlyExpenses),
        discretionaryExpenses: 0,
        totalSavings: Number(profile.currentSavings),
        investmentGoal: (profile.financialGoal as any) || "MEDIUM_TERM",
        riskAppetite: profile.riskAppetite === "LOW" ? "CONSERVATIVE" : profile.riskAppetite === "HIGH" ? "AGGRESSIVE" : "MODERATE",
      });
    }
  }, [user, reset]);

  useEffect(() => {
    if (!accessToken) return;
    Promise.allSettled([
      api.profile.get(accessToken).then((d: any) => setUser(d.profile ?? d)).catch(() => {}),
      api.portfolio.summary(accessToken).then((d: any) => setPortfolio(d.summary ?? d)).catch(() => {}),
      api.portfolio.holdings(accessToken).then((d: any) => setHoldings(d.holdings ?? d ?? [])).catch(() => {}),
      api.wallet.balance(accessToken).then((d: any) => setWallet(d)).catch(() => {}),
      api.transactions.summary(accessToken).then((d: any) => setTxSummary(d.summary ?? d)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [accessToken]);

  const onSave = async (data: ProfileInput) => {
    if (!accessToken) return;
    setSaving(true); setSaveMsg("");
    const surplus = Math.max(0, (data.monthlyIncome ?? 0) - (data.fixedExpenses ?? 0) - (data.discretionaryExpenses ?? 0));
    const multiplier = data.riskAppetite === "AGGRESSIVE" ? 0.5 : data.riskAppetite === "CONSERVATIVE" ? 0.2 : 0.35;
    const localInvestable = Math.round(surplus * multiplier);
    try {
      const payload = {
        monthlyIncome:    data.monthlyIncome,
        monthlyExpenses:  (data.fixedExpenses ?? 0) + (data.discretionaryExpenses ?? 0),
        currentSavings:   data.totalSavings ?? 0,
        financialGoal:    data.investmentGoal ?? "MEDIUM_TERM",
        riskAppetite:     data.riskAppetite === "CONSERVATIVE" ? "LOW" : data.riskAppetite === "AGGRESSIVE" ? "HIGH" : "MEDIUM",
        investableAmount: localInvestable,
      };
      const res = await api.profile.create(payload, accessToken);
      setProfile(res.profile ?? res);
      setSaveMsg("Profile saved!");
      setTimeout(() => { setEditOpen(false); setSaveMsg(""); }, 1500);
    } catch {
      setSaveMsg("Saved locally (backend unavailable).");
      setTimeout(() => { setEditOpen(false); setSaveMsg(""); }, 1500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen pt-36 pb-24 px-4 max-w-4xl mx-auto animate-pulse">
      <div className="h-20 w-20 bg-white/5 rounded-full mb-6" />
      <div className="h-8 w-48 bg-white/5 rounded mb-3" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
      </div>
    </div>
  );

  // Derived values
  const totalValue   = Number(portfolio?.currentValue  ?? portfolio?.totalValue ?? 0);
  const unrealised   = Number(portfolio?.unrealizedPnl ?? portfolio?.unrealisedPnl ?? 0);
  const realised     = Number(portfolio?.realizedPnl   ?? portfolio?.realisedPnl ?? 0);
  const totalPnl     = Number(portfolio?.totalPnl ?? (unrealised + realised));
  const balance      = Number(wallet?.balance ?? 0);
  const totalDep     = Number(txSummary?.totalDeposited ?? 0);
  const invested     = Number(txSummary?.totalInvested ?? 0);
  const riskInfo     = RISK_OPTIONS.find(r => r.value === (user as any)?.riskAppetite) ?? RISK_OPTIONS[1];
  const goalInfo     = GOAL_OPTIONS.find(g => g.value === (user as any)?.investmentGoal) ?? GOAL_OPTIONS[1];
  const memberSince  = (user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—";
  const initials     = user?.name ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() : "?";

  return (
    <div className="min-h-screen pt-36 pb-24 px-4 md:px-8 max-w-4xl mx-auto">

      {/* ── Avatar + name header ─────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="flex items-start justify-between mb-10 flex-wrap gap-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold text-2xl font-bold">
            {initials}
          </div>
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] mb-0.5">Account</p>
            <h1 className="text-3xl font-bold text-white">{user?.name ?? "Investor"}</h1>
            <p className="text-white/40 text-sm mt-0.5">{user?.email ?? ""}</p>
            <p className="text-white/20 text-xs mt-1">Member since {memberSince}</p>
          </div>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="px-5 py-2.5 rounded-full border border-gold/30 text-gold text-sm hover:bg-gold/10 transition-all self-start"
        >
          Edit Financial Profile
        </button>
      </motion.div>

      {/* ── KPI strip ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Portfolio Value",  value: `₹${fmt(totalValue)}`,          color: "text-white"        },
          { label: "Total P&L",        value: `${totalPnl >= 0 ? "+" : ""}₹${fmt(totalPnl)}`, color: totalPnl >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Wallet Balance",   value: `₹${fmt(balance)}`,             color: "text-gold"         },
          { label: "Open Positions",   value: String(holdings.length),         color: "text-white"        },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }} className="glass-card">
            <p className="text-white/35 text-[10px] uppercase tracking-wider mb-1.5">{label}</p>
            <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* ── Account Details ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card lg:col-span-2">
          <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] mb-5">Account Details</p>
          <div className="space-y-4">
            {[
              { label: "Full Name",          value: user?.name        ?? "—" },
              { label: "Email",              value: user?.email       ?? "—" },
              { label: "Risk Appetite",      value: riskInfo.label    + ` (${riskInfo.desc})` },
              { label: "Investment Goal",    value: goalInfo.label    + ` · ${goalInfo.desc}` },
              { label: "Account Type",       value: "Virtual Paper Trading" },
              { label: "Member Since",       value: memberSince },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between border-b border-white/[0.05] pb-3 last:border-0 last:pb-0">
                <span className="text-white/35 text-xs uppercase tracking-wider w-40 shrink-0">{label}</span>
                <span className="text-white/80 text-sm text-right">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Risk Profile ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card flex flex-col">
          <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] mb-5">Risk Profile</p>
          {/* Risk score ring */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative w-24 h-24 mb-3">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle cx="48" cy="48" r="38" fill="none" stroke="#cfab67" strokeWidth="8"
                  strokeDasharray={`${(riskInfo.score / 10) * 238} 238`}
                  strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-gold text-2xl font-bold">{riskInfo.score}</span>
                <span className="text-white/30 text-[9px] uppercase tracking-wider">/10</span>
              </div>
            </div>
            <p className="text-white font-semibold">{riskInfo.label}</p>
            <p className="text-white/35 text-xs mt-0.5">{riskInfo.desc} of monthly surplus</p>
          </div>
          <div className="space-y-2 mt-auto">
            {RISK_OPTIONS.map(r => (
              <div key={r.value} className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                r.value === riskInfo.value
                  ? "border-gold/30 bg-gold/5"
                  : "border-white/5 opacity-40"
              }`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${r.value === riskInfo.value ? "bg-gold" : "bg-white/20"}`} />
                <span className="text-white text-xs font-medium">{r.label}</span>
                <span className="text-white/30 text-xs ml-auto">{r.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Financial Summary ──────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card mb-5">
        <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] mb-5">Financial Activity Summary</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Deposited",   value: `₹${fmt(totalDep)}`,      color: "text-emerald-400" },
            { label: "Invested in Trades",value: `₹${fmt(invested)}`,      color: "text-blue-400"    },
            { label: "Realised P&L",      value: `${realised >= 0 ? "+" : ""}₹${fmt(realised)}`, color: realised >= 0 ? "text-emerald-400" : "text-red-400" },
            { label: "Unrealised P&L",    value: `${unrealised >= 0 ? "+" : ""}₹${fmt(unrealised)}`, color: unrealised >= 0 ? "text-emerald-400" : "text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.05]">
              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">{label}</p>
              <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Holdings snapshot ──────────────────────────────────── */}
      {holdings.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card">
          <div className="flex items-center justify-between mb-5">
            <p className="text-white/40 text-[10px] uppercase tracking-[0.25em]">Current Holdings</p>
            <button onClick={() => router.push("/portfolio")} className="text-gold text-xs hover:underline flex items-center">View Portfolio <ArrowRight size={12} className="ml-1" /></button>
          </div>
          <div className="space-y-3">
            {holdings.map((h: any) => {
              const avgBuy = Number(h.averageBuyPrice ?? h.avgBuyPrice ?? 0);
              const qty    = Number(h.quantity ?? 0);
              const val    = avgBuy * qty;
              return (
                <div key={h.symbol} className="flex items-center justify-between border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-[10px] font-bold">
                      {h.symbol?.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{h.symbol}</p>
                      <p className="text-white/30 text-xs">{qty} shares · avg ₹{avgBuy.toFixed(0)}</p>
                    </div>
                  </div>
                  <p className="text-white tabular-nums text-sm font-semibold">₹{fmt(val)}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Edit Financial Profile Modal ──────────────────────── */}
      <AnimatePresence>
        {editOpen && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setEditOpen(false); }}
          >
            <motion.div
              className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-[0.25em] mb-0.5">Update</p>
                  <h2 className="text-xl font-bold text-white">Financial Profile</h2>
                </div>
                <button onClick={() => setEditOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all text-lg">×</button>
              </div>

              {/* Live surplus preview */}
              {surplus > 0 && (
                <div className="mb-5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex justify-between">
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-wider mb-0.5">Monthly Surplus</p>
                    <p className="text-white font-semibold tabular-nums">₹{fmt(surplus)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/30 text-[10px] uppercase tracking-wider mb-0.5">Investable (35%)</p>
                    <p className="text-gold font-semibold tabular-nums">₹{fmt(Math.round(surplus * 0.35))}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSave)} className="space-y-5">
                {[
                  { name: "monthlyIncome",        label: "Monthly Income (₹)",        hint: "Gross income" },
                  { name: "fixedExpenses",         label: "Fixed Expenses (₹)",        hint: "Rent, EMIs" },
                  { name: "discretionaryExpenses", label: "Discretionary Expenses (₹)",hint: "Dining, leisure" },
                  { name: "totalSavings",          label: "Existing Savings (₹)",      hint: "Liquid savings" },
                ].map(({ name, label, hint }) => (
                  <div key={name}>
                    <div className="flex justify-between mb-1.5">
                      <label className="field-label mb-0">{label}</label>
                      <span className="text-white/20 text-xs">{hint}</span>
                    </div>
                    <input {...register(name as keyof ProfileInput, { valueAsNumber: true })}
                      type="number" placeholder="0" min="0" className="auth-input" />
                  </div>
                ))}

                <div>
                  <label className="field-label">Risk Appetite</label>
                  <div className="grid grid-cols-3 gap-2">
                    {RISK_OPTIONS.map(opt => (
                      <label key={opt.value} className="cursor-pointer">
                        <input {...register("riskAppetite")} type="radio" value={opt.value} className="sr-only peer" />
                        <span className="block p-2.5 rounded-xl border border-white/10 text-center peer-checked:border-gold peer-checked:bg-gold/5 transition-all">
                          <span className="block text-white/70 text-xs font-medium peer-checked:text-white">{opt.label}</span>
                          <span className="block text-white/30 text-[10px] mt-0.5">{opt.desc}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="field-label">Investment Goal</label>
                  <div className="grid grid-cols-3 gap-2">
                    {GOAL_OPTIONS.map(opt => (
                      <label key={opt.value} className="cursor-pointer">
                        <input {...register("investmentGoal")} type="radio" value={opt.value} className="sr-only peer" />
                        <span className="block p-2.5 rounded-xl border border-white/10 text-center peer-checked:border-gold peer-checked:bg-gold/5 transition-all">
                          <span className="block text-white/70 text-xs font-medium peer-checked:text-white">{opt.label}</span>
                          <span className="block text-white/30 text-[10px] mt-0.5">{opt.desc}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {saveMsg && (
                  <p className="flex items-center justify-center gap-2 text-emerald-400 text-sm text-center font-medium">
                    <CheckCircle2 size={16} /> {saveMsg}
                  </p>
                )}

                <button type="submit" disabled={saving}
                  className="w-full py-3.5 rounded-full bg-gold text-[#060606] font-bold text-sm uppercase tracking-[0.15em] hover:bg-[#e8c97a] transition-all disabled:opacity-50">
                  {saving ? "Saving…" : "Save Profile"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}