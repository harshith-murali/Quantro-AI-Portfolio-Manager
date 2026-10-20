import { parse } from 'csv-parse/sync';
import { getS3ObjectAsString } from '@/services/ohlcv.service';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';
import { normalizeSupportedSymbol, symbolToS3Key } from '@/utils/symbol';
import { YAHOO_TICKER_MAP } from '@/constants/nifty50';
import YahooFinance from 'yahoo-finance2';
import { logger } from '@/utils/logger';
import { loadYahooHistory } from '@/services/marketHistory.service';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const quoteCache = new Map<string, { value: MarketPrice; expiresAt: number }>();
const pendingQuotes = new Map<string, Promise<MarketPrice>>();
const QUOTE_CACHE_TTL_MS = 30_000;

export interface OhlcvBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose?: number;
  volume: number;
  symbol: string;
}

export interface MarketPrice {
  symbol: string;
  price: number;
  previousClose: number | null;
  marketDate: string;
  source: string;
}

type CsvLoader = (key: string) => Promise<string>;

interface YahooQuote {
  symbol?: string;
  currency?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketTime?: Date;
}

/** Validate provider identity, currency, price and freshness before execution. */
export async function getYahooMarketPrice(
  symbolInput: string,
  loadQuote: (ticker: string) => Promise<unknown> = ticker => yahooFinance.quote(ticker, {}, { fetchOptions: { signal: AbortSignal.timeout(10_000) } }),
): Promise<MarketPrice> {
  const symbol = normalizeSupportedSymbol(symbolInput);
  const ticker = YAHOO_TICKER_MAP[symbol];
  try {
    const rawQuote = await loadQuote(ticker);
    if (!rawQuote || typeof rawQuote !== 'object') throw new Error('Missing quote');
    const quote = rawQuote as YahooQuote;
    const price = quote.regularMarketPrice;
    const time = quote.regularMarketTime;
    if (quote.symbol !== ticker || quote.currency !== 'INR' || typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
      throw new Error('Invalid symbol, currency or price in quote');
    }
    if (!(time instanceof Date) || !Number.isFinite(time.getTime()) || time.getTime() > Date.now() + 60_000) {
      throw new Error('Invalid quote timestamp');
    }
    const marketDate = time.toISOString().slice(0, 10);
    assertFreshMarketDate(marketDate);
    const previous = quote.regularMarketPreviousClose;
    return {
      symbol,
      price: Number(price.toFixed(2)),
      previousClose: typeof previous === 'number' && Number.isFinite(previous) && previous > 0 ? Number(previous.toFixed(2)) : null,
      marketDate,
      source: `YAHOO_FINANCE:${ticker}`,
    };
  } catch (error) {
    logger.warn('Market quote lookup failed', { symbol, error: error instanceof Error ? error.message : 'Unknown provider error' });
    throw new AppError(`A recent INR market price for ${symbol} is unavailable. No order was placed. Please try again shortly.`, 503);
  }
}

async function getCachedYahooMarketPrice(symbolInput: string): Promise<MarketPrice> {
  const symbol = normalizeSupportedSymbol(symbolInput);
  const cached = quoteCache.get(symbol);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const pending = pendingQuotes.get(symbol);
  if (pending) return pending;
  const request = getYahooMarketPrice(symbol).then(value => {
    quoteCache.set(symbol, { value, expiresAt: Date.now() + QUOTE_CACHE_TTL_MS });
    return value;
  }).finally(() => pendingQuotes.delete(symbol));
  pendingQuotes.set(symbol, request);
  return request;
}

function parseNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function parseOhlcvCsv(csvContent: string, symbol: string): OhlcvBar[] {
  const rawRecords = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  return rawRecords
    .map((record) => ({
      date: record.Date,
      open: parseNumber(record.Open),
      high: parseNumber(record.High),
      low: parseNumber(record.Low),
      close: parseNumber(record.Close),
      adjClose: parseNumber(record['Adj Close']),
      volume: parseNumber(record.Volume),
      symbol,
    }))
    .filter((row) =>
      Boolean(row.date) &&
      row.open > 0 &&
      row.high > 0 &&
      row.low > 0 &&
      row.close > 0 &&
      row.volume >= 0,
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

function assertFreshMarketDate(date: string): void {
  const marketTime = new Date(`${date}T00:00:00.000Z`).getTime();
  if (Number.isNaN(marketTime)) {
    throw new AppError(`Invalid market data date: ${date}`, 502);
  }

  const ageMs = Date.now() - marketTime;
  const maxAgeMs = env.MARKET_DATA_MAX_STALENESS_DAYS * 24 * 60 * 60 * 1000;
  if (ageMs > maxAgeMs) {
    throw new AppError(`Market data is stale for ${date}`, 503);
  }
}

export async function getOhlcvBars(
  symbolInput: string,
  loadCsv: CsvLoader = getS3ObjectAsString,
): Promise<{ symbol: string; source: string; bars: OhlcvBar[] }> {
  const symbol = normalizeSupportedSymbol(symbolInput);
  if (env.MARKET_PRICE_PROVIDER === 'yahoo' && loadCsv === getS3ObjectAsString) {
    return { symbol, source: `YAHOO_FINANCE:${symbol}.NS`, bars: await loadYahooHistory(symbol) };
  }
  const source = symbolToS3Key(symbol);
  const csvContent = await loadCsv(source);
  const bars = parseOhlcvCsv(csvContent, symbol);

  if (bars.length === 0) {
    throw new AppError(`No valid OHLCV rows found for ${symbol}`, 503);
  }

  return { symbol, source, bars };
}

export async function getLatestMarketPrice(
  symbolInput: string,
  loadCsv: CsvLoader = getS3ObjectAsString,
): Promise<MarketPrice> {
  if (env.MARKET_PRICE_PROVIDER === 'yahoo') return getCachedYahooMarketPrice(symbolInput);
  const { symbol, source, bars } = await getOhlcvBars(symbolInput, loadCsv);
  const latest = bars[bars.length - 1];
  const previous = bars.length > 1 ? bars[bars.length - 2] : null;

  assertFreshMarketDate(latest.date);

  return {
    symbol,
    price: Number(latest.close.toFixed(2)),
    previousClose: previous ? Number(previous.close.toFixed(2)) : null,
    marketDate: latest.date,
    source,
  };
}
