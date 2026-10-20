const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { loadS3BacktestHistory } = require('../dist/services/backtestData.service');
const { simulateBacktest } = require('../dist/services/backtest.service');
const bucket=process.env.AWS_S3_BUCKET, key=process.env.BACKTEST_S3_MANIFEST_KEY;
const s3=new S3Client({region:process.env.AWS_REGION});
(async()=>{
 const object=await s3.send(new GetObjectCommand({Bucket:bucket,Key:key}));const manifest=JSON.parse(await object.Body.transformToString());
 global.fetch=async()=>{throw new Error('Direct Yahoo access is disabled during S3 verification');};
 let rows=0;for(let i=0;i<manifest.assets.length;i+=5){const results=await Promise.all(manifest.assets.slice(i,i+5).map(a=>loadS3BacktestHistory(a.symbol,key)));rows+=results.reduce((sum,r)=>sum+r.data.length,0);}
 console.log('VERIFIED',manifest.assets.length,'private S3 CSVs;',rows,'rows; all manifest hashes and coverage match');
 for(const symbol of ['TCS','INFY','RELIANCE','NIFTYBEES']){
  const history=await loadS3BacktestHistory(symbol,key);const report=simulateBacktest({symbol,startDate:'2022-01-01',endDate:'2026-10-19',initialCapital:100000,positionSize:20},history.data);
  console.log(JSON.stringify({symbol,source:history.key,origin:history.provenance.origin,observations:report.metadata.observations,trades:report.summary.totalTrades,endingCapital:report.summary.endingCapital}));
 }
})().catch(e=>{console.error(e.message);process.exitCode=1});
