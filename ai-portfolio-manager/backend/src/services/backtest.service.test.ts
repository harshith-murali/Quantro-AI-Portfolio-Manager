import test from "node:test";
import assert from "node:assert/strict";
import { simulateBacktest } from "./backtest.service";
const makeBars = (closes: number[]) =>
  closes.map((close, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, "0")}`,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1000,
    symbol: "TCS",
  }));
const params = {
  symbol: "TCS",
  shortWindow: 2,
  longWindow: 3,
  initialCapital: 1000,
  positionSize: 100,
  transactionCostPct: 0,
  slippagePct: 0,
};
test("SMA signals fill at the following open, not at the signal close", () => {
  const bars = makeBars([10, 9, 8, 9, 12, 11, 7, 8, 12]);
  bars[5].open = 20;
  const result = simulateBacktest(params, bars);
  assert.equal(result.trades[0].entryDate, "2026-01-06");
  assert.equal(result.trades[0].entryPrice, 20);
  assert.equal(result.trades[0].exitDate, "2026-01-08");
  assert.equal(result.trades[0].exitPrice, 8);
  assert.equal(result.trades[0].shares, 50);
  assert.equal(result.trades[0].pnl, -600);
});
test("costs, adverse slippage and whole-share position sizing affect real cash flows", () => {
  const bars = makeBars([10, 9, 8, 9, 12, 15, 20, 25]);
  const zero = simulateBacktest(params, bars),
    costly = simulateBacktest(
      { ...params, transactionCostPct: 1, slippagePct: 1 },
      bars,
    ),
    small = simulateBacktest({ ...params, positionSize: 25 }, bars);
  assert.ok(costly.summary.totalFees > 0);
  assert.ok(costly.summary.endingCapital < zero.summary.endingCapital);
  assert.equal(small.trades[0].shares, 16);
  assert.ok(small.equityCurve.every((p) => p.cash >= 0));
  const trade = costly.trades[0];
  assert.equal(trade.entryPrice, 15.15);
  assert.equal(trade.exitPrice, 24.75);
  assert.ok(
    Math.abs(
      trade.pnl -
        (trade.shares * (trade.exitPrice - trade.entryPrice) - trade.fees),
    ) < 0.02,
  );
});
test("changing future data cannot change earlier execution decisions", () => {
  const bars = makeBars([10, 9, 8, 9, 12, 15, 20, 25]),
    changed = structuredClone(bars);
  changed[7].close = 100;
  changed[7].high = 101;
  const first = simulateBacktest(params, bars),
    second = simulateBacktest(params, changed);
  assert.deepEqual(
    first.equityCurve.slice(0, 7),
    second.equityCurve.slice(0, 7),
  );
  assert.equal(first.trades[0].entryDate, second.trades[0].entryDate);
});
test("date range uses prior observations for indicator warmup and includes matching costed benchmark", () => {
  const bars = makeBars([10, 9, 8, 9, 12, 15, 20, 25]);
  const result = simulateBacktest(
    { ...params, startDate: "2026-01-06", endDate: "2026-01-08" },
    bars,
  );
  assert.equal(result.trades[0].entryDate, "2026-01-06");
  assert.equal(result.equityCurve.length, 3);
  assert.equal(result.summary.benchmarkEndingCapital, 1660);
  assert.equal(result.metadata.firstDate, "2026-01-06");
});
test("repeat runs are deterministic, flat series have no trades, and invalid inputs fail", () => {
  const bars = makeBars([10, 9, 8, 9, 12, 15, 20, 25]);
  assert.deepEqual(
    simulateBacktest(params, bars),
    simulateBacktest(params, bars),
  );
  const flat = simulateBacktest(params, makeBars(Array(15).fill(10)));
  assert.equal(flat.summary.totalTrades, 0);
  assert.equal(flat.summary.totalReturnPct, 0);
  assert.equal(flat.summary.sharpeRatio, null);
  for (const invalid of [
    { shortWindow: 4, longWindow: 3 },
    { initialCapital: -1 },
    { slippagePct: -1 },
    { positionSize: 101 },
    { startDate: "2026-01-30", endDate: "2026-01-01" },
  ])
    assert.throws(() => simulateBacktest({ ...params, ...invalid }, bars));
});
