"use client";
import Link from "next/link";

interface Props {
  riskAppetite: string;
  activeSignals: number;
  buyCalls: number;
  aiSummary?: string;
}

const RISK_COLORS: Record<string, string> = {
  AGGRESSIVE: "text-red-400",
  MODERATE: "text-yellow-400",
  CONSERVATIVE: "text-emerald-400",
};

const RISK_LABELS: Record<string, string> = {
  AGGRESSIVE: "High",
  MODERATE: "Med",
  CONSERVATIVE: "Low",
  NOT_SET: "—",
};

export function StrategyInsightCard({ riskAppetite, activeSignals, buyCalls, aiSummary }: Props) {
  const riskLabel = RISK_LABELS[riskAppetite] ?? "—";
  const riskColor = RISK_COLORS[riskAppetite] ?? "text-white/40";

  return (
    <div className="glass-card flex flex-col gap-4">
      <h2 className="text-lg text-white font-semibold">Market Strategy</h2>

      <p className="text-sm text-white/50 leading-relaxed">
        Your strategy is calibrated for a{" "}
        <span className={`font-semibold ${riskColor}`}>{riskAppetite?.replace("_", " ") || "unset"}</span> risk profile.
      </p>

      {aiSummary ? (
        <div className="p-4 bg-gold/[0.04] rounded-xl border border-gold/15">
          <p className="text-gold font-medium text-[10px] uppercase tracking-widest mb-2">AI Suggestion</p>
          <p className="text-white/65 text-sm leading-relaxed">{aiSummary}</p>
        </div>
      ) : (
        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/8">
          <p className="text-white/20 text-sm">No AI insight available. Generate a portfolio summary in the AI Advisor tab.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Risk Score", value: riskLabel, color: riskColor },
          { label: "Active Signals", value: String(activeSignals), color: "text-white" },
          { label: "Buy Calls", value: String(buyCalls), color: "text-gold" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
            <p className="text-white/25 text-[10px] uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      <Link href="/ai" className="gold-btn block text-center mt-auto">
        Get AI Recommendations →
      </Link>
    </div>
  );
}
