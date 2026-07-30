"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Wallet,
  Target,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Scale,
  Rocket,
  Palmtree,
  Zap,
  Coins,
  Globe,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────
type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
type Goal = string;

interface FormData {
  monthlyIncome: number | "";
  monthlyExpenses: number | "";
  currentSavings: number | "";
  financialGoal: Goal;
  riskAppetite: RiskLevel | "";
}

// ─── Constants ────────────────────────────────────────────────────
const RISK_OPTIONS: { value: RiskLevel; label: string; desc: string; color: string; Icon: any }[] = [
  {
    value: "LOW",
    label: "Conservative",
    desc: "Capital preservation. Low volatility, steady returns.",
    color: "border-emerald-500/40 bg-emerald-500/5 peer-checked:border-emerald-400 peer-checked:bg-emerald-400/10",
    Icon: ShieldCheck,
  },
  {
    value: "MEDIUM",
    label: "Moderate",
    desc: "Balanced growth with manageable risk.",
    color: "border-gold/30 bg-gold/5 peer-checked:border-gold peer-checked:bg-gold/10",
    Icon: Scale,
  },
  {
    value: "HIGH",
    label: "Aggressive",
    desc: "High growth potential. Comfortable with big swings.",
    color: "border-orange-500/30 bg-orange-500/5 peer-checked:border-orange-400 peer-checked:bg-orange-400/10",
    Icon: Rocket,
  },
];

const GOAL_OPTIONS: { value: string; label: string; desc: string; Icon: any }[] = [
  { value: "Wealth accumulation",      label: "Wealth Accumulation",    desc: "Grow capital over the long term",         Icon: TrendingUp },
  { value: "Retirement planning",      label: "Retirement Planning",    desc: "Build a nest egg for the future",         Icon: Palmtree },
  { value: "Short-term gains",         label: "Short-Term Gains",       desc: "Quick returns, < 1 year horizon",         Icon: Zap },
  { value: "Income generation",        label: "Income Generation",      desc: "Dividends & regular cash flow",           Icon: Coins },
  { value: "Portfolio diversification",label: "Diversification",        desc: "Spread risk across asset classes",        Icon: Globe },
  { value: "Capital preservation",     label: "Capital Preservation",   desc: "Protect existing wealth from erosion",    Icon: Lock },
];

// ─── Step configs ─────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Income",    icon: Wallet      },
  { id: 2, label: "Expenses",  icon: TrendingUp  },
  { id: 3, label: "Risk",      icon: ShieldCheck },
  { id: 4, label: "Goal",      icon: Target      },
];

// ─── Helpers ──────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function parseCurrency(raw: string): number {
  return Number(raw.replace(/,/g, "").replace(/₹/g, "").trim()) || 0;
}

