import { parse } from 'csv-parse/sync';
import { getS3ObjectAsString } from '@/services/ohlcv.service';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';
import { normalizeSupportedSymbol, symbolToS3Key } from '@/utils/symbol';

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
