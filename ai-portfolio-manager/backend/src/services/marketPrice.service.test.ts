import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOhlcvCsv } from '@/services/marketPrice.service';

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
