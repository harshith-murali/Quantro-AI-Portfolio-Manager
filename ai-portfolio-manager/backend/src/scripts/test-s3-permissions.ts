import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';
import dotenv from 'dotenv';
import path from 'path';

// Load env explicitly for scratch script
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testS3() {
  const client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
  const bucket = process.env.AWS_S3_BUCKET;

  console.log(`Testing S3 Bucket: ${bucket}`);
  console.log(`Region: ${process.env.AWS_REGION}`);

  try {
    console.log('--- Testing ListObjectsV2 ---');
    const listCmd = new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 5 });
    const listRes = await client.send(listCmd);
    console.log('List successful. Found objects:', listRes.Contents?.length || 0);
  } catch (err: any) {
    console.error('List failed:', err.name, err.message);
  }

  try {
    console.log('--- Testing GetObject (Existing File) ---');
    // Try to get one of the keys we know might exist
    const getCmd = new GetObjectCommand({
      Bucket: bucket,
      Key: 'market-data/individual/RELIANCE_NS_2021-05-14_to_2026-05-14.csv',
    });
    const getRes = await client.send(getCmd);
    console.log('Get successful. Body type:', typeof getRes.Body);
  } catch (err: any) {
    console.error('Get failed:', err.name, err.message);
  }

  try {
    console.log('--- Testing PutObject (Test File) ---');
    const putCmd = new PutObjectCommand({
      Bucket: bucket,
      Key: 'ohlcv/test-connection.txt',
      Body: 'Connection test at ' + new Date().toISOString(),
    });
    await client.send(putCmd);
    console.log('Put successful.');
  } catch (err: any) {
    console.error('Put failed:', err.name, err.message);
  }
}

testS3();
