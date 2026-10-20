import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { env } from '@/config/env';
import { loadS3BacktestHistory, parseSnapshotCsv } from './backtestData.service';
const header = 'Date,Open,High,Low,Close,Adj Close,Volume,Symbol\n';
const csv = header + '2025-01-02,100,110,95,105,105,1000,TCS\n2025-01-03,105,115,100,110,110,1200,TCS\n';
const key = 'market-data/yahoo/test/manifest.json';
const dataKey = 'market-data/yahoo/test/ohlcv/TCS.csv';
const manifest = () => ({version:1,source:'Yahoo Finance',bucket:env.AWS_S3_BUCKET,fetchedAt:'2025-01-04T00:00:00.000Z',interval:'1d',assets:[{symbol:'TCS',key:dataKey,rows:2,firstDate:'2025-01-02',lastDate:'2025-01-03',sha256:createHash('sha256').update(csv).digest('hex'),currency:'INR'}]});
test('S3 history normalizes aliases and preserves validated Yahoo provenance', async()=>{
 const calls:string[]=[]; const result=await loadS3BacktestHistory('TCS_NS',key,async k=>{calls.push(k);return k===key?JSON.stringify(manifest()):csv});
 assert.deepEqual(calls,[key,dataKey]); assert.equal(result.data.length,2);assert.equal(result.data[1].close,110);assert.equal(result.provenance.provider,'s3');assert.equal(result.provenance.origin,'Yahoo Finance');assert.equal(result.key,`s3://${env.AWS_S3_BUCKET}/${dataKey}`);
});
test('S3 history rejects tampering, wrong bucket, coverage and key mismatches',async()=>{
 for(const change of ['hash','bucket','coverage','key']) {
  const m=manifest();if(change==='bucket')m.bucket='wrong-bucket';if(change==='coverage')m.assets[0].rows=3;if(change==='key')m.assets[0].key='private/other.csv';
  await assert.rejects(loadS3BacktestHistory('TCS',key,async k=>k===key?JSON.stringify(m):change==='hash'?csv+'\n':csv));
 }
 await assert.rejects(loadS3BacktestHistory('INFY',key,async()=>JSON.stringify(manifest())),/No Yahoo Finance history/);
});
test('Historical snapshots reject impossible bars, blank prices, duplicate dates and wrong symbols',()=>{
 for(const invalid of [csv.replace(',100,110,95,105,',',100,90,95,105,'),csv.replace(',100,110,',',,110,'),csv.replace('2025-01-03','2025-01-02'),csv.replaceAll(',TCS',',INFY'),csv.replace(',105,105,1000,',',NaN,105,1000,')]) assert.throws(()=>parseSnapshotCsv(invalid,'TCS'));
});
