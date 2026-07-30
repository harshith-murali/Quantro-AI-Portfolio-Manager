import { NIFTY_50_SYMBOLS } from '@/constants/nifty50';
import { getOhlcvBars } from '@/services/marketPrice.service';

export type TechnicalSignal = 'BUY' | 'HOLD' | 'SELL';

export interface StockSignal {
  symbol: string;
  signal: TechnicalSignal;
  suitabilityScore: number;
  suggestedAllocation: number;
  currentPrice: number;
  previousClose: number | null;
  changePercent: number;
  rsi: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  latestVolume: number;
  averageVolume: number | null;
  marketDate: string;
  dataSource: string;
  rationale: string;
}

function round(value: number | null, decimals = 2): number | null {
  return value === null ? null : Number(value.toFixed(decimals));
}

function sma(values: number[], window: number): number | null {
  if (values.length < window) return null;
  const slice = values.slice(-window);
  return slice.reduce((sum, value) => sum + value, 0) / window;
}

function emaSeries(values: number[], window: number): number[] {
  if (values.length < window) return [];
  const multiplier = 2 / (window + 1);
  const series: number[] = [];
  let previous = values.slice(0, window).reduce((sum, value) => sum + value, 0) / window;
  series.push(previous);
  for (const value of values.slice(window)) {
    previous = (value - previous) * multiplier + previous;
    series.push(previous);
  }
  return series;
}

function latestEma(values: number[], window: number): number | null {
  return emaSeries(values, window).at(-1) ?? null;
}

function rsi(values: number[], window = 14): number | null {
  if (values.length <= window) return null;
  let gains = 0;
  let losses = 0;
  const changes = values.slice(1).map((value, index) => value - values[index]);
  for (const change of changes.slice(-window)) {
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }
  if (losses === 0) return 100;
  return 100 - 100 / (1 + gains / losses);
}

function macd(values: number[]): { macd: number | null; signal: number | null; histogram: number | null } {
  const ema12 = emaSeries(values, 12);
  const ema26 = emaSeries(values, 26);
  if (ema12.length === 0 || ema26.length === 0) return { macd: null, signal: null, histogram: null };
  const alignedEma12 = ema12.slice(ema12.length - ema26.length);
  const macdLine = ema26.map((value, index) => alignedEma12[index] - value);
  const signalSeries = emaSeries(macdLine, 9);
  const latestMacd = macdLine.at(-1) ?? null;
  const latestSignal = signalSeries.at(-1) ?? null;
  return {
    macd: latestMacd,
    signal: latestSignal,
    histogram: latestMacd !== null && latestSignal !== null ? latestMacd - latestSignal : null,
  };
}

function average(values: number[], window: number): number | null {
  if (values.length < window) return null;
  const slice = values.slice(-window);
  return slice.reduce((sum, value) => sum + value, 0) / window;
}

function decideSignal(input: {
  latestClose: number;
  rsi14: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  macdHistogram: number | null;
  latestVolume: number;
  averageVolume: number | null;
}): { signal: TechnicalSignal; score: number; rationale: string } {
  let score = 50;
  const reasons: string[] = [];

  if (input.rsi14 !== null && input.rsi14 < 35) { score += 15; reasons.push('RSI shows oversold conditions'); }
  if (input.rsi14 !== null && input.rsi14 > 70) { score -= 20; reasons.push('RSI is overbought'); }
  if (input.sma20 !== null && input.sma50 !== null && input.sma20 > input.sma50) { score += 15; reasons.push('short-term trend is above medium-term trend'); }
  if (input.sma20 !== null && input.sma50 !== null && input.sma20 < input.sma50) { score -= 15; reasons.push('short-term trend is below medium-term trend'); }
  if (input.sma200 !== null && input.latestClose > input.sma200) { score += 10; reasons.push('price is above the 200-day average'); }
  if (input.sma200 !== null && input.latestClose < input.sma200) { score -= 10; reasons.push('price is below the 200-day average'); }
  if (input.macdHistogram !== null && input.macdHistogram > 0) { score += 10; reasons.push('MACD momentum is positive'); }
  if (input.macdHistogram !== null && input.macdHistogram < 0) { score -= 10; reasons.push('MACD momentum is negative'); }
  if (input.averageVolume !== null && input.latestVolume > input.averageVolume * 1.2) { score += 5; reasons.push('volume is above recent average'); }

  const bounded = Math.max(0, Math.min(100, score));
  return {
    signal: bounded >= 65 ? 'BUY' : bounded <= 35 ? 'SELL' : 'HOLD',
    score: bounded,
    rationale: reasons.length > 0 ? reasons.join('; ') : 'Indicators are mixed, so the signal remains neutral',
  };
}

export async function getTechnicalSignal(symbol: string): Promise<StockSignal> {
  const { symbol: normalized, source, bars } = await getOhlcvBars(symbol);
  const closes = bars.map((bar) => bar.close);
  const volumes = bars.map((bar) => bar.volume);
  const latest = bars[bars.length - 1];
  const previous = bars.length > 1 ? bars[bars.length - 2] : null;
  const latestMacd = macd(closes);
  const rsi14 = rsi(closes, 14);
  const latestSma20 = sma(closes, 20);
  const latestSma50 = sma(closes, 50);
  const latestSma200 = sma(closes, 200);
  const latestEma12 = latestEma(closes, 12);
  const latestEma26 = latestEma(closes, 26);
  const averageVolume = average(volumes, 20);
  const decision = decideSignal({
    latestClose: latest.close,
    rsi14,
    sma20: latestSma20,
    sma50: latestSma50,
    sma200: latestSma200,
    macdHistogram: latestMacd.histogram,
    latestVolume: latest.volume,
    averageVolume,
  });
  const changePercent = previous ? ((latest.close - previous.close) / previous.close) * 100 : 0;

  return {
    symbol: normalized,
    signal: decision.signal,
    suitabilityScore: decision.score,
    suggestedAllocation: decision.signal === 'BUY' ? decision.score * 500 : 0,
    currentPrice: round(latest.close) ?? latest.close,
    previousClose: previous ? round(previous.close) : null,
    changePercent: Number(changePercent.toFixed(2)),
    rsi: round(rsi14),
    sma20: round(latestSma20),
    sma50: round(latestSma50),
    sma200: round(latestSma200),
    ema12: round(latestEma12),
    ema26: round(latestEma26),
    macd: round(latestMacd.macd),
    macdSignal: round(latestMacd.signal),
    macdHistogram: round(latestMacd.histogram),
    latestVolume: latest.volume,
    averageVolume: round(averageVolume),
    marketDate: latest.date,
    dataSource: source,
    rationale: decision.rationale,
  };
}

export async function listTechnicalSignals(limit = 50): Promise<StockSignal[]> {
  const signals: StockSignal[] = [];
  for (const symbol of NIFTY_50_SYMBOLS.slice(0, limit)) {
    try {
      signals.push(await getTechnicalSignal(symbol));
    } catch {
      // Detail endpoint returns concrete data-coverage errors for a requested symbol.
    }
  }
  return signals.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}
