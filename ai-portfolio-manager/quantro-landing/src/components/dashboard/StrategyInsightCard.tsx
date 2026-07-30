"use client";
import Link from "next/link";
import { Shield, Activity, Zap, Bot, ArrowRight } from "lucide-react";

interface Props {
  riskAppetite: string;
  activeSignals: number;
  buyCalls: number;
  aiSummary?: string;
}

const RISK_COLORS: Record<string, string> = {
  HIGH: "text-red-400",
  MEDIUM: "text-yellow-400",
  LOW: "text-emerald-400",
};

const RISK_LABELS: Record<string, string> = {
  HIGH: "High",
  MEDIUM: "Med",
  LOW: "Low",
  NOT_SET: "—",
};

export function StrategyInsightCard({ riskAppetite, activeSignals, buyCalls, aiSummary }: Props) {
  const riskLabel = RISK_LABELS[riskAppetite] ?? "—";
  const riskColor = RISK_COLORS[riskAppetite] ?? "text-white/40";

  return (
    <div className="glass-card flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2">
        <Shield size={18} className="text-gold" />
        <h2 className="text-lg text-white font-semibold">Market Strategy</h2>
      </div>

      <p className="text-sm text-white/50 leading-relaxed">
        Your strategy is calibrated for a{" "}
        <span className={`font-semibold ${riskColor}`}>{riskAppetite?.replace("_", " ") || "unset"}</span> risk profile.
      </p>

      {aiSummary ? (
        <div className="p-4 bg-gold/[0.04] rounded-xl border border-gold/15">
          <div className="flex items-center gap-2 mb-2 text-gold">
            <Bot size={14} />
            <p className="font-medium text-[10px] uppercase tracking-widest">AI Suggestion</p>
          </div>
          <p className="text-white/65 text-sm leading-relaxed">{aiSummary}</p>
        </div>
      ) : (
        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/8">
          <p className="text-white/20 text-sm">No AI insight available. Generate a portfolio summary in the AI Advisor tab.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center mt-2">
        {[
          { label: "Risk Score", value: riskLabel, color: riskColor, icon: <Shield size={12} /> },
          { label: "Active Signals", value: String(activeSignals), color: "text-white", icon: <Activity size={12} /> },
          { label: "Buy Calls", value: String(buyCalls), color: "text-gold", icon: <Zap size={12} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
            <div className="flex items-center justify-center gap-1.5 text-white/25 mt-1">
              {icon}
              <p className="text-[10px] uppercase tracking-wider">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <Link href="/ai" className="gold-btn w-full flex items-center justify-center gap-2 mt-auto">
        Get AI Recommendations <ArrowRight size={16} />
      </Link>
    </div>
  );
}
