"use client";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DataPoint {
  date: string;
  portfolio: number;
  nifty50?: number;
}

interface Props {
  data: DataPoint[];
  initialPortfolioValue: number;
}

function shortDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function PortfolioVsBenchmarkChart({ data, initialPortfolioValue }: Props) {
  const hasBenchmark = data.some(d => d.nifty50 != null);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[180px] text-white/20">
        <p className="text-sm">No portfolio history yet.</p>
        <p className="text-xs mt-1">Make your first trade to see the chart.</p>
      </div>
    );
  }

  // Normalize to index 100 for relative comparison
  const basePortfolio = data[0].portfolio || initialPortfolioValue || 1;
  const firstBenchmarkPoint = data.find(d => d.nifty50 != null);
  const baseNifty = firstBenchmarkPoint?.nifty50 ?? null;

  const normalised = data.map(d => ({
    date: shortDate(d.date),
    portfolio: Number(((d.portfolio / basePortfolio) * 100).toFixed(2)),
    ...(baseNifty != null && d.nifty50 != null
      ? { nifty50: Number(((d.nifty50 / baseNifty) * 100).toFixed(2)) }
      : {}),
  }));

  return (
    <ResponsiveContainer width="100%" height={190}>
      <LineChart data={normalised} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fill: "#555", fontSize: 9 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis hide domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
          formatter={(v: any, name?: any) => [`${Number(v).toFixed(2)} (idx)`, name === "portfolio" ? "Strategy" : "NIFTY 50"]}
        />
        <Line
          type="monotone"
          dataKey="portfolio"
          stroke="#cfab67"
          strokeWidth={2}
          dot={false}
          name="portfolio"
        />
        {hasBenchmark && (
          <Line
            type="monotone"
            dataKey="nifty50"
            stroke="rgba(96,165,250,0.55)"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="5 3"
            name="nifty50"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
