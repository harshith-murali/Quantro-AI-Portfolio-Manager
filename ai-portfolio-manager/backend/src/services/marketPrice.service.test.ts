import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOhlcvCsv, getYahooMarketPrice } from '@/services/marketPrice.service';

test('parseOhlcvCsv keeps only valid positive-price OHLCV rows', () => {
  const csv = [
    'Date,Open,High,Low,Close,Adj Close,Volume,Symbol',
    '2026-07-28,100,110,90,105,105,1000,RELIANCE',
    '2026-07-29,0,110,90,105,105,1000,RELIANCE',
    '2026-07-30,105,120,100,115,115,1500,RELIANCE',
  ].join('\n');

  const rows = parseOhlcvCsv(csv, 'RELIANCE');

  assert.equal(rows.length, 2);
  assert.equal(rows[0].date, '2026-07-28');
  assert.equal(rows[1].close, 115);
});

test('Yahoo execution prices normalize NSE symbols and preserve source and market date', async () => {
  const now = new Date();
  const result = await getYahooMarketPrice('tcs.ns', async ticker => {
    assert.equal(ticker, 'TCS.NS');
    return { symbol: ticker, currency: 'INR', regularMarketPrice: 2460.9, regularMarketPreviousClose: 2465, regularMarketTime: now };
  });
  assert.deepEqual(result, { symbol: 'TCS', price: 2460.9, previousClose: 2465, marketDate: now.toISOString().slice(0, 10), source: 'YAHOO_FINANCE:TCS.NS' });
  const legacy = await getYahooMarketPrice('LARSEN', async ticker => {
    assert.equal(ticker, 'LT.NS');
    return { symbol: ticker, currency: 'INR', regularMarketPrice: 3500, regularMarketTime: now };
  });
  assert.equal(legacy.symbol, 'LT');
});

test('execution prices reject missing, stale, foreign-currency, mismatched and invalid provider quotes', async () => {
  const valid = { symbol: 'TCS.NS', currency: 'INR', regularMarketPrice: 2460.9, regularMarketTime: new Date() };
  for (const quote of [
    { ...valid, currency: 'USD' },
    { ...valid, symbol: 'INFY.NS' },
    { ...valid, regularMarketPrice: 0 },
    { ...valid, regularMarketPrice: -1 },
    { ...valid, regularMarketPrice: NaN },
    { ...valid, regularMarketPrice: Infinity },
    { ...valid, regularMarketTime: undefined },
    { ...valid, regularMarketTime: new Date('2000-01-01') },
    { ...valid, regularMarketTime: new Date(Date.now() + 120_000) },
  ]) {
    await assert.rejects(getYahooMarketPrice('TCS', async () => quote), { statusCode: 503 });
  }
  await assert.rejects(getYahooMarketPrice('TCS', async () => { throw new Error('Network unavailable'); }), /No order was placed/);
  await assert.rejects(getYahooMarketPrice('INVALID', async () => { assert.fail('Unsupported stocks must not contact the provider'); }), { statusCode: 400 });
});