// ─── Component ────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const { accessToken } = useStore();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);

  const [form, setForm] = useState<FormData>({
    monthlyIncome: "",
    monthlyExpenses: "",
    currentSavings: "",
    financialGoal: "",
    riskAppetite: "",
  });

  // Derived
  const income   = Number(form.monthlyIncome)   || 0;
  const expenses = Number(form.monthlyExpenses) || 0;
  const surplus  = Math.max(0, income - expenses);

  // ── Field helpers ─────────────────────────────────────────────
  const setNum = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? "" : Number(e.target.value);
    setForm((f) => ({ ...f, [key]: val }));
  };

  // ── Validation per step ───────────────────────────────────────
  const isStepValid = (): boolean => {
    if (step === 1) return Number(form.monthlyIncome) > 0;
    if (step === 2) return Number(form.monthlyExpenses) >= 0 && form.monthlyExpenses !== "";
    if (step === 3) return form.riskAppetite !== "";
    if (step === 4) return form.financialGoal !== "";
    return false;
  };

  // ── Navigation ────────────────────────────────────────────────
  const next = () => { if (isStepValid() && step < 4) setStep((s) => s + 1); };
  const back = () => { if (step > 1) setStep((s) => s - 1); };

  // ── Submit ────────────────────────────────────────────────────
  const submit = async () => {
    if (!isStepValid()) return;
    setSubmitting(true);
    setServerError("");
    try {
      const payload = {
        monthlyIncome:   Number(form.monthlyIncome),
        monthlyExpenses: Number(form.monthlyExpenses),
        currentSavings:  Number(form.currentSavings) || 0,
        financialGoal:   form.financialGoal || null,
        riskAppetite:    form.riskAppetite as RiskLevel,
      };
      const token = accessToken ?? useStore.getState().accessToken;
      if (token) {
        await api.profile.create(payload, token);
      }
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (e: any) {
      setServerError(e?.message ?? "Unable to save your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Animation variants ────────────────────────────────────────
  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => { setDirection(1); next(); };
  const goBack = () => { setDirection(-1); back(); };

  // ── "Done" splash ─────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.12),transparent_70%)] blur-3xl pointer-events-none" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="glass-panel p-14 rounded-[2rem] text-center max-w-sm w-full relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 18 }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center"
          >
            <CheckCircle2 size={36} className="text-gold" />
          </motion.div>
          <h2 className="font-serifDisplay text-3xl text-white mb-2">You&apos;re all set!</h2>
          <p className="text-white/40 text-sm mb-1">Your financial profile is configured.</p>
          <p className="text-white/25 text-xs">Taking you to your dashboard…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.07),transparent_70%)] blur-3xl pointer-events-none" />

      {/* Header above card */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 relative z-10"
      >
        <span className="inline-flex items-center gap-1.5 text-gold text-[10px] uppercase tracking-[0.3em] mb-3">
          <Sparkles size={11} />
          Account Created
        </span>
        <h1 className="font-serifDisplay text-4xl sm:text-5xl text-white mb-2">
          Set up your profile
        </h1>
        <p className="text-white/35 text-sm max-w-xs mx-auto">
          Help us personalize your AI-powered portfolio in 4 quick steps.
        </p>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8 relative z-10">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = s.id === step;
          const done   = s.id < step;
          return (
            <div key={s.id} className="flex items-center gap-3">
              <motion.div
                animate={{
                  background: done   ? "rgba(207,171,103,0.15)"
                             : active ? "rgba(207,171,103,0.1)"
                             : "rgba(255,255,255,0.04)",
                  borderColor: done   ? "rgba(207,171,103,0.6)"
                              : active ? "rgba(207,171,103,0.4)"
                              : "rgba(255,255,255,0.1)",
                }}
                className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all"
              >
                {done ? (
                  <CheckCircle2 size={14} className="text-gold" />
                ) : (
                  <Icon size={14} className={active ? "text-gold" : "text-white/25"} />
                )}
              </motion.div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 transition-all duration-500 ${done ? "bg-gold/50" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel w-full max-w-lg rounded-[2rem] relative z-10 overflow-hidden"
      >
        {/* Gold top border */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

        <div className="p-10">
          {/* Step label */}
          <p className="text-white/25 text-[10px] uppercase tracking-[0.3em] mb-1">
            Step {step} of {STEPS.length}
          </p>

          {/* Step content — animated */}
          <div className="relative min-h-[280px]">
            <AnimatePresence mode="wait" custom={direction}>
              {/* ── Step 1: Monthly Income ──────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.32, ease: [0.32, 0, 0.67, 0] }}
                >
                  <h2 className="font-serifDisplay text-3xl text-white mb-1">Monthly Income</h2>
                  <p className="text-white/35 text-sm mb-8">
                    Your total gross salary or income per month.
                  </p>

                  <label className="field-label">Monthly Income (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium">₹</span>
                    <input
                      id="monthlyIncome"
                      type="number"
                      min={0}
                      placeholder="e.g. 80000"
                      value={form.monthlyIncome}
                      onChange={setNum("monthlyIncome")}
                      className="auth-input pl-8"
                      autoFocus
                    />
                  </div>

                  <label className="field-label mt-6 block">Existing Savings (₹) <span className="text-white/20 normal-case tracking-normal">(optional)</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium">₹</span>
                    <input
                      id="currentSavings"
                      type="number"
                      min={0}
                      placeholder="e.g. 200000"
                      value={form.currentSavings}
                      onChange={setNum("currentSavings")}
                      className="auth-input pl-8"
                    />
                  </div>

                  {income > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-5 p-4 rounded-2xl bg-gold/5 border border-gold/15 flex items-center gap-3"
                    >
                      <TrendingUp size={16} className="text-gold shrink-0" />
                      <p className="text-white/60 text-sm">
                        Monthly income: <span className="text-gold font-semibold">₹{fmt(income)}</span>
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ── Step 2: Monthly Expenses ────────────────────── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.32, ease: [0.32, 0, 0.67, 0] }}
                >
                  <h2 className="font-serifDisplay text-3xl text-white mb-1">Monthly Expenses</h2>
                  <p className="text-white/35 text-sm mb-8">
                    Rent, EMIs, groceries, utilities — all outflows combined.
                  </p>

                  <label className="field-label">Total Monthly Expenditure (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium">₹</span>
                    <input
                      id="monthlyExpenses"
                      type="number"
                      min={0}
                      placeholder="e.g. 45000"
                      value={form.monthlyExpenses}
                      onChange={setNum("monthlyExpenses")}
                      className="auth-input pl-8"
                      autoFocus
                    />
                  </div>

                  {/* Surplus preview */}
                  {form.monthlyExpenses !== "" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 grid grid-cols-2 gap-3"
                    >
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1.5">Monthly Income</p>
                        <p className="text-white font-semibold tabular-nums">₹{fmt(income)}</p>
                      </div>
                      <div className={`p-4 rounded-2xl border ${surplus > 0 ? "bg-gold/5 border-gold/20" : "bg-red-500/5 border-red-500/20"}`}>
                        <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1.5">Monthly Surplus</p>
                        <p className={`font-semibold tabular-nums ${surplus > 0 ? "text-gold" : "text-red-400"}`}>
                          {surplus >= 0 ? "+" : ""}₹{fmt(surplus)}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {surplus > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3 text-white/25 text-xs text-center"
                    >
                      We&apos;ll invest a portion of your ₹{fmt(surplus)} monthly surplus based on your risk profile.
                    </motion.p>
                  )}
                </motion.div>
              )}

              {/* ── Step 3: Risk Appetite ───────────────────────── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.32, ease: [0.32, 0, 0.67, 0] }}
                >
                  <h2 className="font-serifDisplay text-3xl text-white mb-1">Risk Appetite</h2>
                  <p className="text-white/35 text-sm mb-6">
                    How much market volatility can you tolerate?
                  </p>

                  <div className="space-y-3">
                    {RISK_OPTIONS.map((opt) => (
                      <label key={opt.value} className="cursor-pointer block group">
                        <input
                          type="radio"
                          name="riskAppetite"
                          value={opt.value}
                          checked={form.riskAppetite === opt.value}
                          onChange={() => setForm((f) => ({ ...f, riskAppetite: opt.value }))}
                          className="sr-only peer"
                        />
                        <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200
                          ${form.riskAppetite === opt.value
                            ? opt.value === "LOW"    ? "border-emerald-400/50 bg-emerald-400/8"
                            : opt.value === "MEDIUM" ? "border-gold/50 bg-gold/8"
                            :                         "border-orange-400/50 bg-orange-400/8"
                            : "border-white/8 bg-white/[0.02] hover:border-white/15"}
                        `}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            form.riskAppetite === opt.value
                              ? opt.value === "LOW"    ? "bg-emerald-400/20 text-emerald-400"
                              : opt.value === "MEDIUM" ? "bg-gold/20 text-gold"
                              :                         "bg-orange-400/20 text-orange-400"
                              : "bg-white/5 text-white/30"
                          }`}>
                            <opt.Icon size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm">{opt.label}</p>
                            <p className="text-white/40 text-xs mt-0.5">{opt.desc}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${
                            form.riskAppetite === opt.value
                              ? opt.value === "LOW"    ? "border-emerald-400 bg-emerald-400"
                              : opt.value === "MEDIUM" ? "border-gold bg-gold"
                              :                          "border-orange-400 bg-orange-400"
                              : "border-white/20 bg-transparent"
                          }`} />
                        </div>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Step 4: Financial Goal ──────────────────────── */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.32, ease: [0.32, 0, 0.67, 0] }}
                >
                  <h2 className="font-serifDisplay text-3xl text-white mb-1">Financial Goal</h2>
                  <p className="text-white/35 text-sm mb-6">
                    What is the primary purpose of your investments?
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {GOAL_OPTIONS.map((opt) => (
                      <label key={opt.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="financialGoal"
                          value={opt.value}
                          checked={form.financialGoal === opt.value}
                          onChange={() => setForm((f) => ({ ...f, financialGoal: opt.value }))}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-2xl border transition-all duration-200 ${
                          form.financialGoal === opt.value
                            ? "border-gold/50 bg-gold/8"
                            : "border-white/8 bg-white/[0.02] hover:border-white/15"
                        }`}>
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                            form.financialGoal === opt.value ? "bg-gold/20 text-gold" : "bg-white/5 text-white/30"
                          }`}>
                            <opt.Icon size={18} />
                          </div>
                          <p className={`text-xs font-semibold leading-tight transition-colors ${
                            form.financialGoal === opt.value ? "text-gold" : "text-white/70"
                          }`}>{opt.label}</p>
                          <p className="text-white/30 text-[10px] mt-1 leading-tight">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          {serverError && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{serverError}</p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-5 py-3 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all text-xs uppercase tracking-[0.15em]"
              >
                <ChevronLeft size={14} />
                Back
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={goNext}
                disabled={!isStepValid()}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full bg-gold text-[#060606] font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#e8c97a] hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                Continue
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting || !isStepValid()}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full bg-gold text-[#060606] font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#e8c97a] hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {submitting ? "Setting up…" : "Launch My Portfolio"}
                {!submitting && <Sparkles size={14} />}
              </button>
            )}
          </div>

          {/* Skip link */}
          <p className="mt-5 text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-white/20 text-xs hover:text-white/40 transition-colors underline underline-offset-2"
            >
              Skip for now, I&apos;ll set this up later
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
