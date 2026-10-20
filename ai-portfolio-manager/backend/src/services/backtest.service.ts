import { loadBacktestHistory } from "@/services/backtestData.service";
import { backtestSchema } from "@/validators/backtest.validator";
import { AppError } from "@/utils/AppError";
import type { OhlcvBar } from "@/services/marketPrice.service";
import { createHash } from "node:crypto";
import { z } from "zod";
export type BacktestParams = z.input<typeof backtestSchema>;
export const STRATEGY_VERSION = "sma-next-open-v2";
const money = (n: number) => Number(n.toFixed(2));
export interface Trade {
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  shares: number;
  pnl: number;
  pnlPct: number;
  fees: number;
  holdingDays: number;
  forcedExit: boolean;
}
export interface EquityPoint {
  date: string;
  close: number;
  shortSma: number | null;
  longSma: number | null;
  signal: "BUY" | "SELL" | "HOLD";
  cash: number;
  shares: number;
  equity: number;
  benchmark: number;
}

/** Deterministic engine: decide at previous close, execute at next open. */
export function simulateBacktest(input: BacktestParams, inputBars: OhlcvBar[]) {
  const p = backtestSchema.parse(input);
  const bars = [
    ...new Map(
      inputBars
        .filter((b) =>
          [b.open, b.close, b.high, b.low].every(
            (v) => Number.isFinite(v) && v > 0,
          ),
        )
        .map((b) => [b.date, b]),
    ).values(),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const selected = bars
    .map((bar, index) => ({ bar, index }))
    .filter(
      ({ bar }) =>
        (!p.startDate || bar.date >= p.startDate) &&
        (!p.endDate || bar.date <= p.endDate),
    );
  if (selected.length < 2)
    throw new AppError(
      "Choose a date range with at least two observed trading days.",
      400,
    );
  const closes = bars.map((b) => b.close);
  const prefix = [0];
  for (const close of closes) prefix.push(prefix.at(-1)! + close);
  const sma = (index: number, window: number) =>
    index < window - 1
      ? null
      : (prefix[index + 1] - prefix[index + 1 - window]) / window;
  const fee = p.transactionCostPct / 100,
    slip = p.slippagePct / 100;
  let cash = p.initialCapital,
    shares = 0,
    totalFees = 0;
  let entry: { date: string; price: number; cost: number; fee: number } | null =
    null;
  const trades: Trade[] = [],
    equityCurve: EquityPoint[] = [];
  const first = selected[0].bar;
  const benchPrice = first.open * (1 + slip);
  const benchShares = Math.floor(
    (p.initialCapital * (p.positionSize / 100)) / (benchPrice * (1 + fee)),
  );
  const benchCash = p.initialCapital - benchShares * benchPrice * (1 + fee);
  const sell = (bar: OhlcvBar, rawPrice: number, forcedExit = false) => {
    if (!shares || !entry) return;
    const price = rawPrice * (1 - slip),
      exitFee = shares * price * fee;
    const proceeds = shares * price - exitFee,
      pnl = proceeds - entry.cost;
    trades.push({
      entryDate: entry.date,
      entryPrice: money(entry.price),
      exitDate: bar.date,
      exitPrice: money(price),
      shares,
      pnl: money(pnl),
      pnlPct: Number(((pnl / entry.cost) * 100).toFixed(4)),
      fees: money(entry.fee + exitFee),
      holdingDays: Math.round(
        (Date.parse(bar.date) - Date.parse(entry.date)) / 86400000,
      ),
      forcedExit,
    });
    totalFees += exitFee;
    cash += proceeds;
    shares = 0;
    entry = null;
  };
  for (const { bar, index } of selected) {
    let signal: "BUY" | "SELL" | "HOLD" = "HOLD";
    // Neither today's close nor any later observation participates in today's decision.
    const short = sma(index - 1, p.shortWindow),
      long = sma(index - 1, p.longWindow),
      prevShort = sma(index - 2, p.shortWindow),
      prevLong = sma(index - 2, p.longWindow);
    if (
      short !== null &&
      long !== null &&
      prevShort !== null &&
      prevLong !== null
    ) {
      if (short > long && prevShort <= prevLong && shares === 0) {
        const price = bar.open * (1 + slip);
        const budget = Math.min(
          cash,
          ((cash + shares * bar.open) * p.positionSize) / 100,
        );
        const qty = Math.floor(budget / (price * (1 + fee)));
        if (qty > 0) {
          const entryFee = qty * price * fee;
          const cost = qty * price + entryFee;
          cash -= cost;
          shares = qty;
          totalFees += entryFee;
          entry = { date: bar.date, price, cost, fee: entryFee };
          signal = "BUY";
        }
      } else if (short < long && prevShort >= prevLong && shares > 0) {
        sell(bar, bar.open);
        signal = "SELL";
      }
    }
    equityCurve.push({
      date: bar.date,
      close: bar.close,
      shortSma: sma(index, p.shortWindow),
      longSma: sma(index, p.longWindow),
      signal,
      cash: money(cash),
      shares,
      equity: money(cash + shares * bar.close),
      benchmark: money(benchCash + benchShares * bar.close),
    });
  }
  const last = selected.at(-1)!.bar;
  if (shares) {
    sell(last, last.close, true);
    const point = equityCurve.at(-1)!;
    point.signal = "SELL";
    point.cash = money(cash);
    point.shares = 0;
    point.equity = money(cash);
  }
  const benchmarkEnding =
    benchCash + benchShares * last.close * (1 - slip) * (1 - fee);
  equityCurve.at(-1)!.benchmark = money(benchmarkEnding);
  let peak = p.initialCapital,
    maxDD = 0;
  const returns: number[] = [];
  let previous = p.initialCapital;
  for (const point of equityCurve) {
    peak = Math.max(peak, point.equity);
    maxDD = Math.max(maxDD, (peak - point.equity) / peak);
    returns.push(point.equity / previous - 1);
    previous = point.equity;
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.length > 1
      ? returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) /
        (returns.length - 1)
      : 0;
  const volatility = Math.sqrt(variance) * Math.sqrt(252);
  const years =
    (Date.parse(last.date) - Date.parse(first.date)) / 86400000 / 365.25;
  const summary = {
    totalReturnPct: money((cash / p.initialCapital - 1) * 100),
    cagr:
      years > 0
        ? money(((cash / p.initialCapital) ** (1 / years) - 1) * 100)
        : 0,
    maxDrawdownPct: money(maxDD * 100),
    winRatePct: trades.length
      ? money((trades.filter((t) => t.pnl > 0).length / trades.length) * 100)
      : 0,
    totalTrades: trades.length,
    endingCapital: money(cash),
    totalFees: money(totalFees),
    volatilityPct: money(volatility * 100),
    sharpeRatio:
      volatility > 0 ? Number(((mean * 252) / volatility).toFixed(4)) : null,
    buyAndHoldReturnPct: money((benchmarkEnding / p.initialCapital - 1) * 100),
    benchmarkEndingCapital: money(benchmarkEnding),
  };
  return {
    success: true,
    symbol: p.symbol,
    parameters: p,
    summary,
    trades,
    equityCurve,
    metadata: {
      strategyVersion: STRATEGY_VERSION,
      firstDate: first.date,
      lastDate: last.date,
      observations: selected.length,
      dataHash: createHash("sha256").update(JSON.stringify(bars)).digest("hex"),
      assumptions: [
        "Signals use previous-close data; orders fill at next observed open.",
        "Whole shares; one long position; position size applies to account equity.",
        "Costs are charged on entry and exit; adverse slippage applies on both sides.",
        "Open positions are liquidated at the final close; benchmark uses matching allocation and costs.",
        "Risk-free rate is 0%; annualisation uses 252 trading days. Taxes, dividends and corporate-action cash flows are not modelled.",
        "Current supported symbols are used; historical index membership and survivorship bias are not reconstructed.",
      ],
    },
  };
}
export async function runBacktest(params: BacktestParams) {
  const source = await loadBacktestHistory(params.symbol);
  const result = simulateBacktest(params, source.data as OhlcvBar[]);
  return {
    ...result,
    metadata: { ...result.metadata, dataSource: source.key, provenance: source.provenance },
  };
}
