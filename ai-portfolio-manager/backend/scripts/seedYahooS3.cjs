/* Fetch observed Yahoo daily history, validate it, and upload a private immutable S3 snapshot.
 * Run after npm run build. Uses the normal AWS credential chain; never embeds keys.
 * AWS_REGION=ap-southeast-2 AWS_S3_BUCKET=amzn-test-1103 node scripts/seedYahooS3.cjs
 */
const YahooFinance = require('yahoo-finance2').default;
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createHash } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { NIFTY_50_SYMBOLS } = require('../dist/constants/nifty50');
const { ETF_SYMBOLS } = require('../dist/constants/etfs');
const yahoo = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const bucket = process.env.AWS_S3_BUCKET || 'amzn-test-1103';
const region = process.env.AWS_REGION || 'ap-southeast-2';
const s3 = new S3Client({ region });
const fetchedAt = new Date().toISOString();
const end = new Date(fetchedAt.slice(0, 10) + 'T00:00:00Z');
const start = new Date(end); start.setUTCFullYear(start.getUTCFullYear() - 5);
const snapshot = fetchedAt.replace(/[:.]/g, '-');
const prefix = `market-data/yahoo/${snapshot}`;
const output = process.env.DATA_OUTPUT_DIR || `/tmp/quantro-yahoo-${snapshot}`;
const symbols = [...new Set([...NIFTY_50_SYMBOLS, ...ETF_SYMBOLS])].sort();
const digest = value => createHash('sha256').update(value).digest('hex');
async function fetchSymbol(symbol) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await yahoo.chart(`${symbol}.NS`, { period1: start, period2: end, interval: '1d' }, { fetchOptions: { signal: AbortSignal.timeout(30000) } });
      if (result.meta.currency !== 'INR') throw new Error('Expected INR market data');
      const byDate = new Map(); let rejectedRows = 0;
      for (const q of result.quotes) {
        const date = q.date?.toISOString().slice(0, 10);
        if (!date || date < start.toISOString().slice(0, 10) || date >= end.toISOString().slice(0, 10)) continue;
        const values = [q.open, q.high, q.low, q.close];
        if (!values.every(v => typeof v === 'number' && Number.isFinite(v) && v > 0) || !Number.isFinite(q.volume) || q.volume < 0 || q.high + 0.01 < Math.max(q.open, q.close, q.low) || q.low - 0.01 > Math.min(q.open, q.close, q.high)) { rejectedRows++; continue; }
        byDate.set(date, [date, q.open, q.high, q.low, q.close, q.adjclose ?? q.close, q.volume, symbol].join(','));
      }
      const dates = [...byDate.keys()].sort();
      if (dates.length < 60) throw new Error(`Insufficient valid history: ${dates.length} rows`);
      if (rejectedRows > Math.max(2, result.quotes.length * 0.01)) throw new Error(`Too many invalid price rows: ${rejectedRows}`);
      const csv = 'Date,Open,High,Low,Close,Adj Close,Volume,Symbol\n' + dates.map(d => byDate.get(d)).join('\n') + '\n';
      const key = `${prefix}/ohlcv/${symbol}.csv`;
      await fs.writeFile(path.join(output, symbol + '.csv'), csv);
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: csv, ContentType: 'text/csv', ServerSideEncryption: 'AES256', Metadata: { source: 'yahoo-finance', symbol, sha256: digest(csv), 'fetched-at': fetchedAt } }));
      return { symbol, yahooTicker: `${symbol}.NS`, key, rows: dates.length, firstDate: dates[0], lastDate: dates.at(-1), bytes: Buffer.byteLength(csv), sha256: digest(csv), rejectedRows, currency: 'INR' };
    } catch (e) { lastError = e; if (attempt < 2) await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1500)); }
  }
  throw new Error(lastError?.message || 'Fetch failed');
}
(async () => {
  await fs.mkdir(output, { recursive: true });
  const assets = [], failures = [];
  for (let i = 0; i < symbols.length; i += 3) {
    const batch = await Promise.allSettled(symbols.slice(i, i + 3).map(fetchSymbol));
    batch.forEach((result, j) => { const symbol = symbols[i + j]; if (result.status === 'fulfilled') { assets.push(result.value); console.log(`UPLOADED ${symbol}: ${result.value.rows} rows (${result.value.firstDate} to ${result.value.lastDate})`); } else { failures.push({symbol, error: result.reason.message}); console.log(`FAILED ${symbol}: ${result.reason.message}`); } });
  }
  const manifest = { version: 1, snapshot, source: 'Yahoo Finance', bucket, region, fetchedAt, requestedStart: start.toISOString().slice(0, 10), endExclusive: end.toISOString().slice(0, 10), interval: '1d', assets: assets.sort((a,b) => a.symbol.localeCompare(b.symbol)), failures, assumptions: ['Observed daily OHLCV only; no synthetic rows or forward filling.', 'Only completed dates before the UTC fetch date are included.', 'New listings and delisted symbols can have shorter coverage.', 'Yahoo adjusted close is stored separately; dividend cash flows are not simulated.'] };
  const text = JSON.stringify(manifest, null, 2) + '\n';
  await fs.writeFile(path.join(output, 'manifest.json'), text);
  if (assets.length) await s3.send(new PutObjectCommand({ Bucket: bucket, Key: `${prefix}/manifest.json`, Body: text, ContentType: 'application/json', ServerSideEncryption: 'AES256' }));
  console.log(JSON.stringify({manifestKey: `${prefix}/manifest.json`, uploaded: assets.length, failed: failures.length, output}));
  if (failures.length) process.exitCode = 1;
})().catch(e => { console.error(e.message); process.exitCode = 1; });
