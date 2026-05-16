import { PutObjectCommand } from '@aws-sdk/client-s3';
// @ts-ignore
import yfLib from 'yahoo-finance2';
const yahooFinance = new ((yfLib as any).default || yfLib)();
import { s3Client } from '../config/s3';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { NIFTY_50_SYMBOLS, YAHOO_TICKER_MAP } from '../constants/nifty50';
import { ETF_SYMBOLS } from '../constants/etfs';
import { fetchOHLCVFromS3ByNewKey } from '../services/ohlcv.service';
import { SymbolResult } from '../lib/runStateStore';

export interface MarketDataResult {
  total: number;
  successCount: number;
  symbols: SymbolResult[];
}

export class MarketDataAgent {
  private bucket = env.AWS_S3_BUCKET;
  private symbolsToFetch: string[] = [...NIFTY_50_SYMBOLS, ...ETF_SYMBOLS];

  constructor(private forceOverwrite: boolean = false, private targetDate: Date = new Date()) {}

  async run(): Promise<MarketDataResult> {
    logger.info('MarketDataAgent starting...', { force: this.forceOverwrite, date: this.targetDate });
    
    // We want data up to the target date. yahooFinance.historical needs period1 and period2
    const endDate = new Date(this.targetDate);
    endDate.setDate(endDate.getDate() + 1); // Excusive end date for YF
    
    // Fetch last 1500 days for sufficient history
    const startDate = new Date(this.targetDate);
    startDate.setDate(startDate.getDate() - 1500);

    const results: SymbolResult[] = [];
    let successCount = 0;

    for (const sym of this.symbolsToFetch) {
      const ticker = YAHOO_TICKER_MAP[sym];
      if (!ticker) {
        results.push({ symbol: sym, status: 'ERROR', rowsSaved: 0, message: 'No Yahoo ticker mapped' });
        continue;
      }

      try {
        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

        const history: any[] = await (yahooFinance.historical as any)(ticker, {
          period1: startDate,
          period2: endDate,
          interval: '1d',
        });

        if (!history || history.length === 0) {
          results.push({ symbol: sym, status: 'EMPTY', rowsSaved: 0, message: 'Empty history returned' });
          continue;
        }

        // Format to CSV matching existing structure: Date,Open,High,Low,Close,Adj Close,Volume,Symbol
        const csvLines = ['Date,Open,High,Low,Close,Adj Close,Volume,Symbol'];
        let maxDateStr = '';

        for (const row of history) {
          if (row.close === null || isNaN(row.close)) continue;
          const dateStr = row.date.toISOString().split('T')[0];
          if (dateStr > maxDateStr) maxDateStr = dateStr;
          
          csvLines.push(`${dateStr},${row.open},${row.high},${row.low},${row.close},${row.adjClose || row.close},${row.volume || 0},${sym}`);
        }

        const csvContent = csvLines.join('\n');
        const rowCount = csvLines.length - 1;

        // Guard: check existing
        if (!this.forceOverwrite) {
          const existing = await fetchOHLCVFromS3ByNewKey(sym);
          if (existing && existing.data && existing.data.length > 0) {
            const existingMaxDate = existing.data.reduce((max: string, r: any) => r.date > max ? r.date : max, '');
            if (existingMaxDate >= maxDateStr && existing.data.length >= rowCount) {
              results.push({ symbol: sym, status: 'OK', rowsSaved: existing.data.length, maxDate: existingMaxDate, message: 'Existing data is up-to-date or better' });
              successCount++;
              continue; // Skip upload
            }
          }
        }

        const key = `ohlcv/${sym}.csv`;
        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: csvContent,
          ContentType: 'text/csv',
        });

        await s3Client.send(command);

        results.push({ symbol: sym, status: 'OK', rowsSaved: rowCount, maxDate: maxDateStr });
        successCount++;
        logger.debug(`Uploaded ${sym} (${rowCount} rows, max date ${maxDateStr})`);

      } catch (error: any) {
        logger.error(`Error fetching/uploading data for ${sym}:`, error);
        results.push({ symbol: sym, status: 'ERROR', rowsSaved: 0, message: error.message });
      }
    }

    logger.info('MarketDataAgent finished', { successCount, total: this.symbolsToFetch.length });
    return {
      total: this.symbolsToFetch.length,
      successCount,
      symbols: results,
    };
  }
}
