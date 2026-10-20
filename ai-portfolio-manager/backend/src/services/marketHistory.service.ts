import YahooFinance from "yahoo-finance2";
import { ETF_SET } from "@/constants/etfs";
import { normalizeSupportedSymbol, normalizeSymbol } from "@/utils/symbol";
import { AppError } from "@/utils/AppError";
import type { OhlcvBar } from "@/services/marketPrice.service";

const yahoo = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const cache = new Map<string, { expires: number; bars: OhlcvBar[] }>();
const pending = new Map<string, Promise<OhlcvBar[]>>();

/** Three years of observed daily prices, shared by signals, charts and backtests. */
export async function loadYahooHistory(input: string): Promise<OhlcvBar[]> {
  const normalized = normalizeSymbol(input);
  const symbol =
    normalized === "^NSEI" || ETF_SET.has(normalized)
      ? normalized
      : normalizeSupportedSymbol(normalized);
  const hit = cache.get(symbol);
  if (hit && hit.expires > Date.now()) return hit.bars;
  const existing = pending.get(symbol);
  if (existing) return existing;
  const request = (async () => {
    try {
      const ticker = symbol === "^NSEI" ? symbol : `${symbol}.NS`;
      const period1 = new Date();
      period1.setUTCFullYear(period1.getUTCFullYear() - 3);
      const result = await yahoo.chart(
        ticker,
        { period1, interval: "1d" },
        { fetchOptions: { signal: AbortSignal.timeout(20_000) } },
      );
      const bars = result.quotes
        .filter((q) => q.open && q.high && q.low && q.close && q.date)
        .map((q) => ({
          date: q.date.toISOString().slice(0, 10),
          open: Number(q.open),
          high: Number(q.high),
          low: Number(q.low),
          close: Number(q.close),
          adjClose: Number(q.adjclose ?? q.close),
          volume: Number(q.volume ?? 0),
          symbol,
        }))
        .filter(
          (q) =>
            [q.open, q.high, q.low, q.close].every(
              (value) => Number.isFinite(value) && value > 0,
            ) && q.date <= new Date().toISOString().slice(0, 10),
        )
        .sort((a, b) => a.date.localeCompare(b.date));
      if (bars.length < 2) throw new Error("Insufficient history");
      cache.set(symbol, { bars, expires: Date.now() + 900_000 });
      return bars;
    } catch {
      throw new AppError(
        `Historical prices for ${symbol} are temporarily unavailable. Please retry.`,
        503,
      );
    } finally {
      pending.delete(symbol);
    }
  })();
  pending.set(symbol, request);
  return request;
}
