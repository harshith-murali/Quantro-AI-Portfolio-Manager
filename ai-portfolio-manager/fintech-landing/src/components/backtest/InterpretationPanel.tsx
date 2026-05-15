"use client";

interface Props {
  totalReturnPct: number;
  buyAndHoldReturnPct: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  totalTrades: number;
  annualisedReturnPct: number;
}

function buildInterpretation(p: Props): string[] {
  const lines: string[] = [];

  // Return vs B&H
  const outperformance = p.totalReturnPct - p.buyAndHoldReturnPct;
  if (outperformance > 2) {
    lines.push(`The strategy outperformed buy-and-hold by ${outperformance.toFixed(1)} percentage points over the selected period, suggesting the crossover signal added real alpha.`);
  } else if (outperformance > 0) {
    lines.push(`The strategy marginally outperformed buy-and-hold (+${outperformance.toFixed(1)} pp), though the advantage is too narrow to be conclusive without more data.`);
  } else if (outperformance < -2) {
    lines.push(`The strategy underperformed buy-and-hold by ${Math.abs(outperformance).toFixed(1)} percentage points, indicating that passive holding was the more profitable approach in this period.`);
  } else {
    lines.push(`The strategy returned roughly in line with buy-and-hold, providing no clear directional edge over passive holding for this parameter set.`);
  }

  // Trade frequency
  if (p.totalTrades === 0) {
    lines.push("No trades were executed, meaning the crossover conditions were never met. The windows may be too wide relative to the date range, or the price series was too trending in one direction.");
  } else if (p.totalTrades === 1) {
    lines.push("Only one trade was generated. A single trade cannot be statistically evaluated — this result reflects a single event, not a repeatable strategy edge.");
  } else if (p.totalTrades <= 2) {
    lines.push(`With only ${p.totalTrades} trades, there is insufficient sample size to evaluate whether the results are reproducible. Consider widening the date range.`);
  } else if (p.totalTrades >= 20) {
    lines.push(`${p.totalTrades} trades were executed, providing a reasonable sample size for assessment.`);
  }

  // Drawdown
  if (p.maxDrawdownPct > 20) {
    lines.push(`The maximum drawdown of ${p.maxDrawdownPct.toFixed(1)}% is elevated. A drawdown of this magnitude would require significant recovery time and may be psychologically difficult to endure in live trading.`);
  } else if (p.maxDrawdownPct > 10) {
    lines.push(`The drawdown of ${p.maxDrawdownPct.toFixed(1)}% is moderate. While within acceptable bounds for many traders, it warrants attention in portfolio sizing.`);
  } else if (p.maxDrawdownPct > 0) {
    lines.push(`The drawdown of ${p.maxDrawdownPct.toFixed(1)}% is relatively contained, suggesting the strategy managed downside well in this period.`);
  }

  // Sharpe
  if (p.totalTrades > 2) {
    if (p.sharpeRatio < 0) {
      lines.push("The negative Sharpe ratio indicates poor risk-adjusted performance — returns did not compensate for the volatility experienced.");
    } else if (p.sharpeRatio < 0.5) {
      lines.push(`A Sharpe ratio of ${p.sharpeRatio.toFixed(2)} is weak. The returns generated are low relative to the risk taken.`);
    } else if (p.sharpeRatio < 1) {
      lines.push(`A Sharpe ratio of ${p.sharpeRatio.toFixed(2)} is acceptable but not strong. Most institutional benchmarks require a Sharpe above 1.0.`);
    } else {
      lines.push(`A Sharpe ratio of ${p.sharpeRatio.toFixed(2)} is healthy, indicating the strategy's returns justified the volatility incurred.`);
    }
  }

  return lines;
}

export function InterpretationPanel(props: Props) {
  const lines = buildInterpretation(props);

  return (
    <div className="glass-card mb-6 border border-white/[0.06]">
      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-4">Strategy Interpretation</p>
      <div className="space-y-3">
        {lines.map((line, i) => (
          <p key={i} className="text-white/60 text-sm leading-relaxed">
            <span className="text-gold/60 mr-2">›</span>{line}
          </p>
        ))}
      </div>
      <p className="text-white/20 text-[10px] mt-4 pt-3 border-t border-white/5">
        Interpretation is rule-based and deterministic. No AI or predictive inference is applied.
      </p>
    </div>
  );
}
