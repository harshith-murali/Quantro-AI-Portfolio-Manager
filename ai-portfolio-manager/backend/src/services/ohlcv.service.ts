import { GetObjectCommand } from '@aws-sdk/client-s3';
import { parse } from 'csv-parse/sync';
import { s3Client } from '@/config/s3';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

export const S3_MARKET_DATA_KEYS: Record<string, string> = {
  RELIANCE_NS: 'market-data/individual/RELIANCE_NS_2021-05-14_to_2026-05-14.csv',
  INFY_NS: 'market-data/individual/INFY_NS_2021-05-14_to_2026-05-14.csv',
  TCS_NS: 'market-data/individual/TCS_NS_2021-05-14_to_2026-05-14.csv',
  NIFTYBEES_NS: 'market-data/individual/NIFTYBEES_NS_2021-05-14_to_2026-05-14.csv',
};

export const S3_RECOMMENDATION_KEYS: Record<string, string> = {
  RELIANCE_NS: 'market-data/recommendations/RELIANCE_NS_recommendation.csv',
  INFY_NS: 'market-data/recommendations/INFY_NS_recommendation.csv',
  TCS_NS: 'market-data/recommendations/TCS_NS_recommendation.csv',
  ALL: 'market-data/recommendations/all_recommendations.csv',
};

export const S3_SUMMARY_KEY = 'market-data/summary/summary_2021-05-14_to_2026-05-14.csv';

export async function getS3ObjectAsString(key: string): Promise<string> {
  const bucket = env.AWS_S3_BUCKET;

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error(`Empty response body for S3 object: ${key}`);
  }

  return response.Body.transformToString();
}

export async function fetchAndParseOHLCV(symbol: string) {
  const key = S3_MARKET_DATA_KEYS[symbol];

  if (!key) {
    return { error: `Symbol ${symbol} is not supported`, status: 404 };
  }

  try {
    const csvContent = await getS3ObjectAsString(key);

    const rawRecords = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const data = (rawRecords as any[]).map((record: any) => ({
      date: record.Date,
      open: Number(record.Open),
      high: Number(record.High),
      low: Number(record.Low),
      close: Number(record.Close),
      adjClose: Number(record['Adj Close']),
      volume: Number(record.Volume),
      symbol: record.Symbol,
    }));

    return { data, key };
  } catch (error) {
    logger.error('Error fetching or parsing S3 OHLCV data', { error, symbol, key });
    return { error: 'Internal Server Error while processing market data', status: 500 };
  }
}

export async function fetchAndParseRecommendations(symbol: string) {
  const key = S3_RECOMMENDATION_KEYS[symbol];

  if (!key) {
    return { error: `Symbol ${symbol} is not supported for recommendations`, status: 404 };
  }

  try {
    const csvContent = await getS3ObjectAsString(key);

    const rawRecords = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return { data: rawRecords, key };
  } catch (error) {
    logger.error('Error fetching or parsing S3 recommendation data', { error, symbol, key });
    return { error: 'Internal Server Error while processing recommendations', status: 500 };
  }
}

export async function fetchAndParseSummary() {
  const key = S3_SUMMARY_KEY;

  try {
    const csvContent = await getS3ObjectAsString(key);

    const rawRecords = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return { data: rawRecords, key };
  } catch (error) {
    logger.error('Error fetching or parsing S3 summary data', { error, key });
    return { error: 'Internal Server Error while processing summary data', status: 500 };
  }
}

/**
 * Returns the latest NIFTY 50 proxy (NIFTYBEES_NS) close price and 1-day % change.
 * NIFTYBEES is a NIFTY 50 ETF that tracks the index closely.
 * Falls back to the most recent available date if today's data is not yet published.
 */
export async function getNiftyLatest(): Promise<{
  symbol: string;
  date: string;
  close: number;
  prevClose: number;
  changePct: number;
  history: { date: string; close: number }[];
}> {
  const key = S3_MARKET_DATA_KEYS['NIFTYBEES_NS'];
  if (!key) throw new Error('NIFTYBEES_NS S3 key not configured');

  const csvContent = await getS3ObjectAsString(key);

  const rawRecords = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as any[];

  // Sort ascending by date
  const sorted = rawRecords
    .map((r: any) => ({
      date: r.Date as string,
      close: Number(r.Close),
    }))
    .filter(r => !isNaN(r.close) && r.close > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length < 2) throw new Error('Insufficient NIFTYBEES_NS data');

  const latest  = sorted[sorted.length - 1];
  const prev    = sorted[sorted.length - 2];
  const changePct = ((latest.close - prev.close) / prev.close) * 100;

  // Return last 90 days of history for the benchmark chart
  const history = sorted.slice(-90);

  return {
    symbol: 'NIFTY 50 (via NIFTYBEES)',
    date: latest.date,
    close: Number(latest.close.toFixed(2)),
    prevClose: Number(prev.close.toFixed(2)),
    changePct: Number(changePct.toFixed(2)),
    history,
  };
}

