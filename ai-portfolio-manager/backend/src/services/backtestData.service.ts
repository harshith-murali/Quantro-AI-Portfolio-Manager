import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';
import { normalizeSymbol } from '@/utils/symbol';
import { NIFTY_50_SET } from '@/constants/nifty50';
import { ETF_SET } from '@/constants/etfs';
import { getS3ObjectAsString } from '@/services/ohlcv.service';
import { loadYahooHistory } from '@/services/marketHistory.service';
import type { OhlcvBar } from '@/services/marketPrice.service';

const assetSchema = z.object({ symbol: z.string(), key: z.string(), rows: z.number().int().positive(), firstDate: z.string(), lastDate: z.string(), sha256: z.string().regex(/^[a-f0-9]{64}$/), currency: z.literal('INR') });
const manifestSchema = z.object({ version: z.literal(1), source: z.literal('Yahoo Finance'), bucket: z.string(), fetchedAt: z.string().datetime(), interval: z.literal('1d'), assets: z.array(assetSchema) });
type Loader = (key: string) => Promise<string>;
const cache = new Map<string, { expires: number; result: BacktestHistory }>();
export interface BacktestHistory {
  data: OhlcvBar[];
  key: string;
  provenance: { provider: 's3' | 'yahoo'; origin: 'Yahoo Finance'; snapshot?: string; datasetSha256?: string; firstDate?: string; lastDate?: string; observations?: number };
}
function supported(input: string) {
  const symbol = normalizeSymbol(input);
  if (!NIFTY_50_SET.has(symbol) && !ETF_SET.has(symbol)) throw new AppError(`Unsupported backtest symbol: ${input}`, 400);
  return symbol;
}
export function parseSnapshotCsv(text: string, symbol: string): OhlcvBar[] {
  const records = parse(text, { columns: true, skip_empty_lines: true, trim: true }) as Record<string,string>[];
  let previous = '';
  return records.map(r => {
    const date = r.Date;
    const numbers = [r.Open,r.High,r.Low,r.Close,r['Adj Close'],r.Volume];
    if (!numbers.every(v => typeof v === 'string' && v.trim() !== '')) throw new AppError('Historical snapshot has missing values.', 502);
    const [open,high,low,close,adjClose,volume] = numbers.map(Number);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date || date <= previous || date >= new Date().toISOString().slice(0,10) || normalizeSymbol(r.Symbol || '') !== symbol || ![open,high,low,close,adjClose].every(v => Number.isFinite(v) && v > 0) || !Number.isFinite(volume) || volume < 0 || high + 0.01 < Math.max(open,close,low) || low - 0.01 > Math.min(open,close,high)) throw new AppError('Historical snapshot contains invalid, duplicate or incomplete daily bars.', 502);
    previous = date;
    return { date,open,high,low,close,adjClose,volume,symbol };
  });
}
export async function loadS3BacktestHistory(input: string, manifestKey: string, load: Loader = getS3ObjectAsString): Promise<BacktestHistory> {
  const symbol = supported(input);
  const cacheKey = `${env.AWS_S3_BUCKET}:${manifestKey}:${symbol}`;
  const hit = cache.get(cacheKey);
  if (load === getS3ObjectAsString && hit && hit.expires > Date.now()) return hit.result;
  try {
    const manifest = manifestSchema.parse(JSON.parse(await load(manifestKey)));
    if (manifest.bucket !== env.AWS_S3_BUCKET) throw new AppError('Historical snapshot bucket does not match configuration.', 502);
    const asset = manifest.assets.find(a => a.symbol === symbol);
    if (!asset) throw new AppError(`No Yahoo Finance history for ${symbol} in the configured S3 snapshot.`, 404);
    const prefix = manifestKey.slice(0, manifestKey.lastIndexOf('/'));
    if (asset.key !== `${prefix}/ohlcv/${symbol}.csv`) throw new AppError('Historical snapshot has an unexpected object key.', 502);
    const csv = await load(asset.key);
    if (createHash('sha256').update(csv).digest('hex') !== asset.sha256) throw new AppError('Historical snapshot checksum verification failed.', 502);
    const data = parseSnapshotCsv(csv, symbol);
    if (data.length !== asset.rows || data[0]?.date !== asset.firstDate || data.at(-1)?.date !== asset.lastDate) throw new AppError('Historical snapshot coverage does not match its manifest.', 502);
    const result: BacktestHistory = { data, key: `s3://${env.AWS_S3_BUCKET}/${asset.key}`, provenance: { provider: 's3', origin: 'Yahoo Finance', snapshot: manifest.fetchedAt, datasetSha256: asset.sha256, firstDate: asset.firstDate, lastDate: asset.lastDate, observations: data.length } };
    if (load === getS3ObjectAsString) cache.set(cacheKey, { expires: Date.now() + 900000, result });
    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('S3 historical data is unavailable. Check the configured snapshot and EC2 read permissions.', 503);
  }
}
export async function loadBacktestHistory(input: string): Promise<BacktestHistory> {
  const symbol = supported(input);
  if (env.BACKTEST_DATA_PROVIDER === 's3') {
    if (!env.BACKTEST_S3_MANIFEST_KEY) throw new AppError('S3 backtesting needs BACKTEST_S3_MANIFEST_KEY.', 503);
    return loadS3BacktestHistory(symbol, env.BACKTEST_S3_MANIFEST_KEY);
  }
  return { data: await loadYahooHistory(symbol), key: `YAHOO_FINANCE:${symbol}`, provenance: { provider: 'yahoo', origin: 'Yahoo Finance' } };
}
